# Model-Driven Markdown `(md^2)`

A tool for creating interactive markdown documents.

---

![demo-video](/docs/media/demo-video.gif)

Model-Driven Markdown extends plain text markdown with a special notation for adding controls and variables. It's like a lightweight version of [Jupyter](https://jupyter.org/), [Observable](https://observablehq.com/), [R](https://bookdown.org/yihui/rmarkdown/notebook.html), or [Wolfram](https://www.wolfram.com/notebooks/) notebooks. Or, if you like, a messier alternative to spreadsheets.

A sample Model-Driven Markdown file looks like this:

```
When you eat [3 cookies](cookies=[0..100]), you consume **[150 calories](calories=50*cookies)**. 
That's [7.5%](daily_percent=calories/2000) of your recommended daily calories.
```

And, when compiled to `html` or `mdx`, yields a page that looks like this:

![demo-video](/docs/media/demo-video-cookies.gif)

When [rendered](), `[3 cookies](cookies=[0..100])` is replaced with a slider from `0` to `100` that has a default value of `3`. Changing the value of `cookies` will update all the other fields that depend on it.

## Notation

The format is based on the syntax for links and images, so it's backwards compatible with normal markdown (if you can ignore broken links). GitHub renders the above as follows:

> When you eat [3 cookies](cookies=[0..100]), you consume **[150 calories](calories=50*cookies)**. That's [7.5%](daily_percent=calories/2000) of your recommended daily calories.

It's also highly customizable, so if you prefer the format of, for example, [active-markdown](https://github.com/alecperkins/active-markdown), you can use `[3 cookies]{cookies: 0..100}`

See [the reference](/docs/reference.md) for a full account of different types of fields and their configuration.

## Getting Started

TODO: Write this out

## Contribute


## Authors

- [Jesse Hoogland](https://jessehoogland.com)

The concepts and notation are heavily inspired by a bunch of different projects:

- 🙌 **[Tangle](http://worrydream.com/Tangle/guide.html)** by [Bret Victor](http://worrydream.com/) is at the root of all of these projects.
- [Active Markdown](https://github.com/alecperkins/active-markdown) by [Alec Perkins](https://github.com/alecperkins) most inspired the syntax.
- [Dynamic Markdown](https://github.com/tal-baum/dynamic-markdown) by [Tal Lorberbaum](https://github.com/tal-baum)
- [Fangle](https://jotux.github.io/fangle/) by [@jotux](https://github.com/jotux)
- [TangleDown](https://github.com/bollwyvl/TangleDown/tree/master/tangledown) by [Nicholas Bollweg](https://github.com/bollwyvl)

## License

[MIT License]()
