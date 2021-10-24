import {h} from 'hastscript';
import {Link, Root} from "mdast";
import {MdastNode} from "mdast-util-to-hast/lib";

import {addExternalScripts, addScript,  addStyleSheets, addStyleTag} from "./utils/mdast";
import {createTangleSetUp, TANGLE_SCRIPTS, TANGLE_STYLESHEETS, TANGLE_STYLING} from "./utils/tangle";
import {getGuid} from "./utils/misc";
import {TanglePluginOptions, FieldAttributes, TangleField, TangleFieldShorthand} from "./index.d"

const defaultTanglePluginOptions: TanglePluginOptions = {
  start: "t",
  allowLinkNotation: true
}

/**
 * Determines whether a Link element `[...](...)` is a link or tangle-field
 *
 * Returns `true` if `node.url` is of the kind:
 * - `variable_name`
 * - `variable_name=[configuration]`
 * - `variable_name=[configuration]&style_attr=some_value]`
 * - etc.
 *
 * Returns `false` if `node.url` is of the kind:
 * - `/relative-path`
 * - `https://domain.ext/etc`
 * - `#title-2`
 *
 */
const isField = (node: Link): boolean =>
    !["/", "#"].includes(node.url?.[0]) && node.url?.slice(0, Math.min(4, node.url.length)) !== "http";


/**
 *
 * Convert a tangle field from a shorthand of link type to remark-directive type.
 * (`[display](x=1&y=2)` -> `:t[display]{x=1 y=2}`)
 *
 * Mutates a node from:
 *
 * ``` js
 * {
 *     type: "link",
 *     url: "variable_name=[configuration]&optional-style=some-value&more-optional-styles=some-other-value",
 *     ...
 * }
 * ```
 *
 * to
 *
 * ``` js
 * {
 *    type: "textDirective",
 *    attributes: {
 *        variable_name: "[configuration]",
 *        "optional-style": "some_value",
 *        "more-optional-styles": "some_other_value"
 *    },
 *    ...
 * }
 * ```
 *
 * TODO: do not change this in-place.
 *
 */
const processFieldShorthand = (node: TangleFieldShorthand, options: Partial<TanglePluginOptions>): TangleField => {
  node.type = "textDirective";
  node.name = options.start;
  node.attributes = {};

  // Convert url ("x=1&y=2") -> attributes ({x: "1", y: "2"})
  const attributeTuples = node.url.split("&").map(pair => pair.split("="));
  attributeTuples.forEach(([key, value]) => {
    // @ts-ignore
    node.attributes[key] = value;
  });

  delete node.title;
  delete node.url;

  return node;
}


/**
 * Read a default value and display template from a display string.
 *
 * For example:
 * - `"3 cookies"` -> `[3, "%d cookies"]`
 * - `"150. calories"` -> `[150, "%.0f cookies"]`
 *
 * TODO: These next two still have to be successfully implemented
 * - `"7.5%"` -> `[7.5, "%.1f%"]`
 * - `"chocolate_chip"` (with `{ choices: ["chocolate_chip", "oatmeal", ...] }`) -> `["chocolate_chip", "%s"]`
 *
 * @param displayString from a tangle directive of the kind `:t[displayString]{...}`
 * @param attributes required to process select-type inputs.
 */
