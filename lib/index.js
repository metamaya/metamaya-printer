"use strict";


const util = require('util');
const colors = require('colors/safe');
const modelMap = require("./modelMap");

const idRegex = /^[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*$/;

/**
 * Constructs a printer object.
 *
 * @class
 * @classdesc Prints program models in a human readable form, but doesn't
 * necessarily produce parsable code.
 * @param {Stream} out - The output stream.
 * @param {string} [options] - Formatting options.
 * @param {number} [options.indentSize] - Number of spaces used for an indentation level.
 * @param {string} [options.lineBreak='\n'] - The string used to print line breaks.
 * @param {boolean} [options.raw] - Print models as raw objects.
 * @param {boolean} [options.colors] - Use colors when printing models.
 * @param {boolean} [options.annotate] - Annotate program models.
 * @param {number} [options.breakLimit=78] - Maximal line width.
 */
function Printer(out, options = {}, depth = 0) {
  this.out = out;
  this.options = Object.assign({}, Printer.defaultOptions, options);

  this.seen = new Map();
  this.lineLength = 0;
  this.block = { depth: depth, terminator: ';' };
}
Printer.defaultOptions = {
  indentSize: 2,
  breakLimit: 78,
  lineBreak: '\n',
  colors: true
};
Printer.prototype = {


  /* Client API */


  /**
   * Prints its arguments to the output in `console.log()` style.
   * If `fmt` is a string then you can use the following placeholders:
   *
   * - `%s` - prints a string
   * - `%d` - prints a number (integer or floating point)
   * - `%m` - prints a metamaya program model
   *
   * Each placeholder consumes an argument. Excess arguments are printed
   * sequentially with a space used as separator.
   *
   * @param {any} [fmt] - Format string or any other value.
   * @returns the printer.
   */
  print(fmt) {
    let index = 0;
    if (typeof fmt === 'string') {
      index++;
      let lastPos = 0;
      for (let pos = 0; pos < fmt.length;) {
        if (fmt.charCodeAt(pos) === 37 && pos + 1 < fmt.length) {
          let code = fmt.charCodeAt(pos+1);
          if (code === 37) {
            this._emit(fmt.substring(lastPos, pos+1));
            lastPos = pos = pos + 2;
            continue;
          }
          if (index >= arguments.length) {
            // print escape sequence if there's no parameter to substitute
            this._emit(fmt.substring(lastPos, pos+2));
            lastPos = pos = pos + 2;
            continue;
          }
          let arg = arguments[index++];
          switch (code) {
            case 100: // 'd'
              this._emit(fmt.substring(lastPos, pos));
              this._emit(String(Number(arg)));
              lastPos = pos = pos + 2;
              break;
            case 109: // 'm'
              this._emit(fmt.substring(lastPos, pos));
              this.model(arg);
              lastPos = pos = pos + 2;
              break;
            case 115: // 's'
              this._emit(fmt.substring(lastPos, pos));
              this._emit(String(arg));
              lastPos = pos = pos + 2;
              break;
          }
        } else {
          pos++;
        }
      }
      this._emit(fmt.substring(lastPos));
    }
    // print remaining arguments
    for (let i = index; i < arguments.length; ++i) {
      if (i > 0) {
        this._emit(' ');
      }
      this._emit(String(arguments[i]));
    }
    return this;
  },


  /**
   * The same as {@link print} but prints a line break after printing
   * all of its arguments.
   *
   * @param {any} [fmt] - Format string or any other value.
   * @returns the printer.
   */
  println(fmt) {
    this.print(...arguments);
    this.out.write(this.options.lineBreak);
    this.lineLength = 0;
    return this;
  },


  /**
   * Starts a new empty line.
   *
   * @returns the printer.
   */
  br() {
    if (this.lineLength) {
      this.out.write(this.options.lineBreak);
      this.lineLength = 0;
    }
    return this;
  },


  /**
   * Prints a horizontal rule in a separate line.
   *
   * @param {string} [chr=' '] - The basic chr that builds up the rule.
   * @returns the printer.
   */
  rule(chr = '-') {
    let len = this.options.breakLimit - this.lineLength;
    if (len < 8) { len = 8; }
    return this._emit(chr.repeat(len)).br();
  },


  /**
   * Prints an arbitrary program model with syntax highlight.
   *
   * @param {any} node - A program model node.
   * @returns the printer.
   */
  model(node) {
    this.seen.clear();
    return this._model(node);
  },


  /**
   * Increases indentation level beginning from the next line.
   * @returns the printer.
   */
  indent() {
    return this._startBlock({ open: '', close: '' });
  },


  /**
   * Decreases indentation level beginning from the next line.
   * @returns the printer.
   */
  unindent() {
    return this._endBlock();
  },


  /* Extension API */


  /**
   * Prints a program model. Doesn't clear the circular reference detection
   * set, so it can be called recursively.
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
      } else if (!this.options.raw) {
        let f = Printer.modelMap.get(Object.getPrototypeOf(node));
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
        this._id(name);
      } else {
        this._id('<anonymous-function>');
      }
    } else if (typeof node === 'string') {
      this._string(node);
    } else if (typeof node === 'number') {
      this._emit(node.toString(), colors.yellow);
    } else {
      this._emit(node.toString());
    }
    return this;
  },


  /**
   * Prints an array with metamaya syntax.
   *
   * @param {array} node - A metamaya array or plain Javascript array.
   * @returns the printer.
   */
  _array(node) {
    let s = this.seen.get(node);
    if (s) {
      return this._emit(s, colors.red);
    } else {
      this.seen.set(node, '@circular[array]');
    }
    if (node.length === 0) {
      this._emit("[]");
    } else {
      this._startBlock({
        open: { value: '[' },
        close: ']',
        separator: { value: ',' },
        afterLast: { value: '' }
      });
      for (let item of node) {
        this._startItem()._model(item)._endItem();
      }
      this._endBlock();
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
    let s = this.seen.get(node);
    if (s) {
      return this._emit(s, colors.red);
    } else {
      this.seen.set(node, '@circular[object]');
    }
    if (node.constructor !== Object) {
      this._id(node.constructor.name)._emit(' ');
    }
    let keys = Object.keys(node);
    if (keys.length === 0) {
      this._emit("{}");
    } else {
      this._startBlock({
        open: { value: '{ ' },
        close: ' }',
        terminator: { value: ';', breakValue: '' },
      });
      for (let key of keys) {
        this._startItem()._key(key)._emit(" = ")._model(node[key])._endItem();
      }
      return this._endBlock();
    }
    return this;
  },


  /**
   * Prints a parenthesized, comma separated list of models.
   *
   * @param {array} items - Array of list items.
   * @returns the printer.
   */
  _parenList(items) {
    if (items.length === 0) {
      this._emit("()");
    } else {
      this._startBlock({
        open: '(',
        close: ')',
        separator: ',',
      });
      for (let item of items) {
        this._startItem()._model(item)._endItem();
      }
      return this._endBlock();
    }
    return this;
  },


  /**
   * Prints a freshly defined property key with syntax highlight.
   *
   * @param {(string|number|symbol)} key - A property key.
   * @returns the printer.
   */
  _key(key) {
    if (this._isIdentifier(key)) {
      this._id(key);
    } else {
      this._emit("[")._model(key)._emit("]");
    }
    return this;
  },


  /**
   * Prints an identifier with syntax highlight.
   *
   * @param {string} key - An identifier.
   * @returns the printer.
   */
  _id(key) {
    this._emit(key.toString(), colors.cyan);
    return this;
  },


  /**
   * Prints a reserved word with syntax highlight.
   *
   * @param {string} word - A reserved word.
   * @returns the printer.
   */
  _keyword(word) {
    this._emit(word, colors.magenta);
    return this;
  },


  /**
   * Prints a string literal with syntax highlight.
   *
   * @param {string} str - A string.
   * @returns the printer.
   */
  _string(str) {
    // todo: escape sequences
    this._emit('"' + str + '"', colors.yellow);
    return this;
  },


  /* Layout */


  /**
   * Starts a new indented block.
   * @param {Object} block - Block descriptor
   * @param {(string|Object)} block.open - The block opening token
   * @param {(string|Object)} block.close - The block closing token
   * @param {(string|Object)} [block.afterLast]- Printed after the last item
   *                          but before `block.close`
   * @param {string} block.terminator - A token that is printed after items
   * @param {string} block.separator - A token that is printed between items
   * @returns the printer.
   */
  _startBlock(block) {
    block.parent = this.block;
    block.depth = this.block.depth + 1;
    block.empty = true;
    this._emit(block.open);
    this.block = block;
    return this;
  },


  /**
   * Call this function after writing out all items of a block.
   * @returns the printer.
   */
  _endBlock() {
    let block = this.block;
    this.block = block.parent;
    if (block.afterLast != null) {
      this._emit(block.afterLast);
    }
    this._emit(block.close);
    return this;
  },


  /**
   * Call this function before starting a new block item.
   * Required for proper handling of layout.
   * @returns the printer.
   */
  _startItem() {
    if (this.block.empty) {
      this.block.empty = false;
    } else {
      if (this.block.separator) {
        this._emit(this.block.separator);
      }
      this._emit(' ');
    }
    return this;
  },


  /**
   * Call this function after finishing with a new block item.
   * Required for proper handling of layout.
   * @returns the printer.
   */
  _endItem() {
    if (this.block.terminator) {
      this._emit(this.block.terminator);
    }
    return this;
  },


  /**
   * Returns true if a string is a valid metamaya identifier.
   * It may produce false negatives but no false positives.
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


  /**
   * Prints a string or a formatter object to the output.
   * If `value` is a string it is printed directly to the output.
   * If `value` is an object, it must have the following properties:
   *
   * - {string} value - string to be printed
   * - {string} [breakValue] - string to be printed when the token is at the
   *                         end of a line
   *
   * The fundamental difference is that the line may be broken after printing
   * an object token while it will never be broken after a string token.
   *
   * @param {(string|Object)} value - A string or a formatter object.
   * @param {function} [stylefn] - Styling function that accepts a string and
   *                               emits another string
   * @returns the printer.
   */
  _emit(value, stylefn) {
    var toBreak = false;
    if (typeof value === "object") {
      let o = value;
      value = String(o.value);
      toBreak = this.lineLength + value.length >= this.options.breakLimit;
      if (toBreak && o.breakValue != null) {
        value = String(o.breakValue);
      }
    } else {
      value = String(value);
    }
    if (toBreak) {
      value = trimRight(value);
    }
    if (value.length > 0) {
      // indent on demand
      if (this.lineLength === 0) {
        value = trimLeft(value);
        this.lineLength = this.options.indentSize * this.block.depth;
        this.out.write(' '.repeat(this.lineLength));
      }
      this.lineLength += value.length;
      if (this.options.colors && typeof stylefn === "function") {
        value = stylefn(value);
      }
      this.out.write(value);
    }
    if (toBreak) {
      this.br();
    }
    return this;
  },
};


/**
 * Maps program model classes to printing functions.
 */
Printer.modelMap = modelMap;


/**
 * Trims spaces from the left end a string.
 * @param {string} str - String to trim.
 */
function trimLeft(str) {
  let i = 0;
  for (; i < str.length; ++i) {
    if (str[i] !== ' ') {
      break;
    }
  }
  return str.substring(i);
}


/**
 * Trims spaces from the right end a string.
 * @param {string} str - String to trim.
 */
function trimRight(str) {
  let i = str.length;
  while (i-- >= 0) {
    if (str[i] !== ' ') {
      break;
    }
  }
  return str.substring(0, i + 1);
}


/* Predefined printer objects that print to `stdout`. */
let printer = new Printer(process.stdout, { breakLimit: 0 });
let logger = new Printer(process.stdout);


module.exports = {
  printer: printer,
  logger: logger,
  Printer: Printer
};
