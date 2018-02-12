# Class fields support for Acorn

[![NPM version](https://img.shields.io/npm/v/acorn-class-fields.svg)](https://www.npmjs.org/package/acorn-class-fields)

This is a plugin for [Acorn](http://marijnhaverbeke.nl/acorn/) - a tiny, fast JavaScript parser, written completely in JavaScript.

It implements support for class fields as defined in the stage 3 proposal [Class field declarations for JavaScript](https://github.com/tc39/proposal-class-fields). The emitted AST follows [an ESTree proposal](https://github.com/estree/estree/pull/180).

## Usage

You can use this module directly in order to get an Acorn instance with the plugin installed:

```javascript
var acorn = require('acorn-class-fields');
```

Or you can use `inject.js` for injecting the plugin into your own version of Acorn like this:

```javascript
var acorn = require('acorn-class-fields/inject')(require('./custom-acorn'));
```

Then, use the `plugins` option to enable the plugiin:

```javascript
var ast = acorn.parse(code, {
  plugins: { classFields: true }
});
```

## License

This plugin is released under the [GNU Affero General Public License](./LICENSE).
Please feel free to open an issue if this choice of license is a problem for your use-case.
