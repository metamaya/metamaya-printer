"use strict";

const Printer = require("../lib/index").Printer;
const mm = require("metamaya/lib/implementation");
const parser = require("metamaya/lib/parser");
const stream = require('stream');
const test = require("tape");

let options = {};

let annotOptions = {
  annotate: true
};

let colorsOptions = {
  colors: true
};

let shortLineOptions = {
  breakLimit: 0,
  indentSize: 2
};

test("noformatstr", (t) => {
  p(options).print();
  t.equal(output, "");

  p(options).print(1);
  t.equal(output, "1");

  p(options).print(1, 2, 3);
  t.equal(output, "1 2 3");

  p(options).print(1, "2");
  t.equal(output, "1 2");

  p(options).print(undefined, null, false, true);
  t.equal(output, "undefined null false true");

  t.end();
});

test("formatstr", (t) => {
  p(options).print("");
  t.equal(output, "");

  p(options).print("a");
  t.equal(output, "a");

  p(options).print("a b c");
  t.equal(output, "a b c");

  t.end();
});

test("linebreak", (t) => {
  p(options).print("\n");
  t.equal(output, "\n");

  p(options).print("\r");
  t.equal(output, "\r");

  p(options).print("\r\n");
  t.equal(output, "\r\n");

  p(options).print("a\n");
  t.equal(output, "a\n");

  p(options).print("a\r");
  t.equal(output, "a\r");

  p(options).print("a\r\n");
  t.equal(output, "a\r\n");

  p(options).print("a b\n c");
  t.equal(output, "a b\n c");

  p(options).print("a b c\n");
  t.equal(output, "a b c\n");

  t.end();
});

test("rule", (t) => {
  let prt = p(options).rule();
  t.equal(output, '-'.repeat(prt.options.breakLimit) + "\n");

  p(shortLineOptions).rule();
  t.equal(output, '-'.repeat(8) + "\n");

  prt = p(options).print("...").rule();
  t.equal(output, "..." + '-'.repeat(prt.options.breakLimit - 3) + "\n");

  t.end();
});

test("remain", (t) => {
  p(options).print("", 1, 2);
  t.equal(output, "1 2");

  p(options).print("a", 1, 2);
  t.equal(output, "a 1 2");

  p(options).print("%d", 1, 2);
  t.equal(output, "1 2");

  t.end();
});

test("br", (t) => {
  p(options).br();
  t.equal(output, "");

  p(options).print("").br();
  t.equal(output, "");

  p(options).print("a").br();
  t.equal(output, "a\n");

  p(options).print("a").br().br();
  t.equal(output, "a\n");

  t.end();
});

test("println", (t) => {
  p(options).println();
  t.equal(output, "\n");

  p(options).println("a");
  t.equal(output, "a\n");

  p(options).println("%d %s", 1, "a", "b");
  t.equal(output, "1 a b\n");

  t.end();
});

test("%", (t) => {
  p(options).print("%");
  t.equal(output, "%");

  p(options).print("%%");
  t.equal(output, "%");

  p(options).print("%%", 1);
  t.equal(output, "% 1");

  p(options).print("a%%", 1);
  t.equal(output, "a% 1");

  t.end();
});

test("%d", (t) => {
  p(options).print("%d");
  t.equal(output, "%d");

  p(options).print("%d", 1);
  t.equal(output, "1");

  t.end();
});

test("%s", (t) => {
  p(options).print("%s");
  t.equal(output, "%s");

  p(options).print("%s", 1);
  t.equal(output, "1");

  p(options).print("%s", "abc");
  t.equal(output, "abc");

  t.end();
});

test("multiple%", (t) => {
  p(options).print("%s%s");
  t.equal(output, "%s%s");

  p(options).print("%d%d");
  t.equal(output, "%d%d");

  p(options).print("%s%s", "abc", "def");
  t.equal(output, "abcdef");

  t.end();
});

test("multiple%text", (t) => {
  p(options).print(".%s.%s.");
  t.equal(output, ".%s.%s.");

  p(options).print(".%d.%d.");
  t.equal(output, ".%d.%d.");

  p(options).print("...%s...%s...", "abc", "def");
  t.equal(output, "...abc...def...");

  p(options).print("%s%d", "abc", 123);
  t.equal(output, "abc123");

  p(options).print("%d%s", 123, "abc");
  t.equal(output, "123abc");

  p(options).print("...%s...%d...", "abc", 123);
  t.equal(output, "...abc...123...");

  t.end();
});

test("%m", (t) => {
  p(options).print(".%m.");
  t.equal(output, ".%m.");

  p(options).print("%m", undefined);
  t.equal(output, "undefined");

  p(options).print("%m", null);
  t.equal(output, "null");

  p(options).print("%m", 1);
  t.equal(output, "1");

  p(options).print("%m", "abc");
  t.equal(output, "\"abc\"");

  p(options).print("%m", Symbol("S"));
  t.equal(output, "Symbol(S)");

  t.end();
});