function parseDisplayString(
    displayString: string,
    attributes: FieldAttributes
):[(null | string | number), string] {
  if (!displayString) return [null, "%s"];

  // If the display format includes an explicit fstring (e.g., `%.0f`, `%'d`, `%s`), return as is
  if (displayString.match(/(%('?)(.\d+)?[sdf])/)?.[0] === undefined) {
    // See if the display format includes a number (e.g., `100`, `1000.0`, `1,000.0`)
    const defaultValueString = displayString.match(/(((\d)*(,\d\d\d)*(\.)(\d+))|((\d)+(,\d\d\d)*(\.?)(\d*)))/)?.[0];
    // TODO: Add support for non-American numbers (1.000,00)

    if (defaultValueString !== undefined) {
      const defaultValue = parseInt(defaultValueString.replace(",", ""));

      const includeCommas = defaultValueString.includes(",");
      const precisionString = defaultValueString.match(/\.(\d*)/)?.[0];
      const precision = precisionString && precisionString.length-1

      // TODO: Add an option for `%'d` and `$'f` (to display `1000` as `1,000`)
      const fstring = `%${includeCommas ? "" : ""}${precision !== undefined ? `.${precision}f` : "d" }`

      const includesPercent = displayString.includes("%");

      return [defaultValue, includesPercent ? "percent" : displayString.replace(defaultValueString,fstring )];
    } else {
      // TODO: Add support for string-valued variables
      // NOTE: use TKSwitch
      const choices = attributes?.["data-choices"] ?? []

      const defaultValue = choices?.findIndex(choice => displayString.includes(choice));
      return [
        defaultValue,
        displayString.replace(choices[defaultValue], "%s"),
      ];
    }
  }

  return [null, displayString];
}


/**
 *
 * Add an appropriate `hName` and `hProperties` to subsequently convert remark-tangle fields to Tangle-proper fields.
 *
 * @param node
 */
const processFieldDirective = (node: TangleField) => {
  // BASIC FIELD PROPERTIES

  const [name, ...styleKeys] = Object.keys(node.attributes);

  const formula = node.attributes[name] ?? "";
  const fieldType = (formula === "") ? "reference" : "definition";

  const attributes: FieldAttributes = {
    "data-var": name,
    "data-type": fieldType,
  };

  // A special kind of reference has a display string of the kind "`variable_name`".
  // This will render as an interactive label (hovering will highlight all instances & dependencies)
  // This is automatically read as a reference even if it includes a definition.
  if (node.children?.[0]?.type === "inlineCode" && node.children?.[0]?.value === name) {

    // TODO: Dry this up a bit
    attributes.class = "TKLabel";
    attributes["data-format"] = "";
    attributes["data-type"] = "reference";
    const hast = h("span", attributes)

    node.data = node.data || {}
    node.data.hName = hast.tagName
    node.data.hProperties = hast.properties

    return node
  }

  if (styleKeys.length > 0) {
    attributes.style = {}
    styleKeys.forEach((key: string) => {
      // @ts-ignore
      attributes.style[key] = node.attributes[key]
    })
  }

  //  VARIABLE DEFINITIONS

  if (fieldType === "definition") {

    // Extract any parameters specific to this type of field.
    const rangeMatch = formula.match(/\[((?:\w?\d?)*)\.{2,3}((?:\w?\d?)*);?((?:\w?\d?)*)\]/)
    const selectMatch = formula.match(/\[((?:(\d?\w?)+,?\s*)+)\]/);

    if (rangeMatch !== null) { // ----------------- RANGE INPUT FIELD
      const [_, min, max, step] = rangeMatch
      attributes["data-min"] = parseInt(min);
      attributes["data-max"] = parseInt(max);
      attributes["data-step"] = parseInt(step);
      attributes["class"] = "TKAdjustableNumber";


    } else if (selectMatch !== null) { // -------- SELECT INPUT FIELD
      const choices = selectMatch?.[1].split(",");
      attributes["data-choices"] = choices;
      attributes["class"] = "TKSwitch";

    } else { // ---------------------------------------- OUTPUT FIELD
      attributes["data-formula"] = formula;
      attributes["class"] = "TKOutput"; // NOTE: This is not included in TangleKit; it is my own extension.

      const id = getGuid()
      attributes.id = id;
    }
  }

  // DEFAULT VALUE & DISPLAY TEMPLATE

  const displayString = node.children?.[0]?.value ?? ""; // TODO: Get this working with emphasis children
  const [defaultValue, displayTemplate] = parseDisplayString(displayString, attributes);

  attributes["data-default"] = defaultValue;
  attributes["data-format"] = displayTemplate;

  // UPDATE THE SYNTAX TREE
  const hast = h("span", attributes)

  node.data = node.data || {}
  node.data.hName = hast.tagName
  node.data.hProperties = hast.properties

  node.children = []; // TODO: Add children from TKSwitch

  return node;
}

/**
 * TODO: Sync hover/active between definitions & references.
 * TODO: Fix spacing bug (workaround with `margin-right: 1ch`)
 * @param options
 */
export default function tanglePlugin(this: any, options: Partial<TanglePluginOptions> = defaultTanglePluginOptions) {

  // Globally track all tangle fields so we can correctly link reference fields.

  const names = new Set([]); // Keep track of the names so we can correctly initialize Tangle
  const defaultValues: Record<string, string | number> = {}; // ""
  const outputFormulas: Record<string, string> = {}; // Keep track of formulas to correctly update Tangle.
  const outputIds: Record<string, string> = {}; // Keep track of ids to link output references to their definitions.
  const variableClasses: Record<string, string> = {}; // Keep track of classes for TangleKit.

  return (tree: Root) => {
    // To deal with this problem: https://github.com/vercel/next.js/issues/9607#issuecomment-901525030
    const { visit } = await import('unist-util-visit');

    visit(tree, (node: MdastNode) => {

      // (OPTIONAL) Process link notation `[...](...)` -> `:t[...]{...}`
      if (node.type === "link" && isField(node) && options.allowLinkNotation) {
        processFieldShorthand(node, options);
      };

      // FIRST PASS
      // Process textDirective (if the directive starts with the correct `options.start` name, by default `"t"`)
      if (node.type === "textDirective" && node.name === options.start) {
        processFieldDirective(node);

        const properties = node.data.hProperties;

        // Add to global tracking so that we can initialize reference fields correctly on the second pass
        if (properties.dataType === "definition") {

          const name = properties.dataVar;
          names.add(name);

          if (properties?.className)
            variableClasses[name] = properties.className;

          if (properties?.dataFormula)
            outputFormulas[name] = properties.dataFormula;

          if (properties?.id)
            outputIds[name] = properties.id;

          if (!defaultValues[name]) {
            defaultValues[name] = properties.dataDefault;
          }

        }
      }
    });

    // SECOND PASS
    // After having visited all the nodes, visit them again to add the appropriate classes & links
    visit(tree, (node: MdastNode) => {
      if ( node.type === 'textDirective' && node.name === options.start ) {

        if (!node.data.hProperties.className?.includes("TKLabel")) {
          node.data.hProperties.className = variableClasses[node.data.hProperties.dataVar];

          // Add a link from output references to the original definitions
          if (node.data.hProperties.className?.includes("TKOutput") && !node.data.hProperties.id) {
            node.data.hProperties.href = `#${outputIds[node.data.hProperties.dataVar]}`
            node.data.hName = "a"
          }
        }
      }
    })

    // ADD TANGLE SET-UP & DEPENDENCIES
    // TODO: Get rid of all of these external dependencies.
    addExternalScripts(tree, TANGLE_SCRIPTS);
    addStyleSheets(tree, TANGLE_STYLESHEETS);
    addStyleTag(tree, TANGLE_STYLING);
    // NOTE: This opens you up to XSS attacks. Tread carefully!
    const tangleSetUp = createTangleSetUp(Array.from(names), defaultValues, outputFormulas);
    addScript(tree, {value: tangleSetUp})

  }
}
