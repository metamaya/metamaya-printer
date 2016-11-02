"use strict";


const mm = require("metamaya/lib/implementation");


/**
 * Maps program model classes to printing functions.
 * When a function is called, a `Printer` object is passed as `this`.
 */
module.exports = new Map([
  [mm.Wrapper.prototype, function(node) {
    this._model(node.obj);
  }],


  [mm.model.Definition.prototype, function(node) {
    this._key(node.key)._emit(" = ")._model(node.value);
  }],


  [mm.model.Constructor.prototype, function(node) {
    // TODO: print prototype
    if (this.options.annotate) {
      this._keyword('@ctor');
    }
    if (node.stms.length === 0) {
      this._emit("{}");
    } else {
      this._startBlock({
        open: { value: '{ ' },
        close: ' }',
        terminator: {
          value: ';',
          breakValue: ''
        }
      });
      for (let stm of node.stms) {
        this._startItem()._model(stm)._endItem();
      }
      this._endBlock();
    }
  }],


  [mm.model.This.prototype, function (node) {
    this._keyword("this");
  }],


  [mm.model.KeyReference.prototype, function (node) {
    this._key(node.key);
  }],


  [mm.model.PropertyReference.prototype, function(node) {
    this._model(node.target);
    if (this._isIdentifier(node.key)) { this._emit('.'); }
    this._key(node.key);
  }],


  [mm.model.Function.prototype, function (node) {
    this._parenList(node.params)._emit(' => ')._model(node.body);
  }],


  [mm.model.Parameter.prototype, function(node) {
    this._key(node.name);
  }],


  [mm.model.Invocation.prototype, function(node) {
    if (node.target && !(node.target instanceof mm.model.This)) {
      this._model(node.target);
      if (node.func instanceof mm.model.KeyReference) {
        // the function is a property of the target
        this._emit('.');
      } else {
        // bind operator
        this._emit('::');
      }
    }
    this._model(node.func);
    this._parenList(node.args);
  }],


  [mm.model.Closure.prototype, function(node) {
    // TODO: check if env is different from the current env
    var expr;
    if (this.options.unreduce) {
      expr = node[mm.Unreduce]();
    } else {
      expr = node.expr;
    }
    if (this.options.annotate) {
      this._keyword('@closure')._emit('(')._model(expr)._emit(')');
    } else {
      this._model(expr);
    }
  }],
]);
