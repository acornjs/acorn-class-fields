"use strict"

const fs = require("fs")
const path = require("path")
const run = require("test262-parser-runner")
const parse = require(".").parse

const unsupportedFeatures = [
  "async-iteration",
  "BigInt",
  "object-rest",
  "object-spread",
  "optional-catch-binding",
  "regexp-lookbehind",
  "regexp-named-groups",
  "regexp-unicode-property-escapes"
]

const implementedFeatures = [ "class-fields-private", "class-fields-public" ]

run(
  (content, options) => parse(content, {sourceType: options.sourceType, ecmaVersion: 9, plugins: { classFields: true }}),
  {
    testsDirectory: path.dirname(require.resolve("test262/package.json")),
    skip: test => (!test.attrs.features || !implementedFeatures.some(f => test.attrs.features.includes(f)) || unsupportedFeatures.some(f => test.attrs.features.includes(f))),
    whitelist: fs.readFileSync("./test262.whitelist", "utf8").split("\n").filter(v => v && v[0] !== "#")
  }
)
