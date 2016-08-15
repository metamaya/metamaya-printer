var printer = require('mm-model-printer').printer

printer.open('{')
printer.propertyDef('foo', 1);
printer.propertyDef('bar', 2);
printer.close('}')
