var Printer = require('mmetamaya-printer').Printer
var opts = {
    indentPattern: '\t', // using tabs for indentation
    colors: true,        // using syntax highlight
    raw: false,          // program models are printed like source code
}
var p = new Printer(process.stdout, opts)
