var Printer = require('mm-model-printer').Printer
var opts = {
    indentPattern: '\t', // using tabs for indentation
    colors: true,        //
    raw: false,          // program models are printed like source code
}
var p = new Printer(process.stdout, opts)


var mm = require('metamaya')
var printer = require('mm-model-printer').printer
var example = mm.compile('f(x) = x * x; a = f(5)')
printer.text("model: ").model(example).br()
printer.text("a = ").model(example.get('a').value()).br()
