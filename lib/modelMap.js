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
    this._keyDef(node.key).token(' = ')._model(node.value)._terminator();
  }],


  [mm.prog.Constructor.prototype, function(node) {
    // TODO: print prototype
    if (this.opts.annotated) {
      this.keyword('@constructor').nbspace();
    }
    this.open('{');
    for (let stm of node.stms) {
      this._model(stm);
    }
    this.close('}');
  }],


  [mm.prog.KeyReference.prototype, function (node) {
    this._keyRef(node.key);
  }],


  [mm.prog.PropertyReference.prototype, function(node) {
    this._model(node.target);
    if (this._isIdentifier(node.key)) { this._print('.'); }
    this._keyRef(node.key);
  }],


  [mm.prog.Function.prototype, function (node) {
    // the parameter list is always printed without line break
    this._parenList(node.params, false)._print(' => ')._model(node.body);
  }],


  [mm.prog.Parameter.prototype, function(node) {
    this._keyDef(node.name);
  }],


  [mm.prog.Invocation.prototype, function(node) {
    if (node.target && !(node.target instanceof mm.prog.This)) {
      this._model(node.target);
      if (node.func instanceof mm.prog.PropertyReference) {
        this._print('.');
      } else {
        this._print('::');
      }
    }
    this._model(node.func);
    this._parenList(node.args, true);
  }],


  [mm.prog.Closure.prototype, function(node) {
    // TODO: check if env is different from the current env
    if (this.opts.annotated) {
      this._print('@closure(')._model(node.expr)._print(')');
    } else {
      this._model(node.expr);
    }
  }],
]);
