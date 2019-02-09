"use strict"

const skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g

const acorn = require("acorn")
const tt = acorn.tokTypes
const privateClassElements = require("acorn-private-class-elements")

function maybeParseFieldValue(field) {
  if (this.eat(tt.eq)) {
    const oldInFieldValue = this._inFieldValue
    this._inFieldValue = true
    field.value = this.parseExpression()
    this._inFieldValue = oldInFieldValue
  } else field.value = null
}

module.exports = function(Parser) {
  Parser = privateClassElements(Parser)
  return class extends Parser {
    // Parse private fields
    parseClassElement(_constructorAllowsSuper) {
      if (this.eat(tt.semi)) return null
      const node = this.startNode()
      if (!(this.options.ecmaVersion >= 8) || this.type != this.privateNameToken) {
        // Special-case for `async`, since `parseClassMember` currently looks
        // for `(` to determine whether `async` is a method name
        if (this.isContextual("async")) {
          skipWhiteSpace.lastIndex = this.pos
          let skip = skipWhiteSpace.exec(this.input)
          let next = this.input.charAt(this.pos + skip[0].length)
          if (next === ";" || next === "=") {
            node.key = this.parseIdent(true)
            node.computed = false
            maybeParseFieldValue.call(this, node)
            this.finishNode(node, "FieldDefinition")
            this.semicolon()
            return node
          }
        }
        return super.parseClassElement.apply(this, arguments)
      }
      this.parsePrivateClassElementName(node)
      maybeParseFieldValue.call(this, node)
      this.finishNode(node, "FieldDefinition")
      this.semicolon()
      return node
    }

    // Parse public fields
    parseClassMethod(method, isGenerator, isAsync, _allowsDirectSuper) {
      if (isGenerator || isAsync || method.kind != "method" || method.static || this.options.ecmaVersion < 8 || this.type == tt.parenL) {
        return super.parseClassMethod.apply(this, arguments)
      }
      maybeParseFieldValue.call(this, method)
      delete method.kind
      delete method.static
      method = this.finishNode(method, "FieldDefinition")
      this.semicolon()
      return method
    }

    // Prohibit arguments in class field initializers
    parseIdent(liberal, isBinding) {
      const ident = super.parseIdent(liberal, isBinding)
      if (this._inFieldValue && ident.name == "arguments") this.raise(ident.start, "A class field initializer may not contain arguments")
      return ident
    }
  }
}
