"use strict"


const util = require('util');
const colors = require('colors/safe');
const modelMap = require("./modelMap");

/**
 * Prints program models in a human readable form, but doesn't produce
 * parsable code.
 *
 * @constructor
 * @param {Stream} out - The output stream.
 * @param {string} [opts] - Formatting options.
 * @param {string} [opts.indentPattern='  '] - Indentation pattern.
 * @param {boolean} [opts.raw] - Prints the model as raw objects.
 * @param {boolean} [opts.colors] - Use colors when printing models.
 */
function Printer (out, opts = {}) {
	this.out = out;
	this.indentDepth = 0;
	this.wasBreak = true;
	this.opts = opts;
	if (!this.opts.indentPattern)
		this.opts.indentPattern = '  ';
}
Printer.prototype = {
	/**
	 * Prints an arbitrary program model with syntax highlight.
	 *
	 * @param {any} node - A program model node.
	 * @returns the printer.
	 */
	model(node) {
		this.wasBreak = false;
		if (node === undefined) {
			this.keyword('undefined');
		} else if (typeof node === 'object') {
			if (node === null) {
				this.keyword('null');
			} else if (Array.isArray(node)) {
				this.array(node);
			} else if (!this.opts.raw) {
				let f = Printer.map.get(Object.getPrototypeOf(node));
				if (f) {
					f.call(this, node);
				} else {
					this.object(node);
				}
			} else {
				this.object(node);
			}
		} else if (typeof node === 'function') {
			let name = node.name;
			if (name)
				this.text(name);
			else
				this.text('<anonymous-function>');
		} else if (typeof node === 'string') {
			if (this.opts.color) {
				this.text(colors.yellow('"' + node + '"'));
			} else {
				this.text('"' +	node + '"');
			}
		} else if (typeof node === 'number') {
			this.number(node);
		} else {
			this.text(node.toString());
		}
		return this;
	},


	/**
	 * Prints an object using metamaya syntax.
	 *
	 * @param {object} node - a plain JS object or metamaya object.
	 * @returns the printer.
	 */
	object (node) {
		this.wasBreak = false;
		if (node.constructor !== Object) {
			this.text(node.constructor.name).text(' ');
		}
		this.open('{');
		for (let key of Object.keys(node)) {
			this.propertyDef(key, node[key]);
		}
		this.close('}');
		return this;
	},


	/**
	 * Prints an array with syntax highlight.
	 *
	 * @param {array} node - An array.
	 * @returns the printer.
	 */
	array (node) {
		this.wasBreak = false;
		this.open('[');
		for (let item of node) {
			this.model(item).text(',').br();
		}
		this.close(']');
		return this;
	},


	/**
	 * Prints a keyword or other reserved word with syntax highlight.
	 *
	 * @param {string} word - A reserved word.
	 * @returns the printer.
	 */
	keyword(word) {
		this.wasBreak = false;
		if (this.opts.colors)
			this.text(colors.yellow(word));
		else
			this.text(word);
	},


	/**
	 * Prints a key-value pair with syntax highlight.
	 *
	 * @param {string|number|symbol} key - Property key.
	 * @param {any} value - Property value.
	 * @returns the printer.
	 */
	propertyDef(key, value) {
		this.keyDef(key).text(' = ').model(value).br();
		return this;
	},


	/**
	 * Prints a freshly defined key with syntax highlight.
	 *
	 * @param {string|number|symbol} key - A property key.
	 * @returns the printer.
	 */
	keyDef(key) {
		// TODO: print [] when needed
		this.wasBreak = false;
		if (this.opts.colors)
			this.text(colors.cyan(key.toString()));
		else
			this.text(key.toString());
		return this;
	},


	/**
	 * Prints a key reference with syntax highlight.
	 *
	 * @param {string|number|symbol} key - A property key.
	 * @returns the printer.
	 */
	keyRef(key) {
		// TODO: print [] when needed
		this.wasBreak = false;
		if (this.opts.colors)
			this.text(colors.green(key.toString()));
		else
			this.text(key);
		return this;
	},


	/**
	 * Prints a number with syntax highlight.
	 *
	 * @param {number} num - A number.
	 */
	number (num) {
		this.wasBreak = false;
		if (this.opts.colors)
			this.text(colors.yellow(num.toString()));
		else
			this.text(num.toString());
		return this;
	},


	/**
	 * Prints plain text.
	 * *Note:* line breaks in the text will be printed but they don't respect
	 * indentation.
	 *
	 * @param {string} str - An plain string.
	 * @returns the printer.
	 */
	text(str) {
		this.wasBreak = false;
		if (this.needIndent) {
			for (let i = 0; i < this.indentDepth; i++)
				this.out.write(this.opts.indentPattern);
			this.needIndent = false;
		}
		this.out.write(str);
		return this;
	},


	/**
	 * Prints formatted text using `util.format()`.
	 * *Note:* line breaks in the text will be printed but they don't respect
	 * indentation.
	 *
	 * @param {string} format - The format string containing placeholders.
	 * @param {any} [...rest] - arguments that will be substituted for
	 *                          placeholders.
	 * @returns the printer.
	 */
	format(format, ...rest) {
		this.wasBreak = false;
		if (this.needIndent) {
			for (let i = 0; i < this.indentDepth; i++)
				this.out.write(this.opts.indentPattern);
			this.needIndent = false;
		}
		this.out.write(util.format(format, ...rest));
		return this;
	},


	/**
	 * Prints a soft line break.
	 * Consequent calls to `br()` will print only one line break.
	 *
	 * @returns the printer.
	 */
	br() {
		if (!this.wasBreak) {
			this.wasBreak = true;
			this.out.write('\n');
			this.needIndent = true;
		}
		return this;
	},


	/**
	 * Prints a standalone line with optional text.
	 *
	 * @param {string} [str] - A string that is printed in the line.
	 * @param {boolean} [indent] - False to omit indentation.
	 * @returns the printer.
	 */
	ln(str = '', indent) {
		this.br();
		this.needIndent = indent;
		this.text(str).br();
		return this;
	},


	/**
	 * Prints a horizontal rule in a separate line.
	 *
	 * @param {number} [len=78] - Length of the rule.
	 * @param {string} [pattern=' '] - The basic pattern that builds up the rule.
	 * @param {boolean} [indent] - False to omit indentation.
	 * @returns the printer.
	 */
	rule(len = 78, pattern = '-', indent) {
		this.ln(pattern.repeat(len));
		return this;
	},


	/**
	 * Increases indentation depth.
	 * Indentation takes effect just before the first character is printed
	 * in the current line (and not when line break is printed).
	 * Empty lines are not indented.
	 *
	 * @returns the printer.
	 */
	indent () {
		this.indentDepth++;
		return this;
	},


	/**
	 * Decreases indentation depth.
	 *
	 * @returns the printer.
	 */
	unindent() {
		this.indentDepth--;
		return this;
	},


	/**
	 * Opens a new block.
	 * Prints `sym` followed by a soft line break and increases indentation.
	 *
	 * @param {string} sym - The opening symbol of the block.
	 * @returns the printer.
	 */
	open(sym) {
		this.text(sym).br().indent();
		return this;
	},


	/**
	 * Closes the current block.
	 * Prints a soft line break, decreases indentation and prints `sym`.
	 *
	 * @param {string} sym - The closing symbol of the block.
	 * @returns the printer.
	 */
	close(sym) {
		this.br().unindent().text(sym);
		return this;
	},
}


/**
 * Maps program model classes to printing functions.
 */
Printer.map = modelMap;


/**
 * Predefined printer object that prints to `stdout` with colors.
 */
let printer = new Printer(process.stdout, { colors: true });


module.exports = {
	printer: printer,
	Printer: Printer
}
