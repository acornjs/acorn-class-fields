"use strict"

const assert = require("assert")
const acorn = require("..")

function test(text, expectedResult, additionalOptions) {
  it(text, function () {
    const result = acorn.parse(text, Object.assign({ ecmaVersion: 9, plugins: { classFields: true } }, additionalOptions))
    if (expectedResult) {
      assert.deepEqual(result.body[0], expectedResult)
    }
  })
}
function testFail(text, expectedResult, additionalOptions) {
  it(text, function () {
    let failed = false
    try {
      acorn.parse(text, Object.assign({ ecmaVersion: 9, plugins: { classFields: true } }, additionalOptions))
    } catch (e) {
      assert.equal(e.message, expectedResult)
      failed = true
    }
    assert(failed)
  })
}

describe("acorn-class-fields", function () {
  test(`class Counter extends HTMLElement {
    x = 0;

    clicked() {
      this.x++;
    }

    render() {
      return this.x.toString();
    }
  }`)

  test(`class Counter extends HTMLElement {
    #x = 0;

    clicked() {
      this.#x++;
    }

    render() {
      return this.#x.toString();
    }
  }`)
  test("class A { a = this.#a; #a = 4 }")

  testFail("class A { #a; f() { delete this.#a } }", "Private elements may not be deleted (1:20)")
  testFail("class A { #a; #a }", "Duplicate private element (1:14)")
  testFail("class A { a = this.#a }", "Usage of undeclared private name (1:19)")
  testFail("class A { a = this.#a; b = this.#b }", "Usage of undeclared private name (1:19)")
  testFail("class A { constructor = 4 }", "Unexpected token (1:22)")
  testFail("class A { #constructor = 4 }", "Classes may not have a field named constructor (1:10)")
  testFail("class A { a = () => arguments }", "A class field initializer may not contain arguments (1:20)")
  testFail("class A { a = () => super() }", "A class field initializer may not contain super (1:20)")
  testFail("class A { # a }", "Unexpected token (1:12)")
  testFail("class A { #a; a() { this.# a } }", "Unexpected token (1:27)")

  const classes = [
    { text: "class A { %s }", ast: getBody => {
      const body = getBody(10)
      return {
        type: "ClassDeclaration",
        start: 0,
        end: body.end + 2,
        id: {
          type: "Identifier",
          start: 6,
          end: 7,
          name: "A"
        },
        superClass: null,
        body: {
          type: "ClassBody",
          start: 8,
          end: body.end + 2,
          body: [body]
        }
      }
    } },
    { text: "class A { %s; }", ast: getBody => {
      const body = getBody(10)
      return {
        type: "ClassDeclaration",
        start: 0,
        end: body.end + 3,
        id: {
          type: "Identifier",
          start: 6,
          end: 7,
          name: "A"
        },
        superClass: null,
        body: {
          type: "ClassBody",
          start: 8,
          end: body.end + 3,
          body: [body]
        }
      }
    } },
    { text: "class A { %s; #y }", ast: getBody => {
      const body = getBody(10)
      return {
        type: "ClassDeclaration",
        start: 0,
        end: body.end + 6,
        id: {
          type: "Identifier",
          start: 6,
          end: 7,
          name: "A"
        },
        superClass: null,
        body: {
          type: "ClassBody",
          start: 8,
          end: body.end + 6,
          body: [body, {
            type: "FieldDefinition",
            start: body.end + 2,
            end: body.end + 4,
            key: {
              type: "PrivateName",
              start: body.end + 2,
              end: body.end + 4,
              name: "y"
            },
            value: null,
            computed: false
          } ]
        }
      }
    } },
    { text: "class A { %s;a() {} }", ast: getBody => {
      const body = getBody(10)
      return {
        type: "ClassDeclaration",
        start: 0,
        end: body.end + 9,
        id: {
          type: "Identifier",
          start: 6,
          end: 7,
          name: "A"
        },
        superClass: null,
        body: {
          type: "ClassBody",
          start: 8,
          end: body.end + 9,
          body: [ body, {
            type: "MethodDefinition",
            start: body.end + 1,
            end: body.end + 7,
            kind: "method",
            static: false,
            computed: false,
            key: {
              type: "Identifier",
              start: body.end + 1,
              end: body.end + 2,
              name: "a"
            },
            value: {
              type: "FunctionExpression",
              start: body.end + 2,
              end: body.end + 7,
              id: null,
              generator: false,
              expression: false,
              async: false,
              params: [],
              body: {
                type: "BlockStatement",
                start: body.end + 5,
                end: body.end + 7,
                body: []
              }
            }
          } ]
        }
      }
    } },
    { text: "class A { %s\na() {} }", ast: getBody => {
      const body = getBody(10)
      return {
        type: "ClassDeclaration",
        start: 0,
        end: body.end + 9,
        id: {
          type: "Identifier",
          start: 6,
          end: 7,
          name: "A"
        },
        superClass: null,
        body: {
          type: "ClassBody",
          start: 8,
          end: body.end + 9,
          body: [
            body,
            {
              type: "MethodDefinition",
              start: body.end + 1,
              end: body.end + 7,
              kind: "method",
              static: false,
              computed: false,
              key: {
                type: "Identifier",
                start: body.end + 1,
                end: body.end + 2,
                name: "a"
              },
              value: {
                type: "FunctionExpression",
                start: body.end + 2,
                end: body.end + 7,
                id: null,
                generator: false,
                expression: false,
                async: false,
                params: [],
                body: {
                  type: "BlockStatement",
                  start: body.end + 5,
                  end: body.end + 7,
                  body: []
                }
              }
            }
          ]
        }
      }
    } },
  ];

  [
    { body: "x", passes: true, ast: start => ({
      type: "FieldDefinition",
      start: start,
      end: start + 1,
      key: {
        type: "Identifier",
        start: start,
        end: start + 1,
        name: "x"
      },
      value: null,
      computed: false
    }) },
    { body: "x = 0", passes: true, ast: start => ({
      type: "FieldDefinition",
      start: start,
      end: start + 5,
      key: {
        type: "Identifier",
        start: start,
        end: start + 1,
        name: "x"
      },
      value: {
        type: "Literal",
        start: start + 4,
        end: start + 5,
        value: 0,
        raw: "0"
      },
      computed: false
    }) },
    { body: "[x]", passes: true, ast: start => ({
      type: "FieldDefinition",
      start: start,
      end: start + 3,
      computed: true,
      key: {
        type: "Identifier",
        start: start + 1,
        end: start + 2,
        name: "x"
      },
      value: null
    }) },
    { body: "[x] = 0", passes: true, ast: start => ({
      type: "FieldDefinition",
      start: start,
      end: start + 7,
      computed: true,
      key: {
        type: "Identifier",
        start: start + 1,
        end: start + 2,
        name: "x"
      },
      value: {
        type: "Literal",
        start: start + 6,
        end: start + 7,
        value: 0,
        raw: "0"
      }
    }) },
    { body: "#x", passes: true, ast: start => ({
      type: "FieldDefinition",
      start: start,
      end: start + 2,
      computed: false,
      key: {
        type: "PrivateName",
        start: start,
        end: start + 2,
        name: "x"
      },
      value: null,
    }) },
    { body: "#x = 0", passes: true, ast: start => ({
      type: "FieldDefinition",
      start: start,
      end: start + 6,
      computed: false,
      key: {
        type: "PrivateName",
        start: start,
        end: start + 2,
        name: "x"
      },
      value: {
        type: "Literal",
        start: start + 5,
        end: start + 6,
        value: 0,
        raw: "0"
      }
    }) },

    { body: "async", passes: true, ast: start => ({
      type: "FieldDefinition",
      start: start,
      end: start + 5,
      key: {
        type: "Identifier",
        start: start,
        end: start + 5,
        name: "async"
      },
      value: null,
      computed: false
    }) },

    { body: "async = 5", passes: true, ast: start => ({
      type: "FieldDefinition",
      start: start,
      end: start + 9,
      key: {
        type: "Identifier",
        start: start,
        end: start + 5,
        name: "async"
      },
      value: {
        type: "Literal",
        start: 18,
        end: 19,
        raw: "5",
        value: 5
      },
      computed: false
    }) },
  ].forEach(bodyInput => {
    const body = bodyInput.body, passes = bodyInput.passes, bodyAst = bodyInput.ast
    classes.forEach(input => {
      const text = input.text, options = input.options || {}, ast = input.ast;
      (passes ? test : testFail)(text.replace("%s", body), ast(bodyAst), options)
    })
  })

  testFail("class C { \\u0061sync m(){} };", "Unexpected token (1:21)")
})
