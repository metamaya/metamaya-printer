"use strict"


const mm = require("metamaya");
const colors = require('colors/safe');


/**
 * Maps program model classes to printing functions.
 */
module.exports = new Map([
	[mm.Wrapper.prototype, function (node) {
		this.model(node.obj);
	}],


	[mm.prog.Definition.prototype, function(node) {
		this.propertyDef(node.key, node.value);
	}],


	[mm.prog.Constructor.prototype, function(node) {
		// TODO: print prototype
		this.keyword('@constructor ');
		this.open('{');
		for (let stm of node.stms) {
			this.model(stm);
		}
		this.close('}');
	}],


	[mm.prog.KeyReference.prototype, function(node) {
		if (typeof node.key === 'string') {
			if (this.opts.colors)
				this.text(colors.green(node.key));
			else
				this.text(node.key);
		} else {
			this.text('[');
			if (this.opts.colors)
				this.text(colors.green(node.key.toString()));
			else
				this.text(node.key.toString());
			this.text(']');
		}
	}],


	[mm.prog.PropertyReference.prototype, function(node) {
		this.model(node.target);
		if (typeof node.key === 'string') {
			// TODO: names that are not valid identifiers
			this.text('.').keyRef(node.key);
		} else {
			this.text('[').model(node.key).text(']');
		}
	}],


	[mm.prog.Function.prototype, function(node) {
		this.text('(');
		let comma = false;
		for (let param of node.params) {
			if (comma)
				this.text(', ');
			comma = true;
			this.model(param);
		}
		this.text(') => ').model(node.body);
	}],


	[mm.prog.Parameter.prototype, function(node) {
		this.keyRef(node.name);
	}],


	[mm.prog.Invocation.prototype, function(node) {
		if (node.target && !(node.target instanceof mm.prog.This)) {
			this.model(node.target);
			this.text('.');
		}
		this.model(node.func);

		this.text('(');
		let comma = false;
		for (let arg of node.args) {
			if (comma)
				this.text(', ');
			comma = true;
			this.model(arg);
		}
		this.text(')');
	}],


	[mm.prog.Closure.prototype, function(node) {
		// TODO: check if env is different from the current env
		this.model(node.expr);
	}],
])

