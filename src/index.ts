import {visit} from 'unist-util-visit'
import {h} from 'hastscript'

export interface TanglePluginOptions {
  start: string;
}

const defaultTanglePluginOptions = {
  start: "t"
}

function getGuid() {
  const S4 = function() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  };
  return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

function getDisplayTemplate(displayString: string, attributes: {}):[(null | string | number), string, []] {
  if (!displayString) return [null, "%s", []];

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

      return [defaultValue, displayString.replace(defaultValueString,fstring ), []]
    } else {
      // TODO: Add support for string-valued variables
      // NOTE: use TKSwitch
      const choices = attributes?.["data-choices"] ?? []

      const defaultValue = choices?.findIndex(choice => displayString.includes(choice));
      return [
        defaultValue,
        displayString.replace(choices[defaultValue], "%s"),
        choices.map(choice => ({type: "span", children: [{type: "text", value: choice}]}))
      ];
    }
  }

  return [null, displayString, []]
}

/**
 * TODO: Sync hover/active between definitions & references.
 * TODO: Fix spacing bug (workaround with `margin-right: 1ch`)
 * @param options
 */
export default function tanglePlugin(this: any, options: Partial<TanglePluginOptions> = defaultTanglePluginOptions) {
  const names = new Set(); // Keep track of the names so we can correctly initialize Tangle
  const defaultValues: Record<string, string | number> = {}; // ""
  const outputFormulas: Record<string, string> = {}; // Keep track of formulas to correctly update Tangle.
  const outputIds: Record<string, string> = {}; // Keep track of ids to link output references to their definitions.
  const variableClasses: Record<string, string> = {}; // Keep track of classes for TangleKit.

    return (tree) => {

      visit(tree, (node) => {

        if (
          (node.type === 'textDirective' || node.type === "leafDirective")
         && node.name === options.start) {

          // BASIC FIELD PROPERTIES

          const data = node.data || (node.data = {})

          const [name, ...styleKeys] = Object.keys(node.attributes);
          names.add(name)

          const formula = node.attributes[name] ?? "";
          const fieldType = (formula === "") ? "reference" : "definition";

          const attributes = {
            "data-var": name,
            "data-type": fieldType,
          };

          if (styleKeys.length > 0) {
            attributes.style = {}
            styleKeys.forEach((key:string) => {
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
              variableClasses[name] = "TKAdjustableNumber";

            } else if (selectMatch !== null) { // -------- SELECT INPUT FIELD
              const choices = selectMatch?.[1].split(",");
              attributes["data-choices"] = choices;
              variableClasses[name] = "TKSwitch";

            } else { // ---------------------------------------- OUTPUT FIELD
              attributes["data-formula"] = formula;
              outputFormulas[name] = formula;
              variableClasses[name] = "TKOutput";

              const id = getGuid()
              outputIds[name] = id;
              attributes.id = id;
            }
          }

          if (node.type === "leafDirective"
            && node.name === options.start) {

            const nodeCopy = {...node, type: "textDirective"};

            const isOutput = !!outputFormulas[name]

            node.type = "table";
            node.align = ['left', 'center', 'left'];
            node.data = { hName: "table"}
            node.children = [
              {
                type: "tableRow",
                data: { hName: "tr" },
                children: [
                  {
                    type: "tableCell",
                    data: { hName: "td", hProperties: {class: "TKLabel"} },
                    children: [{type: "code", value: attributes["data-var"]}]
                  },
                  {
                    type: "tableCell",
                    data: { hName: "td", hProperties: { style: "margin-left: 2ch; margin-right: 2ch"} },
                    children: [{type: "text", value: "="}]
                  },
                  {
                    type: "tableCell",
                    data: { hName: "td" },
                    children: [isOutput ? { type: "code", value: formula} : nodeCopy]
                  }
                ]
              }
            ];

            if (isOutput) node.children.push( {
              type: "tableRow",
              data: { hName: "tr" },
              children: [
                {
                  type: "tableCell",
                  data: { hName: "td",  },
                  children: [{type: "text", value: ""}]
                },
                {
                  type: "tableCell",
                  data: { hName: "td", hProperties: { style: "margin-left: 2ch; margin-right: 2ch" },
                  children: [{type: "text", value: "="}]
                },
                {
                  type: "tableCell",
                  data: { hName: "td" },
                  children: [nodeCopy]
                }
              ]
            })

            return
          }

          // DEFAULT VALUE & DISPLAY TEMPLATE

          const displayString = node.children?.[0]?.value ?? "";
          const [defaultValue, displayTemplate, children] = getDisplayTemplate(displayString, attributes);
          if (fieldType === "definition" && !defaultValues[name]) {
            defaultValues[name] = defaultValue;
          }

          attributes["data-format"] = displayTemplate;

          // UPDATE THE SYNTAX TREE
          const hast = h("span", attributes)

            data.hName = hast.tagName
            data.hProperties = hast.properties
            node.children = children;

      })

      // After having visited all the nodes, visit them again to add the appropriate classes & links
      visit(tree, (node) => {
        if (
          node.type === 'textDirective'
         && node.name === options.start) {

          node.data.hProperties.class = variableClasses[node.data.hProperties.dataVar];

          // Add a link from output references to the original definitions
          if (node.data.hProperties.class === "TKOutput" && !node.data.hProperties.id) {
            node.data.hProperties.href = `#${outputIds[node.data.hProperties.dataVar]}`
            node.data.hName = "a"
          }

        }
      })

      const tangleSetUp = `
      // setUpTangle();
      
      var tangle = new Tangle (document.body, {
        initialize: function () {
${Object.keys(defaultValues).map(key => (`          this.${key} = ${defaultValues[key]};`)).join("\n")} 
        },
        update: function () {
          var scope = {${Array.from(names).map((name: string) => `${name}: this.${name}`).join(", ")}}
        
${Object.keys(outputFormulas).map(key => (`          this.${key} = math.evaluate("${outputFormulas[key]}", scope);`)).join("\n")}
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

      tree.children.push({
        type: "code",
        value: `
        .TKOutput { color: #4eabff; border-bottom: 1px dashed #4eabff;}
        .TKOutput:hover { background-color: #e3eef3;}
        .TKOutput:active { background-color: #4eabff; color: #fff; }
        a.TKOutput { text-decoration: none; }
        
        .TKAdjustableNumberHelp { color: #0dbe04!important }
        .TKAdjustableNumber { color: #0dbe04; border-bottom: 1px dashed #0dbe04 }
        .TKAdjustableNumber:hover { background-color: #e4ffed }
        .TKAdjustableNumber:active { background-color: #66c563; color: #fff; }
        
        .TKLabel pre {
          margin-top: 0;
          margin-bottom: 0;
        }
        .TKLabel { 
          color: #fff; 
          display: inline-block;
          text-align: center;
          line-height: 1.0;
          padding-left: 8px;
          padding-right: 8px;
          padding-top: 2px;
          padding-bottom: 3px;
          border-radius: 20px;
          border-radius: 20px
          border: 1px solid #85abbd;
          background-color: #91b9cc;
          width: "100%";
        }
        .TKLabel:hover {
          background-color: #5f9bb6;
          border-color: #6a828e;
        }
        `,
        data: {
          hName: "style",
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
