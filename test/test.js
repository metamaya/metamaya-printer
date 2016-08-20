"use strict";

const Printer = require("metamaya-printer").Printer;
const stream = require('stream');
const test = require("tape");

test("empty", (t) => {
  p(opt1);
  t.equal(output, "");

  t.end();
});


test("flush", (t) => {
  p(opt1)._flush();
  t.equal(output, "");

  p(opt1)._flush()._flush();
  t.equal(output, "");

  t.end();
});


test("text", (t) => {
  p(opt1).text("");
  t.equal(output, "");

  p(opt1).text("abc");
  t.equal(output, "abc");

  t.end();
});


test("br", (t) => {
  p(opt1).br();
  t.equal(output, "");

  p(opt1).br().br().br();
  t.equal(output, "");

  p(opt1).text('abc').br();
  t.equal(output, "abc\n");

  p(opt1).text('abc').br().br();
  t.equal(output, "abc\n");

  p(opt1).text('abc').br().text('def');
  t.equal(output, "abc\ndef");

  p(opt1).text('abc').br().text('def').br().br();
  t.equal(output, "abc\ndef\n");

  t.end();
});


test("ln w/o string", (t) => {
  p(opt1).ln();
  t.equal(output, "\n");

  p(opt1).ln().br();
  t.equal(output, "\n");

  p(opt1).ln().ln();
  t.equal(output, "\n\n");

  p(opt1).text('abc').ln();
  t.equal(output, "abc\n");

  p(opt1).text('abc').ln().ln();
  t.equal(output, "abc\n\n");

  t.end();
});


test("ln w/o string 2", (t) => {
  p(opt1).text('abc').ln().text('def');
  t.equal(output, "abc\ndef");

  p(opt1).text('abc').br().ln().text('def');
  t.equal(output, "abc\n\ndef");

  p(opt1).text('abc').ln().br().text('def');
  t.equal(output, "abc\ndef");

  p(opt1).text('abc').ln().ln().text('def');
  t.equal(output, "abc\n\ndef");

  t.end();
});


test("ln with string", (t) => {
  p(opt1).ln('ln');
  t.equal(output, "ln\n");

  p(opt1).ln('ln').br();
  t.equal(output, "ln\n");

  p(opt1).ln('ln').ln('ln');
  t.equal(output, "ln\nln\n");

  p(opt1).text('abc').ln('ln');
  t.equal(output, "abc\nln\n");

  p(opt1).text('abc').ln('ln').ln('ln');
  t.equal(output, "abc\nln\nln\n");

  t.end();
});


test("ln with string 2", (t) => {
  p(opt1).text('abc').ln('ln').text('def');
  t.equal(output, "abc\nln\ndef");

  p(opt1).text('abc').br().ln('ln').text('def');
  t.equal(output, "abc\nln\ndef");

  p(opt1).text('abc').ln('ln').br().text('def');
  t.equal(output, "abc\nln\ndef");

  p(opt1).text('abc').ln('ln').ln('ln').text('def');
  t.equal(output, "abc\nln\nln\ndef");

  t.end();
});


test("format", (t) => {
  p(opt1).format('');
  t.equal(output, "");

  p(opt1).format('abc');
  t.equal(output, "abc");

  // It shouldn't have failed
  //p(opt1).format('ab%%cd');
  //t.equal(output, "ab%cd");

  p(opt1).format('ab%dcd', 99);
  t.equal(output, "ab99cd");

  p(opt1).format('ab%scd', '()');
  t.equal(output, "ab()cd");

  p(opt1).format('ab%jcd', {});
  t.equal(output, "ab{}cd");

  t.end();
});


test("rule", (t) => {
  p(opt1).rule(10, '-');
  t.equal(output, "----------\n");

  p(opt1).text('abc').rule(10, '-');
  t.equal(output, "abc\n----------\n");

  p(opt1).rule(10, '-').rule(10, '-');
  t.equal(output, "----------\n----------\n");

  p(opt1).rule(10, '-').text('abc').rule(10, '-');
  t.equal(output, "----------\nabc\n----------\n");

  t.end();
});


test("indent", (t) => {
  p(opt1).indent();
  t.equal(output, "");

  p(opt1).unindent();
  t.equal(output, "");

  p(opt1).indent().unindent();
  t.equal(output, "");

  p(opt1).indent().br().unindent();
  t.equal(output, "");

  p(opt1).indent().ln().unindent();
  t.equal(output, "\n");

  t.end();
});


test("indent 2", (t) => {
  p(opt1).indent().unindent().text('abc');
  t.equal(output, "abc");

  p(opt1).indent().text('abc').unindent();
  t.equal(output, "  abc");

  p(opt1).indent().text('abc').unindent().text('def');
  t.equal(output, "  abcdef");

  p(opt1).indent().text('abc').unindent().br().text('def');
  t.equal(output, "  abc\ndef");

  p(opt1).indent().text('abc').br().unindent().text('def');
  t.equal(output, "  abc\ndef");

  t.end();
});


test("indent 3", (t) => {
  p(opt1).indent().text('abc').br().text('def').br().unindent().text('ghi');
  t.equal(output, "  abc\n  def\nghi");

  p(opt1).indent().text('abc').br().indent().text('def').br().unindent().text('ghi');
  t.equal(output, "  abc\n    def\n  ghi");

  p(opt1).indent().text('abc').ln().ln().text('def');
  t.equal(output, "  abc\n\n  def");

  t.end();
});


test("_isIdentifier", (t) => {
  let x = p(opt1);
  t.equal(x._isIdentifier(''), false);
  t.equal(x._isIdentifier('.'), false);
  t.equal(x._isIdentifier('1'), false);
  t.equal(x._isIdentifier('1a'), false);
  t.equal(x._isIdentifier('a-'), false);
  t.equal(x._isIdentifier('3_'), false);

  t.equal(x._isIdentifier('$'), true);
  t.equal(x._isIdentifier('_'), true);
  t.equal(x._isIdentifier('a'), true);
  t.equal(x._isIdentifier('a3'), true);
  t.equal(x._isIdentifier('ab'), true);
  t.equal(x._isIdentifier('a$'), true);
  t.equal(x._isIdentifier('AZaz09_$'), true);

  t.end();
});


// Creates a printer that prints into the global string `output`.
function p(opts) {
  output = "";
  // super-simple writable stream: http://stackoverflow.com/a/21583831
  var stm = new stream.Writable();
  stm._write = function(chunk, encoding, done) {
    output += chunk;
    done();
  };
  return new Printer(stm, opts);
}

var output = "";


var opt1 = {
};
