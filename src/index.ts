import {visit} from 'unist-util-visit'
import {h} from 'hastscript'

export interface TanglePluginOptions {
  start: string;
}

const defaultTanglePluginOptions = {
  start: "t"
}

export default function tanglePlugin(this: any, options: Partial<TanglePluginOptions> = defaultTanglePluginOptions) {
    return (tree) => {
      visit(tree, (node) => {
        if (
          node.type === 'textDirective' ||
          node.type === 'leafDirective' ||
          node.type === 'containerDirective'
        ) {

          if (node.name === options.start) {
            console.log("Processing Tangle Node...", {node}, node.children)
            const data = node.data || (node.data = {})

            const name = Object.keys(node.attributes)?.[0];
            const def = node.attributes[name];
            const fieldType = (def === "") ? "reference" : "definition";

            // Extract the display format fstring from children.
            const displayString = node.children?.[0]?.value ?? "";
            let displayTemplate = "";

            // See if the display format includes an explicit fstring (e.g., `%.0f`, `%'d`, `%s`)
            let fstring = displayString.match(/(%('?)(.\d+)?[sdf])/);

            if (fstring?.[0] !== undefined) {
              // If the display string already contains an explicit fstring, we leave it.
              displayTemplate = displayString;
            } else {
              // See if the display format includes a number (e.g., `100`, `1000.0`, `1,000.0`)
              const defaultValueString = displayString.match(/(((\d)*(,\d\d\d)*(\.)(\d+))|((\d)+(,\d\d\d)*(\.?)(\d*)))/)?.[0];
              // TODO: Add support for non-American numbers (1.000,00)

              if (defaultValueString !== undefined) {
                console.log({defaultValueString})

                const includeCommas = defaultValueString.includes(",");
                const precisionString = defaultValueString.match(/\.(\d*)/)?.[0];
                const precision = precisionString && precisionString.length

                console.log({hey: defaultValueString.match(/\.(\d*)/)})

                fstring = `%${includeCommas ? "'" : ""}${precision !== undefined ? `.${precision}f` : "d" }`

                displayTemplate = displayString.replace(defaultValueString, )
              } else {
                displayTemplate = displayString;
                // TODO: Add support for string-valued variables
              }
            }

            node.children = []

            const attributes = {
              "data-var": name,
              "field-type": fieldType,
              "data-format": fstring,
            }

            console.log({attributes})

            const hast = h("span", attributes)

            data.hName = hast.tagName
            data.hProperties = hast.properties
          }
        }
      })
    }
  }