test("%m-array", (t) => {
  p(options).print("%m", []);
  t.equal(output, "[]");

  p(options).print("%m", [1]);
  t.equal(output, "[1]");

  p(options).print("%m", [1, 2, 3]);
  t.equal(output, "[1, 2, 3]");

  t.end();
});

test("%m-object", (t) => {
  p(options).print("%m", {});
  t.equal(output, "{}");

  p(options).print("%m", { a: 1 });
  t.equal(output, "{ a = 1; }");

  p(options).print("%m", { a: 1, b: 2, c: 3 });
  t.equal(output, "{ a = 1; b = 2; c = 3; }");

  t.end();
});

test("%m-hybrid", (t) => {
  p(options).print("%m", [1, [], [2], { c: 3 }]);
  t.equal(output, "[1, [], [2], { c = 3; }]");

  p(options).print("%m", { a: 1, b: { c: 3 }, d: [1] });
  t.equal(output, "{ a = 1; b = { c = 3; }; d = [1]; }");

  t.end();
});

test("%m-circular", (t) => {
  let o = {};
  o.a = o;
  p(options).print("%m", o);
  t.equal(output, "{ a = @circular[object]; }");

  let a = [];
  a[0] = a;
  p(options).print("%m", a);
  t.equal(output, "[@circular[array]]");

  t.end();
});

test("%m-constructor", (t) => {
  function Custom() {
    this.a = 1;
  }
  let o = new Custom();
  p(options).print("%m", o);
  t.equal(output, "Custom { a = 1; }");

  t.end();
});

test("short-line", (t) => {
  p(shortLineOptions).print("a").br().print("b");
  t.equal(output, "a\nb");

  p(shortLineOptions).print("%m", []);
  t.equal(output, "[]");

  p(shortLineOptions).print("%m", [1, 2, 3]);
  t.equal(output, "[\n  1,\n  2,\n  3\n]");

  p(shortLineOptions).print("%m", {});
  t.equal(output, "{}");

  p(shortLineOptions).print("%m", { a: 1 });
  t.equal(output, "{\n  a = 1\n}");

  p(shortLineOptions).print("%m", { a: { b: 2 } });
  t.equal(output, "{\n  a = {\n    b = 2\n  }\n}");

  t.end();
});

test("model", (t) => {
  p(options).model(parse("start = {}"));
  t.equal(output, "{ start = {}; }");

  p(options).model(parse("start = a; a = 3"));
  t.equal(output, "{ start = a; a = 3; }");

  p(options).model(parse("start = a.b; a = { b = 3; }"));
  t.equal(output, "{ start = a.b; a = { b = 3; }; }");

  t.end();
});

test("propertyref", (t) => {
  p(options).model(new mm.prog.PropertyReference(new mm.prog.This(), "a"));
  t.equal(output, "this.a");

  p(options).model(new mm.prog.PropertyReference(new mm.prog.This(), 3));
  t.equal(output, "this[3]");

  p(options).model(new mm.prog.PropertyReference(new mm.prog.This(), Symbol("S")));
  t.equal(output, "this[Symbol(S)]");

  t.end();
});

test("function", (t) => {
  p(options).model(parse("f() = 3"));
  t.equal(output, "{ f = () => 3; }");

  p(options).model(parse("f(x) = x"));
  t.equal(output, "{ f = (x) => x; }");

  p(options).model(function f() { });
  t.equal(output, "f");

  p(options).model(function (a) { });
  t.equal(output, "<anonymous-function>");

  t.end();
});

test("invocation", (t) => {
  p(options).model(parse("start = a.f(3); a = { f(x) = x; }"));
  t.equal(output, "{ start = a.f(3); a = { f = (x) => x; }; }");

  p(options).model(new mm.prog.Invocation(new mm.prog.This(), 3, [5]));
  t.equal(output, "3(5)");

  p(options).model(new mm.prog.Invocation(2, 3, [5]));
  t.equal(output, "2::3(5)");

  t.end();
});

test("closure", (t) => {
  p(options).model(new mm.prog.Closure(3, 5));
  t.equal(output, "3");

  t.end();
});

test("annotated", (t) => {
  p(annotOptions).model(parse("start = {}"));
  t.equal(output, "@constructor { start = @constructor {}; }");

  p(annotOptions).model(new mm.prog.Closure(3, 5));
  t.equal(output, "@closure(3)");

  t.end();
});

test("wrapper", (t) => {
  let realm = new mm.Realm();

  // don't assume a particular format here because it may vary
  p(options).model(realm.compile("start = {}"));
  t.ok(output);

  t.end();
});

test("colors", (t) => {
  p(colorsOptions).model("a");
  t.ok(/\"a\"/.test(output));

  t.end();
});







// Creates a printer that prints into the global string `output`.
function p(options) {
  output = "";
  // super-simple writable stream: http://stackoverflow.com/a/21583831
  var stm = new stream.Writable();
  stm._write = function (chunk, encoding, done) {
    output += chunk;
    done();
  };
  return new Printer(stm, options);
}

var output = "";


function parse(str) {
  return parser.parse(str).body;
}
