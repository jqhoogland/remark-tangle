export const TANGLE_SCRIPTS = [
        "https://pagecdn.io/lib/mathjs/9.4.4/math.min.js",
        "http://worrydream.com/Tangle/Tangle.js",
        "http://worrydream.com/Tangle/TangleKit/TangleKit.js",
        "http://worrydream.com/Tangle/TangleKit/sprintf.js",
        "http://worrydream.com/Tangle/TangleKit/mootools.js",
        "http://worrydream.com/Tangle/TangleKit/BVTouchable.js"
      ]

export const TANGLE_STYLESHEETS = [
    "http://worrydream.com/Tangle/TangleKit/TangleKit.css"
]

export const TANGLE_STYLING = `

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
  # flex: 1;
  # display: flex;
  # text-align: center;
  # justify-content: center;
}
.TKLabel:hover {
  background-color: #5f9bb6;
  border-color: #6a828e;
}

.TKLabel span {
  display: none;
}

`

/**
 * Return a script that initializes a tangle object for `document.body`.
 *
 * @param names: a list of all of the variables to initialize
 * @param defaultValues: a mapping of variable name to default values (for all variables)
 * @param outputFormulas: a mapping of variable names to update functions (only for output variables)
 */
export const createTangleSetUp = (names: string[], defaultValues: Record<string, string|number>, outputFormulas: Record<string, string>) => `   
var tangle = new Tangle (document.body, {
  initialize: function () {
${Object.keys(defaultValues).map(key => (`    this.${key} = ${defaultValues[key]};`)).join("\n")} 
  },
  update: function () {
    var scope = {${names.map((name: string) => `${name}: this.${name}`).join(", ")}}   
${Object.keys(outputFormulas).map(key => (`    this.${key} = math.evaluate("${outputFormulas[key]}", scope);`)).join("\n")}
  }  
});
`