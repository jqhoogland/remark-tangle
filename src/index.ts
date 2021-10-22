import {visit} from 'unist-util-visit'
import {h} from 'hastscript'

export interface TanglePluginOptions {
  start: string;
}

const defaultTanglePluginOptions = {
  start: "t"
}

function getDisplayTemplate(displayString: string):[(null | string | number), string] {
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

      return [defaultValue, displayString.replace(defaultValueString,fstring )]
    } else {
      // TODO: Add support for string-valued variables
      // NOTE: use TKSwitch
      return [null, displayString];
    }
  }

  return [null, displayString]
}

export default function tanglePlugin(this: any, options: Partial<TanglePluginOptions> = defaultTanglePluginOptions) {
  const names = new Set();
  const defaultValues: Record<string, string | number> = {};
  const outputFormulas: Record<string, string> = {};
  const variableClasses: Record<string, string> = {};

    return (tree) => {

      visit(tree, (node) => {
        if (
          node.type === 'textDirective' ||
          node.type === 'leafDirective' ||
          node.type === 'containerDirective'
        ) {

          if (node.name === options.start) {

            // BASIC FIELD PROPERTIES

            const data = node.data || (node.data = {})

            const name = Object.keys(node.attributes)?.[0];
            names.add(name)

            const formula = node.attributes[name] ?? "";
            const fieldType = (formula === "") ? "reference" : "definition";

            const attributes = {
              "data-var": name,
              "data-type": fieldType
            };


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

                variableClasses[name] = "TKAdjustableNumber"

              } else if (selectMatch !== null) { // -------- SELECT INPUT FIELD
                const choices = selectMatch?.[1].split(",")

                attributes["data-choices"] = choices;

                variableClasses[name] = "TKSwitch"

              } else { // ---------------------------------------- OUTPUT FIELD
                outputFormulas[name] = formula
              }

            }


            // DEFAULT VALUE & DISPLAY TEMPLATE

            const displayString = node.children?.[0]?.value ?? "";
            const [defaultValue, displayTemplate] = getDisplayTemplate(displayString);

            if (fieldType === "definition" && defaultValue !== null) {
              defaultValues[name] = defaultValue;
            }

            attributes["data-format"] = displayTemplate;
            attributes["class"] = variableClasses[name];
            node.children = [];

            // UPDATE THE SYNTAX TREE

            const hast = h("span", attributes)

            data.hName = hast.tagName
            data.hProperties = hast.properties
          }
        }
      })

      const tangleSetUp = `
      // setUpTangle();
      
      var tangle = new Tangle (document.body, {
        initialize: function () {
${Object.keys(defaultValues).map(key => (`          this.${key} = ${defaultValues[key]};`)).join("\n")} 

          console.log({keys: Object.keys(this), values: Object.values(this)})
        },
        update: function () {
          var scope = {${Array.from(names).map((name: string) => `${name}: this.${name}`).join(", ")}}
        
${Object.keys(outputFormulas).map(key => (`          this.${key} = math.evaluate("${outputFormulas[key]}", scope);`)).join("\n")}
          console.log({keys: Object.keys(this), values: Object.values(this)})
       }
      });
      `

      const scripts = [
        "https://pagecdn.io/lib/mathjs/9.4.4/math.min.js",
        "http://worrydream.com/Tangle/Tangle.js",
        "http://worrydream.com/Tangle/TangleKit/TangleKit.js",
        "http://worrydream.com/Tangle/TangleKit/sprintf.js",
        "http://worrydream.com/Tangle/TangleKit/mootools.js",
        "http://worrydream.com/Tangle/TangleKit/BVTouchable.js"
      ]

      scripts.forEach((src: string) => {
        tree.children.push({
          type: "code",
          value: null,
          data: {
            hName: "script",
            hProperties: {
              type: "text/javascript",
              src,
            }
          }
        })
      })

      tree.children.push({
        type: "code",
        value: null,
        data: {
          hName: "link",
          hProperties: {
            href: "http://worrydream.com/Tangle/TangleKit/TangleKit.css",
            type: "text/css",
            rel: "stylesheet"
          }
        }
      })

      // NOTE: This opens you up to XSS attacks. Know what you are doing!
      tree.children.push({
        type: "code",
        lang: "javascript",
        meta: "null",
        value: tangleSetUp,
        data: {
          hName: "script",
        }
      })



    }
  }
