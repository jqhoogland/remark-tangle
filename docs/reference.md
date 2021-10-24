# React-Tangle > Reference

---

## Contents

- Definition Fields
  - Input Fields
    - Range Input
    - Select Input  
  - Output Fields
    - Allowed Expressions 
- Reference Fields
- Display Strings
- Customizing Notation
  - Wiki-link-style fields
  - Active-Markdown-style fields 

# Notation


Remark-Tangle is built around "**fields**" that compile to [Tangle](http://worrydream.com/Tangle/guide.html) elements. 

There are (1) **definition fields**, which define a new variable, such as

`[display string](new_variable=configuration)`,

and (2) **reference fields**, which display an already defined variable, such as

`[display_string](old_variable)`.

Just like the text content of a link or the alt text for an image, `display string` tells Remark-Tangle how to display `new_variable` or `old_variable`. It may also determine the default (or fallback) value for that variable. The `configuration` in a definition field determines what kind of field it is. 

#### Link Notation vs. Generic Directive Notation
By default, Remark Tangle uses link notation (pictured above).
This is useful because it offers an elegant fallback if Remark Tangle is unavailable.

Alternatively, you can use a notation based on the [generic directive syntax](https://talk.commonmark.org/t/generic-directives-plugins-syntax/444) (with the identifier `t`).

The two previous examples would look like:

`:t[display string]{new_variable=configuration}`,
`:t[display string]{old_variable}`.

Besides the preface `:t` and the curly braces `{}` instead of round brackets `()`, the only other difference is that 
additional key-value pairs (used in the `style` attribute) are separated by an ampersand (`&`) in link notation and a space (` `)  in directive notation.

> Note: for this to work, you must use this plugin after `remarkDirective`
> 
```js
unified()
  .use(remarkParse)
  // Do stuff
  .use(remarkDirective)
  .use(tanglePlugin)
// Do more stuff
```

## Definition Fields

There are two kinds of definition fields:
- **Input fields**
- **Output fields**

### Input Fields

Input fields define variables that users can directly change by clicking, dragging, etc.

There are currently two types of input fields:

- **Range Inputs**
- **Select Inputs**

#### Range Inputs

Range inputs define numeric variables that users can adjust by clicking and dragging.

`[display string](range_var=[min..max;step])`

- As in CoffeeScript, the range is inclusive for `..` but excludes `max` for `...` .
- Unlike in CoffeeScript, an omitted `min` defaults to `-Infinity`, and an omitted `max` defaults to `+Infinity`.
- `step` is optional (`[min..max]` is shorthand for `[min..max;1]`)

**Example 1**: [50. calories](calories_per_cookie=[10..100;5]) - `[50 calories](calories_per_cookie=[10..100;10])`

| property | value |
| --- | --- |
| `name` | `calories_per_cookie` |
| `value` | [50](calories_per_cookie) |
| `interval` | [10, 100] |
| `step` | 5 |
| `display template` | `"%.0f cal."`|

**Example 2**: [3 cookies](cookies_per_day=[0..]) - `[3 cookies](cookies_per_day=[10..])`

| property | value |
| --- | --- |
| `name` | `cookies_per_day` |
| `value` | [3](cookies_per_day) |
| `interval` | `[10, Infinity)` |
| `step` | `1` |
| `display template` | `"%d cookies"`|

> Note: You can use expressions like `3*pi` and `sqrt(5)` for `min`, `max`, and `step`. For a full list of allowed expressions, see [Allowed Expressions](#Allowed Expressions)

#### Select Inputs

> NOTE: This is not yet implemented.

Select inputs define variables that take their value from a set. Users can cycle through these values by clicking on the element.

`[display string](select_var=[option_1,option_2,option_3])`

**Example**: [chocolate_chip cookie](cookie=[chocolate_chip,oatmeal_raisin,ginger_snap]) - `[chocolate_chip](cookie=[chocolate_chip,oatmeal_raisin,ginger_snap])`

| property | value |
| --- | --- |
| `name` | `cookie` |
| `value` | [chocolate_chip](cookie) |
| `choices` | `["chocolate_chip", "oatmeal_raisin", "ginger_snap"]` |
| `display template` | `"%s"`|

> Note: Just as for the range input, you can use expressions like `3*pi` and `sqrt(5)` among your choices. For a full list of allowed expressions, see [Allowed Expressions](#Allowed Expressions)

### Output Fields

Output fields represent variables that are calculated from other variables. They cannot be directly manipulated. Instead, they update whenever the variables they depend on change their values. 

**Example 1**: [150 calories](calories_per_day=calories_per_cookie*cookies_per_day) = `[150 calories](calories_per_day=calories_per_cookie*cookies_per_day)`

| property | value |
| --- | --- |
| `name` | `calories_per_day` |
| `value` | [150 calories](calories_per_day) |
| `formula` | `= calories_per_cookie * cookies_per_day` | 
| `display template` | `"%d"`|

#### Allowed Expressions
You can do a lot with a formula:
- **math**: Model-Driven Markdown uses `mathjs`'s [expression parsing functionality](https://mathjs.org/docs/expressions/parsing.html) to calculate formulas, so you can use all the functions on [this page](https://mathjs.org/docs/reference/functions.html). <br/>
  (Note: there's no need to preface expressions with `math.`).

In the future, I might add support for:
- **logic & conditionals**: Use familiar javascript conditional statements: <br/>
  `!`, `a&&b`, `a||b`, `value??fallback`, `condition?a:b`, `condition_1?a:condition_2?b:condition_3?...`
- **dictionaries & lists**: <br/>`(key:value)[a]`, `[a,b,c][index]`

> Note on default values: with output fields, the default value is only used to determine your desired display precision. You can alternatively use a printf style format string (see [Display Strings](#Display Strings)). 
## Reference Fields

Reference fields reference variables that are defined elsewhere. If the variable changes according to its original definition, then any references to that variable will change in sync.

`[display string](variable_name)`

Reference fields act a little differently depending on whether they reference an input or output field.
- **Input fields**: References to input fields will also let you change the original value. They are indistinguishable to the reader.
  - Example: [50 calories](calories_per_cookie) - `[50 calories](calories_per_cookie)`
- **Output fields**: References to output fields contain links to the original definition. So for the sake of interpretation, I recommend you explain to the reader how you calculate an output field right next to its definition. If it requires a particularly meaty calculation, you might consider moving the definition and explanation to an appendix.
  - Example: [150 calories](calories_per_day) - `[50 calories]{calories_per_cookie)`

## Display Strings
The numbers in a display string serve two purposes:

1. Default (or fallback) value. 
   - `[50. calories]{calories_per_cookie=[10..100;5])` sets the initial value of `calories_per_cookie` to be `50`.
   - This is also the value that is rendered if you are using a standard markdown interpreter. 
2. Display precision. 
   - `50.` tells us we want to render a decimal point but no digits afterwards, 
   - `50.0` would require an additional digit after the decimal point,
   - `50` would hide the decimal point, etc.

Behind the scenes, the display number is converted to a "format specifier" similar (but not exactly the same) as [printf-style strings in C](https://www.cplusplus.com/reference/cstdio/printf/):
- `%d` for a signed decimal integer (e.g., `1`, `1000`, `0`).
- `%'d` to display large decimal integers with a comma or period every 3 decimal places (depending on locale) (e.g., `1`, `1,000`, `0`).
- `%.xf` for a signed float with `x` digits after the decimal point
  (e.g., `%.2f->1.0`, `%.1f->1000.0`, `%.0f->0.`).
- `%'.xf` combines `%'d` and `%.xf`.
- `%s` for a string of characters (useful with, e.g, the select input).

If you want, you can skip inputting a default value, and use one of these format specifiers directly. (E.g., `[%d calories]{calories_per_day)`). This will save you time with output definitions or references where it quickly becomes tedious to compute or look up the right numbers. 
