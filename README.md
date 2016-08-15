# Metamaya printer

The module exports the `Printer` class that outputs formatted text to
any writable stream.
It has specialized methods for printing text, numbers and line breaks and
indented blocks.

The printer is customized for pretty-printing metamaya program models.

The module also exports a ready-to-use `printer` object that is directed
to `process.stdout`.


# Installation

~~~
npm install metamaya-printer
~~~

# Example

~~~js
var mm = require('metamaya')
var printer = require('metamaya-printer').printer
var example = mm.compile('f(x) = x * x; a = f(5)')
printer.text("model: ").model(example).br()
printer.text("a = ").model(example.get('a').value()).br()
~~~
Output:
~~~
model: {
  body = @constructor {
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
var opts = {
    indentPattern: '\t', // using tabs for indentation
    colors: true,        //
    raw: false,          // program models are printed like source code
}
var p = new Printer(process.stdout, opts)
~~~

## Printing text

All printing methods return the printer object, so they are chainable.

**text(*str*)**

Prints unformatted text.

**format(*format, ...args*)**

Prints formatted text in *printf* style. The arguments are straightforwardly
passed to `util.format()`.


## Printing program models

If the `raw` option is not set (the default), program models are printed with
metamaya syntax, although the output doesn't necessarily compile.
If the `raw` option is set, program models are printed using Javascript
object syntax. Only enumerable properties are printed.

**model(*obj*)**

Prints an arbitrary program model in full depth.

**object(*obj*)**

Prints an object using metamaya syntax.
The object can be either a metamaya object or a plain old Javascript object.

**array(*obj*)**

Prints an array.

**keyword(*word*)**)

Prints a keyword or other reserved word.

**propertyDef(*key, value*)**

Prints a key-value pair.

**keyDef(*key*)**

Prints a freshly defined key.

**keyRef(*key*)**

Prints a key reference.

**number(*num*)**

Prints a number.

## Line breaks and rules

**br()**

Prints a soft line break.
Consequent calls to `br` will print a single line break.

**ln(*[str], [indent]*)**

Prints a standalone line with optional text.
Indentation is respected only if `indent` is true.

**rule(*[len], [pattern], [indent]*)**

Prints a horizontal rule in a separate line.
If all arguments are omitted, exactly 78 hyphens are printed.


## Blocks and indentation

The printer supports automatic indentation.
Each new line is indented according the current indentation depth.

**indent()**

Increases indentation depth.
Indentation takes effect just before the first character is printed
in the current line. Empty lines are not indented.

**unindent()**

Decreases indentation depth.

**open(*symbol*)**

Opens a new block with delimiter `symbol`. Increases indentation depth.

**close(*symbol*)**

Closes the current new block with delimiter `symbol`. Decreases indentation depth.

~~~js
printer.open('{')
printer.propertyDef('foo', 1);
printer.propertyDef('bar', 2);
printer.close('}')
~~~
Outputs:
~~~
{
    foo = 1
    bar = 2
}
~~~



# Documentation

If you need detailed API documentation, you can generate it yourself.
Just execute the following commands then open
`doc/metamaya-printer/<version>/index.html` in a browser.
~~~
cd path/to/metamaya-printer
npm install
npm run doc
~~~

