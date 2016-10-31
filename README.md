# Metamaya printer

Pretty printer for [metamaya](https://www.npmjs.com/package/metamaya)
program models.
It is useful when debugging metamaya programs.

The module exports the `Printer` class that prints text to
any writable stream. The `print()` method accepts format strings similar to
`console.log()`.
The module also exports two predefined printer objects, both directed to
`process.stdout`.

- `printer` - for canonical output (one element/line)
- `logger` - for space efficient output.



# Installation

~~~
npm install metamaya-printer
~~~

# Example

~~~js
var mm = require('metamaya')
var printer = require('metamaya-printer').printer
var example = mm.compile('f(x) = x * x; a = f(5)')
printer.println("model: %m", example)
printer.println("a = %m", example.get('a').value())
~~~
Output:
~~~
model: {
  body = {
    f = (x) => mul(x, x)
    a = f(5)
  }
}
a = 25
~~~

# API

## Creating a printer object

~~~js
var Printer = require('mm-model-printer').Printer
var p = new Printer(process.stdout, {
    breakLimit: 0,  // print only one elements per line
    annotate: true  // annotate program models to provide more insight
})
~~~

List of available options:

- `indentSize` - Number of spaces used per indentation level. Defaults to 2.
- `lineBreak` - The string used to print line breaks. Defaults to `\n`.
- `raw` - Print program models as raw objects. Defaults to false.
- `colors` - Use colors when printing models. Defaults to true.
- `annotate` - Annotate program models. Defaults to false.
- `breakLimit` - Number of characters before breaking a line. Defaults to 78.

Note that an actual line can be longer than `breakLimit`.
To get nicely formatted output, provide 0 as break limit.

## Printing formatted output

**print(*fmt, ...*)**

Prints all of its arguments similarly to `console.log()`.
If the first argument is a string, it is treated as a *format string*.
In the format string you can use the following *placeholders*:

- `%d` - prints a number (integer or floating point)
- `%s` - prints a string
- `%m` - prints a metamaya program model

Each placeholder consumes a single argument.
All remaining arguments are printed sequentially using a space separator.

Circular references are detected and indicated in the output.


**println(*fmt, ...*)**

The same as `print()` but prints a line break after printing its arguments.
Call it without arguments to print only a line break.

**model(*model*)**

Prints a metamaya program model.


## Printing line breaks and rules

**br()**

Prints a soft line break.
Consequent calls to `br()` yield a single line break.

**rule(*[chr]*)**

Prints a horizontal rule into a separate line.
You can specify a custom character to build up the rule,
otherwise `-` is used.


## Method chaining

All of the above methods return the printer object,
so method calls can be chained.


# Documentation

The package supports **jsdoc**. To generate API documentation,
execute the following commands in the package directory.
~~~
npm install
npm run doc
~~~
When you're done, open
`doc/metamaya-printer/<version>/index.html` in your browser.
