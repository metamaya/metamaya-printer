"use strict";


const util = require('util');
const colors = require('colors/safe');
const modelMap = require("./modelMap");

const idRegex = /^[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*$/;

/**
 * Prints program models in a human readable form, but doesn't produce
 * parsable code.
 *
 * @constructor
 * @param {Stream} out - The output stream.
 * @param {string} [opts] - Formatting options.
 * @param {string} [opts.indentPattern='  '] - Indentation pattern.
 * @param {string} [opts.lineBreak='\n'] - The string used to print line breaks.
 * @param {boolean} [opts.raw] - Print models as raw objects.
 * @param {boolean} [opts.colors] - Use colors when printing models.
 * @param {boolean} [opts.annotated] - Annotate program models.
 * @param {boolean} [opts.compact] - May omit line breaks to get more compact
 *   output. See `br()`.
 * @param {integer} [opts.breakLength=78] - If `opts.compact` is active,
 *  br() will break a line only if it would grow longer than `breakLength`.
 */
function Printer(out, opts = {}) {
  this.out = out;
  this.indentDepth = 0;
  this.map = new Map();
  this.opts = opts;
  this.lineLength = 0;
  this.chunk = "";
  if (!this.opts.indentPattern) { this.opts.indentPattern = '  '; }
  if (!this.opts.lineBreak) { this.opts.lineBreak = '\n'; }
}
Printer.prototype = {


  /** CLient API **/


  /**
   * Prints an arbitrary program model with syntax highlight.
   *
   * @param {any} node - A program model node.
   * @returns the printer.
   */
  model(node) {
    this.map.clear();
    this._model(node);
    this._flush();
    return this;
  },


  /**
   * Prints plain text. A non-string value is converted to string before
   * printing.
   * *Note:* line breaks embedded in the text will be printed but they don't
   * respect indentation.
   *
   * @param {any} str - A javascript value.
   * @returns the printer.
   */
  text(str) {
    this._ensureIndent();
    str = str.toString();
    this.lineLength += str.length;
    this.chunk += str;
    this._flush();
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
    return this.text(util.format(format, ...rest));
  },


  /**
   * Prints a soft line break.
   * Consequent calls to `br()` will print only one line break.
   * In compact mode a line break is printed only if the line would grow
   * longer then `opts.breakLength`.
   *
   * @returns the printer.
   */
  br() {
    if (this.lineLength) { this._flush(true); }
    return this;
  },


  /**
   * Prints a standalone line with optional text.
   *
   * @param {string} [str] - A string that is printed in the line.
   * @returns the printer.
   */
  ln(str = '') {
    if (str) { this.br().text(str); }
    return this._flush(true);
  },


  /**
   * Increases indentation depth.
   * Indentation takes effect just before the first character is printed
   * in the current line (and not when line break is printed).
   * Empty lines are not indented.
   *
   * @returns the printer.
   */
  indent() {
    this.indentDepth++;
    return this;
  },


  /**
   * Decreases indentation depth.
   *
   * @returns the printer.
   */
  unindent() {
    if (this.indentDepth <= 0) { return; }
    this.indentDepth--;
    return this;
  },


  /**
   * Prints a horizontal rule in a separate line.
   *
   * @param {number} [len=78] - Length of the rule.
   * @param {string} [pattern=' '] - The basic pattern that builds up the rule.
   * @returns the printer.
   */
  rule(len = 78, pattern = '-') {
    return this.ln(pattern.repeat(len));
  },


  /** Extension API **/


  /**
   * Prints a program model with automatic layout.
   *
   * @param {any} node - A program model node.
   * @returns the printer.
   */
  _model(node) {
    if (node === undefined) {
      this._keyword('undefined');
    } else if (typeof node === 'object') {
      if (node === null) {
        this._keyword('null');
      } else if (Array.isArray(node)) {
        this._array(node);
      } else if (!this.opts.raw) {
        let f = Printer.map.get(Object.getPrototypeOf(node));
        if (f) {
          f.call(this, node);
        } else {
          this._object(node);
        }
      } else {
        this._object(node);
      }
    } else if (typeof node === 'function') {
      let name = node.name;
      if (name) {
        this._keyRef(name);
      } else {
        this._keyRef('<anonymous-function>');
      }
    } else if (typeof node === 'string') {
        this._print('"' + node + '"', colors.yellow);
    } else if (typeof node === 'number') {
      this._print(node.toString(), colors.yellow);
    } else {
      this._print(node.toString());
    }
    return this;
  },


  /**
   * Prints an object with metamaya syntax.
   *
   * @param {object} node - A metamaya object or plain Javascript object.
   * @returns the printer.
   */
  _object(node) {
    let s = this.map.get(node);
    if (s) {
      return this._print(s, colors.red);
    } else {
      this.map.set(node, '@circular[object]');
    }
    if (node.constructor !== Object) {
      this._keyRef(node.constructor.name).nbspace();
    }
    this.open('{');
    for (let key of Object.keys(node)) {
      this._keyDef(key).token(' = ')._model(node[key])._terminator();
    }
    this.close('}');
    return this;
  },


  /**
   * Prints an array with metamaya syntax.
   *
   * @param {object} node - A metamaya array or plain Javascript array.
   * @returns the printer.
   */
  _array(node) {
    let s = this.map.get(node);
    if (s) {
      return this._print(s, colors.red);
    } else {
      this.map.set(node, '@circular[array]');
    }
    this.open('[');
    for (let item of node) {
      this._model(item)._separator();
    }
    this.close(']');
    return this;
  },


  /**
   * Prints a parenthesized list.
   *
   * @param {array} list - A list of program nodes.
   * @param {boolean} [breakable] - If true, the list can be broken to lines.
   * @returns the printer.
   */
  _parenList(list, breakable) {
    this._print('(');
    if (breakable) { 
      this._flush();
    }
    let comma = false;
    for (let arg of list) {
      if (!breakable && comma) {
        this._print(', ');
      }
      comma = true;
      this._model(arg);
      if (breakable) {
        this._separator();
      }
    }
    this._print(')');
    return this;
  },



  /**
   * Prints a freshly defined property key with syntax highlight.
   *
   * @param {string|number|symbol} key - A property key.
   * @returns the printer.
   */
  _keyDef(key) {
    // TODO: print [] when needed
    this._print(key.toString(), colors.green);
    return this;
  },


  /**
   * Prints a property key reference with syntax highlight.
   *
   * @param {string|number|symbol} key - A property key.
   * @returns the printer.
   */
  _keyRef(key) {
    // TODO: print [] when needed
    this._print(key.toString(), colors.cyan);
    return this;
  },


  /**
   * Prints a reserved word with syntax highlight.
   *
   * @param {string} word - A reserved word.
   * @returns the printer.
   */
  _keyword(word) {
    this._print(word, colors.magenta);
    return this;
  },


  /** layout **/


  /**
   * Opens a new block.
   *
   * @param {string} sym - The opening symbol of the block.
   * @returns the printer.
   */
  _open(sym) {
    return this._print(sym)._flush(!this.opts.compact).indent();
  },


  /**
   * Closes the current block.
   *
   * @param {string} sym - The closing symbol of the block.
   * @returns the printer.
   */
  _close(sym) {
    this.needSeparator = false;
    return this._flush(!this.opts.compact).unindent()._print(sym);
  },


  /**
   * Prints a metamaya terminator (`;`).
   *
   * @returns the printer.
   */
  _terminator() {
    this._flush();
    if (this.opts.compact) {
      this.needTerminator = true;
      this.lineLength += 2;
    } else {
      this._flush(true);
    }
    return this;
  },


  /**
   * Prints a metamaya separator (`,`).
   *
   * @returns the printer.
   */
  _separator() {
    if (this.needSeparator) { return; }
    this._flush();
    this.needSeparator = true;
    this.lineLength += 2;
    if (!this.opts.compact) { this._flush(true); }
    return this;
  },


  /**
   * Prints a non breaking space.
   *
   * @returns the printer.
   */
  _nbspace() {
    this._ensureIndent();
    this.lineLength += 1;
    this.chunk += ' ';
    return this;
  },


  /**
   * Prints a piece of text with optional color.
   *
   * @param {string} str - Text to print.
   * @param {function} [colorize] - A function that returns its argument
      string colorized.
   * @returns the printer.
   */
  _print(str, colorize) {
    this._ensureIndent();
    this.lineLength += str.length;
    if (this.colors && colorize) { str = colorize(str); }
    this.chunk += str;
    return this;
  },


  /**
   * Returns true if the string is a valid metamaya identifier.
   *
   * @param {string} key - A property key.
   */
  _isIdentifier(key) {
    // todo: come up with a regex that gives precise result, but metamaya
    // identifiers must follow Javascript identifier syntax and it is quite
    // complex. See:
    // http://stackoverflow.com/questions/2008279/validate-a-javascript-function-name
    return typeof key === 'string' && idRegex.test(key);
  },


  /** Private functions **/


  /**
   * Prints indentation if it is required in the current position.
   */
  _ensureIndent() {
    if (!this.lineLength) {
      this.chunk += this.opts.indentPattern.repeat(this.indentDepth);
      this.lineLength += this.opts.indentPattern.length *
        this.indentDepth;
    }
  },


  /**
   * Writes out the current chunk and all decorations.
   * Emits a line break *before* emitting the chunk if the chunk is
   * too long to fit into the current line.
   *
   * @param {boolean} [needBreak] - Enforces line break.
   */
  _flush(needBreak) {
    if (this.lineLength > this.opts.breakLength) { needBreak = true; }

    if (this.needSeparator) {
      this.needSeparator = false;
      if (needBreak) {
        this.out.write(',');
      } else {
        this.out.write(', ');
      }
    }

    if (this.needTerminator) {
      this.needTerminator = false;
      if (!needBreak) {
        this.out.write('; ');
        this.lineLength += 2;
      }
    }

    if (needBreak) {
      this.out.write(this.opts.lineBreak);
      this.lineLength = 0;
    }

    this.out.write(this.chunk);
    this.chunk = "";
    return this;
  },
};


/**
 * Maps program model classes to printing functions.
 */
Printer.map = modelMap;


/**
 * Predefined printer object that prints to `stdout` with colors.
 */
let printer = new Printer(process.stdout, {
  colors: true,
  annotated: true,
  compact: true
});


module.exports = {
  printer: printer,
  Printer: Printer
};
