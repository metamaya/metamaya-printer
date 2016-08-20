var mm = require('metamaya')
var printer = require('metamaya-printer').printer
var example = mm.compile('f(x) = x * x; a = f(5)')
printer.text("model: ").model(example).br()
printer.text("a = ").model(example.get('a').value()).br()
