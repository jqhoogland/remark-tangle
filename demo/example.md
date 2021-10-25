## Interactive Writing: A plea for better communication

A few years ago, I first read the excellent essay by Bret Victor, "[What can a technologist do about climate change?](http://worrydream.com/ClimateChange/)." For its treatment of climate change alone, I can't recommend the essay enough—there's food for thought to keep you satiated for a few months. But, then, near the end, Victor sneaks in a little section titled ["Model-driven debate"](http://worrydream.com/ClimateChange/#media-debate) that has has kept me thinking *for years*. 


He begins with the example of Alan Blinder's "Cash for Clunkers" proposal. The federal government would offer car owners a rebate to exchange old, inefficient vehicles for newer ones. Proponents claimed it would cause massive emissions reductions. Meanwhile, critics claimed there were more cost-effective ways to reduce emissions. Who's right?

Of course, it's both and neither—the answer depends entirely on the parameters of the program. As Victor writes:

> "Many claims made during the debate offered no numbers to back them up. Claims with numbers rarely provided context to interpret those numbers. And _never_ were readers shown the _calculations_ behind any numbers. Readers had to make up their minds on the basis of hand-waving, rhetoric, bombast."

Victor asks us to imagine a better world: what if the author had proposed a *model* rather than mere words? Then, we, the readers, could make up our own minds. Instead of bombast, we get an informed debate about the underlying assumptions and resulting tradeoffs.

Let's look at an example (a slight modification of Victor's [original example](http://worrydream.com/ClimateChange/#media-debate)[^1]):

[^1]: The difference is that I haven't yet added the possibility of inputting a distribution. So the calculations for average MPG of old versus new cars is less precise than in Victor's case. (On the flip side, this coarser model is easier to modify for today's transportation fleet.)

> Say we allocate [$3.0 billion](budget=[0..10;0.1]&margin-right=1ch) for the following program: Car-owners who trade in an old car that gets less than [17 MPG](old_MPG_limit=[5..30]), and purchase a new car that gets better than [24 MPG](new_MPG_limit=[5..50]), will receive a [$3,500](rebate=[0..20000;100]&margin-right=1ch) rebate.
>
> We estimate that this will get [828,571 old cars](cars_traded&margin-right=0.5ch) off the road. It will save [1,068 million gallons](gallons_saved&margin-right=0.5ch) of gas (or [68 hours](hours_of_gas&margin-right=1ch&margin-right=0.5ch) worth of U.S. gas consumption.) It will avoid [9.97 million tons](tons_CO2_saved&margin-right=1ch) CO2e, or [0.14](percent_annual_emissions)% of annual U.S. greenhouse gas emissions.
>
> The abatement cost is [$301](dollars_per_ton_CO2e&margin-right=0.5ch) per ton CO2e of federal spending, although it’s [-\$20](dollars_per_ton_CO2e_on_balance&margin-right=0.5ch) per ton CO2e on balance if you account for the money saved by consumers buying less gas.

Try sliding clicking and dragging the items <span>in green</span> to update their values. You'll see the items <span>in blue</span> change as a result. To see how these outputs are computed, click on one of the blue items, and you'll see the calculation in the appendix to this article.

When I first saw this example, I had the kind of feeling that I imagine people in the '80s must have had when [they first saw wheels on a suitcase](https://betafactory.com/what-came-first-wheeled-luggage-or-a-man-on-the-moon-20f8b22529a3), that of dockworkers when [they first encountered shipping containers in the 60s](https://www.freightos.com/the-history-of-the-shipping-container/), or of late 15th century Europeans when they first read the results of movable type. A combination of "oh that's
so obvious!" with the shame of your civilization not having come up with the idea earlier and something akin to disgust at how we used to do things (or are still doing them).

Victor's vision is what journalism and argumentative writing should look like. Next to this better system, hand-waving opinion pieces border on offensive.

Unfortunately, his vision has gotten almost no attention since its conception. Victor provided a small library, [Tangle](http://worrydream.com/Tangle/guide.html), to implement models like these, but not much has happened with it in the last half decade. That's understandable—the library requires prior experience with web development, which makes it unapproachable for most people, but it also offers no direct integration with any major JavaScript (JS) framework, which does not encourage actual web
developers to use it.

In its place, we've seen success with somewhat similar projects like [Observable](https://observablehq.com/?utm_source=talk). Observable helps you write JS notebooks that are highly interactive and relatively easy to embed in other websites. But the experience is not seamless: you still need familiarity with JS. Of course, we've had Jupyter notebooks and R Markdown for a while. Unfortunately all of these notebook-based models remain somewhat clunky and cumbersome. None of them
offer a really fluent and easy inline input option like Tangle.

In this post, I'd like to look at a middleground—a (almost) no-code way to create interactive documents, which offers a much easier writing experience at the cost of sacrificing some of the customizability of Tangle or Observable/Python/R notebooks. Let's call it interactive Markdown.

Now, I'm not the first. Shortly after Victor published Tangle, there was an explosion in Markdown related integrations: [dynamic Markdown](https://tal-baum.github.io/dynamic-Markdown/index.html), [active Markdown](https://web.archive.org/web/20150219200704/http://activeMarkdown.org/) [fangle](https://jotux.github.io/fangle/), and [TangleDown](https://bollwyvl.github.io/TangleDown/) are what I could find. I'm sure there are yet more.

Still, I think there's a good reason to reinvent this wheel. For one, I'm not happy about the syntax of any of these options (though least unhappy with that of active/dynamic Markdown). The problem is that none of them are backwards compatible with existing Markdown interpreters. I'm of the strong opinion that since there are so many Markdown extensions already, if you come up with a new, it had better be backwards compatible.

Second, all but fangle miss the ability to do inline calculations. Third, none is actively maintained. Fourth, all of them work by compiling `.md` to `.html`; I'd like an option to compile to [`.jsx` from `.mdx`](https://mdxjs.com/), which I think would generally make this much easier to adopt for other people. Five, none offer an elegant way to display supplementary calculations the way Victor's example did.

There's also a good "cultural" reason to reinvent this wheel. Thanks to note-taking tools like Notion, Roam, and Obsidian, Markdown is having a moment. More people are playing around with Markdown than ever before, so if ever there were a time to build on Markdown, it's now.

Without further do, let me present interactive Markdown.

---

### An example

Let's take a look at a very simple example (again [from Victor](http://worrydream.com/Tangle/guide.html)):

> When you eat [3 cookies](cookies=[0..100]), you consume **[150 calories](calories=50*cookies)**. That's [7.5%](daily_percent&margin-right=1ch) of your recommended daily calories.

Under the hood, this looks as follows:

```
When you eat [3 cookies](cookies=[0..100]), 
you consume **[150 calories](calories=50*cookies)**. 
That's [7.5%](daily_percent) of your recommended daily calories.
```

Interactive Markdown is built around "**fields**". There are three in this example: `[3 cookies](cookies=[0..100])`, `[150 calories](calories=50*cookies)`, and `[7.5%](daily_percent)`.

If you're familiar with Markdown, then you'll recognize a field as a link. Like a link, every field is made up of two parts (`[text representation](variable configuration)`): a text representation of the element between square brackets `[]`(the link text or alt text for a media element) and the variable configuration between round brackets `()`(the link `href` or image `src`).

The reason for using the same syntax as a link is backwards compatibility. If there is no interactive Markdown interpreter, you only lose interactivity, not the reading experience.

There are three kinds of fields: **input**, **output**, and **reference** fields.

#### Input fields

`[3 cookies](cookies=[0..100])` is an **input field**. In the variable configuration,  `(cookies=[0..100])`, we *define* a variable, `cookies`, that takes its value from a range of `0` to `100`. In the text representation, `[3 cookies]`, we give the default value, `3`. The surrounding text is used as a template (for example, to specify units).[^2]

[^2]: It's a little confusing that `cookies` shows up on both the left- and right-hand sides. On the right-hand side, it has a semantic purpose: defining the variable `cookies`. On the left-hand side it has a purely stylistic purpose (to inform the reader what units we're using).

There are two kinds of input field, **range** and **select**:

- **Range Input** (`my_var=[min..max;step]`): By clicking on the range input and dragging left or right, the user can adjust its value between `min` and `max` in intervals of size `step`.
- **Select Input** (`my_var=[a,b,c]`): By clicking on the select input, the user cycles through the options `a`, `b`, `c`...

#### Output fields

`[150 calories](calories=50*cookies)` is an **output field**. On the right, we define the variable `calories` as the product of `50` and our previously defined variable `cookies`.

Since the definition contains neither a range `[min..max;step]` nor select `[a,b,c]` input, an output field is not directly adjustable via user input. It is dynamically computed from the other variables in a document's scope.

Because of this, the value of `150` is really more like a fallback than a default. An interactive Markdown interpreter won't ever user this value. A standard Markdown interpreter will render it as [150 calories](#) for the same experience just without the interactive part.

#### Reference fields

Lastly, `[7.5%](daily_percent)` is a **reference field**. Unlike definition fields (i.e., **input** and **output** fields) references do not contain an equal sign `=` in their variable configuration. They display a variable that has already (or will be) defined elsewhere in the page.

For example, we might put the calculation for `daily_percent` in the appendix to avoid cluttering the body text for your reader:

> ### Calculation for `daily_percent`
> - Daily recommended calories limit = [2,000 calories](daily_calories=[0..5000;50]&margin-left=1ch)
> - Percent cookie calories per day = [7.5%](daily_percent=calories/daily_calories&margin-left=1ch)

Behind the scenes, this is:

```
### Calculation for `daily_percent`
- Daily recommended calories limit = [2,000 calories](daily_calories=[0..5000;50])
- Percent cookie calories per day = [7.5%](daily_percent=calories/daily_calories) 

```

References are useful for separating long calculations from your story line. It also helps to remind readers what variable values are, so they don't have to scroll back and forth a hundred times.

Each variable should only have one definition field but can have arbitrarily many reference fields.

Note that reference fields act differently depending on whether they reference an input or output variable:

- **Input references** let you update the original variable. To the reader, input references are indistinguishable from input definitions.
- **Output references** link to the original output definition. So I recommend you define an output variable in the same place that you describe its calculation to readers.

---

## Conclusion

For the time being, it will take some technical know-how to get interactive Markdown up and running for yourself. If you're interested, I've written a [remark plugin](https://github.com/jqhoogland/remark-tangle) that you can  drop into an existing remark/rehype pipeline.

That's because interactive Markdown is still in its infancy. There are many features I'd like to get to that I haven't had the time for yet (e.g., automatic dimensions checking to make sure your calculations make sense, popover links to calculations, more math functions, support for distributions and other data types), not to mention tools to make working with interactive Markdown easier: an in-browser editor, a plugin for Obsidian support, etc.

If you're interested in all of this, make sure to subscribe to my newsletter to stay updated. And if you have any ideas, I'd love to hear from you. Check out the repository and raise an issue (or, even better, send a pull request).

---

## Appendix

### A more complicated example

Let's look at the more complicated example from the beginning.

Here is the example again (thanks to reference fields, it's perfectly in sync with the first instance):


> Say we allocate [$3.0 billion](budget=[0..10;0.1]&margin-right=1ch) for the following program: Car-owners who trade in an old car that gets less than [17 MPG](old_MPG_limit=[5..30]), and purchase a new car that gets better than [24 MPG](new_MPG_limit=[5..50]), will receive a [$3,500](rebate=[0..20000;100]&margin-right=1ch) rebate.
>
> We estimate that this will get [828,571 old cars](cars_traded&margin-right=1ch) off the road. It will save [1,068 million gallons](gallons_saved&margin-right=1ch) of gas (or [68 hours](hours_of_gas&margin-right=1ch&margin-right=1ch) worth of U.S. gas consumption.) It will avoid [9.97 million tons](tons_CO2_saved&margin-right=1ch) CO2e, or [0.14](_percent_annual_emissions)% of annual U.S. greenhouse gas emissions.
>
> The abatement cost is [$301](dollars_per_ton_CO2e&margin-right=1ch) per ton CO2e of federal spending, although it’s [-$20](dollars_per_ton_CO2e_on_balance&margin-right=1ch) per ton CO2e on balance if you account for the money saved by consumers buying less gas.



And here's what it actually looks like (the first example):

```
Say we allocate [$3.0 billion](budget=[0..10;0.1]&margin-right=1ch) for the following program: 
Car-owners who trade in an old car that gets less than [17 MPG](old_MPG_limit=[5..30]), 
and purchase a new car that gets better than [24 MPG](new_MPG_limit=[5..50]), 
will receive a [$3,500](rebate=[0..20000;100]&margin-right=1ch) rebate.

We estimate that this will get [828,571 old cars](cars_traded&margin-right=1ch) off the road. 
It will save [1,068 million gallons](gallons_saved&margin-right=1ch) of gas 
(or [68 hours](hours_of_gas&margin-right=1ch&margin-right=1ch) worth of U.S. gas consumption). 
It will avoid [9.97 million tons](tons_CO2_saved&margin-right=1ch) CO2e, 
or [0.14](_percent_annual_emissions)% of annual U.S. greenhouse gas emissions.

The abatement cost is [$301](dollars_per_ton_CO2e&margin-right=1ch) per ton CO2e of federal spending, 
although it’s [-\$20](dollars_per_ton_CO2e_on_balance&margin-right=1ch) per ton CO2e on balance 
if you account for the money saved by consumers buying less gas.

```

A few points to note:

- The number in the text representation determines display precision. If you're familiar with [format strings](https://www.cprogramming.com/tutorial/printf-format-strings.html), `3.0` is converted to `%.1f`, `17` to `%d`, `3,500` to `%'d`[^3], etc..
    - You can also use format strings directly in the text representation, e.g., `[%'d old cars](cars traded)`, but I don't recommend this because it won't be compatible with standard Markdown.
- `[0..10;0.1]` specifies a range with a step-size equal to `0.1`. By default, the step size is `1`.
- I haven't figured out spacing yet (hence `&margin-right=1ch`)

[^3]: Note: `%'d` is actually nonstandard. It puts commas (or periods) in the thousands places (depending on your locale). Another useful nonstandard addition is `+` or `-` for optionally separating the amount and magnitude as in `-$20`.

#### Cars Traded

- [`budget`](budget) = [$3.0 billion](budget=[0..10;0.1]&margin-left=1ch)
- [`overhead`](overhead)  = [$100 million](overhead=[0..1000;10]&margin-left=1ch)
- [`rebate`](rebate) = [$3500](rebate=[0..20000;100]&margin-left=1ch)
- [`cars_traded`](cars_traded) = ([`budget`](budget) - [`overhead`](overhead)) / [`rebate`](rebate) = [828571](cars_traded=(budget-overhead/1000)*1000000000/rebate&margin-left=1ch)

Here you see one more trick in interactive Markdown: A link containing an inline code element of the kind ``[`variable_name`](variable_name)`` is  a reference *label*. It gets a `TKLabel` class for easier formatting, and, eventually, will synchronously darken whenever you highlight any references to  or dependencies of its variable.

---

#### Gallons Saved

This is where my example diverges from [Victor's example](http://worrydream.com/ClimateChange/#media-debate). His calculation uses the distribution of mileage over current cars and cars being sold. I haven't yet added distributions to the interactive Markdown spec (though I plan to), so you'll have to accept a less precise version. Note that the comments come from Victor's original work.

##### Average mileage of old vehicles

> Assume that traded-in cars are chosen with equal probability from the pool of eligible cars. We use the harmonic average because we'll be calculating gallons consumed for constant miles, so we really want to be averaging gallons-per-mile.

- [`old_MPG_limit`](old_MPG_limit) = [17 MPG](old_MPG_limit=[5..50]&margin-left=1ch)
- [`average_current_MPG`](average_current_MPG) = [21 MPG](average_current_MPG=[5..50]&margin-left=1ch)
- [`var_current_MPG`](var_current_MPG) = [25 MPG](var_current_MPG=[0..200]&margin-left=1ch)
- [`average_old_MPG`](average_old_MPG) = ∫ x N(x; [`average_current_MPG`](average_current_MPG), [`var_current_MPG`](var_current_MPG)) from `-Infinity` to [`old_MPG_limit`](old_MPG_limit) = [14 MPG](average_old_MPG=old_MPG_limit*(average_current_MPG/20)&margin-left=1ch)

Alright so I haven't even actually added support for more complicated formulas like this. But it is coming.

##### Average mileage for vehicles currently being sold

> Assume that new cars are purchased with equal probability from the pool of eligible cars. The distribution really should be sales-weighted. I'm sure the data is available, but I couldn't find it.

- [`new_MPG_limit`](new_MPG_limit) = [15 MPG](new_MPG_limit=[5..50]&margin-left=1ch)
- [`average_new_MPG`](average_new_MPG) = [24 MPG](average_new_MPG=[5..50]&margin-left=1ch)
- [`var_new_MPG`](var_new_MPG) = [5 MPG](var_new_MPG=[0..20]&margin-left=1ch)
- [`average_new_MPG`](average_new_MPG) =   ∫ x N(x; [`average_new_MPG`](average_new_MPG), [`var_new_MPG`](var_new_MPG)) from [`new_MPG_limit`](new_MPG_limit) to `Infinity` = [30 MPG](average_new_MPG=new_MPG_limit*(1+average_current_MPG/30)&margin-left=1ch)

#### Average gallons saved per car replaced

> Assume that everyone who is buying a new car now would have eventually bought a similar car when their current car got too old. So the fuel savings from the program should be calculated over the remaining lifetime of the old car. Ideally we'd like the joint distribution of MPGs and age of the current fleet, but I can't find that data. So we'll just use averages.

- [`car_lifetime_miles`](car_lifetime_miles) = [150,000 miles](car_lifetime_miles=[0..1000000;10000]&margin-left=1ch)
- [`average_miles_left`](average_miles_left) = [25%](average_percent_miles_left=[0..1;0.01]) \* [`car_lifetime_miles`](car_lifetime_miles) =[37.5 miles](average_miles_left=average_percent_miles_left*car_lifetime_miles&margin-left=1ch)
- [`gallons_used_by_old_car`](gallons_used_by_old_car) = [`average_miles_left`](average_miles_left) / [`average_old_MPG`](average_old_MPG) = [2,662 gallons](gallons_used_by_old_car=average_miles_left/average_old_MPG&margin-left=1ch)
- [`gallons_used_by_new_car`](gallons_used_by_new_car) = [`average_miles_left`](average_miles_left) / [`average_new_MPG`](average_new_MPG) = [1,373 gallons](gallons_used_by_new_car=average_miles_left/average_new_MPG&margin-left=1ch)
- [`gallons_saved_per_car`](gallons_saved_per_car) = [`gallons_used_by_old_car`](gallons_used_by_old_car) - [`gallons_used_by_new_car`](gallons_used_by_new_car) = [1,289 gallons](gallons_saved_per_car=gallons_used_by_old_car-gallons_used_by_new_car&margin-left=1ch)

### Total gallons saved

- [`cars_traded`](cars_traded) = [828,571 cars](cars_traded&margin-left=1ch)
- [`gallons_saved`](gallons_saved) = [`gallons_saved_per_car`](gallons_saved_per_car) \* [`cars_traded`](cars_traded) = [1,068 million gallons](gallons_saved=gallons_saved_per_car*cars_traded/1000000&margin-left=1ch)

> The importance of models may need to be underscored in this age of “big data” and “data mining”. Data, no matter how big, can only tell you what happened in the _past_. Unless you’re a historian, you actually care about the _future_ — what _will_ happen, what _could_ happen, what _would_ happen if you did this or that. Exploring these questions will always require models. Let’s get over “big data” — it’s time for “big modeling”.

---

#### Hours of Gas Saved

- [`gallons_saved`](gallons_saved) = [1,068 million gallons](gallons_saved&margin-left=1ch)
- [`gallons_consumed_per_day`](gallons_consumed_per_day) = [378 million gallons](gallons_consumed_per_day=[0..1000;1])
- [`gallons_consumed_per_hour`](gallons_consumed_per_hour) = [`gallons_consumed_per_day`](gallons_consumed_per_day) / 24 =[16 million gallons](gallons_consumed_per_hour=gallons_consumed_per_day/24&margin-left=1ch)
- [`hours_of_gas`](hours_of_gas) = [`gallons_saved`](gallons_saved) / [`gallons_consumed_per_hour`](gallons_consumed_per_hour) = [68 hours](hours_of_gas=gallons_saved/gallons_consumed_per_hour&margin-left=1ch)

---

#### Tons of CO2 Saved

- [`gallons_saved`](gallons_saved) = [1,068 million gallons](gallons_saved&margin-left=1ch)
- [`kg_CO2_per_gallon_gas`](kg_CO2_per_gallon_gas) = [8.87 kg/gallon](kg_CO2_per_gallon_gas=[0..50;0.01]&margin-left=1ch)
- [`tons_CO2_saved`](tons_CO2_saved) = [`gallons_saved`](gallons_saved) \* [`kg_CO2_per_gallon_gas`](kg_CO2_per_gallon_gas) / 1000 = [9.47 million tons](tons_CO2_saved=gallons_saved*kg_CO2_per_gallon_gas/1000&margin-left=1ch)

> CO2 comprises 95% of a car's greenhouse gas [effective]() emissions. The other 5% include methane, nitrous oxide, and hydroflourocarbons. To account for these other gases, we divide the amount of CO2 by 0.95 to get CO2e (“carbon dioxide equivalent”).[^1]

- [`CO2_per_CO2e`](CO2_per_CO2e) = [95%](CO2_per_CO2e=[0..1;0.01]&margin-left=1ch)
- [`tons_CO2e_saved`](tons_CO2e_saved) = [`tons_CO2_saved`](tons_CO2_saved) / [`CO2_per_CO2e`](CO2_per_CO2e) = [9.7 million tons](tons_CO2e_saved=tons_CO2_saved/CO2_per_CO2e&margin-left=1ch)

---

#### Percent Annual Emissions

- [`tons_CO2e_saved`](tons_CO2e_saved) = [9.97 million tons](tons_CO2e_saved&margin-left=1ch)
- [`tons_CO2e_emitted_yearly`](tons_CO2e_emitted_yearly) = [6,983 million tons](tons_CO2e_emitted_yearly=[0..100000;1000]&margin-left=1ch)
- [`percent_annual_emissions`](percent_annual_emissions) = [`tons_CO2e_saved`](tons_CO2e_saved) / [`tons_CO2e_emitted_yearly`](tons_CO2e_emitted_yearly) \* 100 = [0.13](percent_annual_emissions=tons_CO2e_saved/tons_CO2e_emitted_yearly*100&margin-left=1ch)%

That last one should read something like `0.14%` for default options but not all formatting options are available yet.

---

#### Dollars per ton CO2e

- [`budget`](budget) = [$3.0 billion](budget&margin-left=1ch)
- [`tons_CO2e_saved`](tons_CO2e_saved) = [9.97 million tons](tons_CO2e_saved&margin-left=1ch)
- [`dollars_per_ton_CO2e`](dollars_per_ton_CO2e) = [`budget`](budget) / [`tons_CO2e_saved`](tons_CO2e_saved) = [$301.](dollars_per_ton_CO2e=budget*1000/tons_CO2e_saved&margin-left=1ch)

---

#### Dollars per ton CO2e on balance

- [`gallons_saved`](gallons_saved) = [1,068 million gallons](gallons_saved&margin-left=1ch)
- [`dollars_per_gallon`](dollars_per_gallon) = [$3.00](dollars_per_gallon=[0..10;0.01]&margin-left=1ch)
- [`dollars_saved_buying_less_gas`](dollars_saved_buying_less_gas) = [`gallons_saved`](gallons_saved) \* [`dollars_per_gallon`](dollars_per_gallon) = [$3.2 billion](dollars_saved_buying_less_gas=gallons_saved*dollars_per_gallon/1000&margin-left=1ch)

- [`budget`](budget) = [$3.0 billion](budget)
- [`dollars_saved_on_balance`](dollars_saved_on_balance) = [`budget`](budget) - [`dollars_saved_buying_less_gas`](dollars_saved_buying_less_gas) = [$200 million](dollars_saved_on_balance=1000*dollars_saved_buying_less_gas-1000*budget&margin-left=1ch)
  - Note: Ok so something's not  going right with this calculation  here. It should  be  some `200  million` by default.

- [`tons_CO2e_saved`](tons_CO2e_saved) = [9.97 million tons](tons_CO2e_saved)
- [`dollars_per_ton_CO2e_on_balance`](dollars_per_ton_CO2e_on_balance) = [`dollars_saved_on_balance`](dollars_saved_on_balance) / [`tons_CO2e_saved`](tons_CO2e_saved) = [$20.](dollars_per_ton_CO2e_on_balance=dollars_saved_on_balance/tons_CO2e_saved&margin-left=1ch)
