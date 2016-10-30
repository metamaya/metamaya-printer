"use strict";


const mm = require("metamaya");


/**
 * Maps program model classes to printing functions.
 * When a function is called, a `Printer` object is passed as `this`.
 */
module.exports = new Map([
  [mm.Wrapper.prototype, function(node) {
    this._model(node.obj);
  }],


  [mm.prog.Definition.prototype, function(node) {
    this._key(node.key)._emit(" = ")._model(node.value);
  }],


  [mm.prog.Constructor.prototype, function(node) {
    // TODO: print prototype
    if (this.options.annotated) {
      this._keyword('@constructor ');
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


  [mm.prog.This.prototype, function (node) {
    this._emit("this");
  }],


  [mm.prog.KeyReference.prototype, function (node) {
    this._key(node.key);
  }],


  [mm.prog.PropertyReference.prototype, function(node) {
    this._model(node.target);
    if (this._isIdentifier(node.key)) { this._emit('.'); }
    this._key(node.key);
  }],


  [mm.prog.Function.prototype, function (node) {
    this._parenList(node.params)._emit(' => ')._model(node.body);
  }],


  [mm.prog.Parameter.prototype, function(node) {
    this._key(node.name);
  }],


  [mm.prog.Invocation.prototype, function(node) {
    if (node.target && !(node.target instanceof mm.prog.This)) {
      this._model(node.target);
      if (node.func instanceof mm.prog.KeyReference) {
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


  [mm.prog.Closure.prototype, function(node) {
    // TODO: check if env is different from the current env
    if (this.options.annotated) {
      this._emit('@closure(')._model(node.expr)._emit(')');
    } else {
      this._model(node.expr);
    }
  }],
]);
