/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-promisebus',
  included: function(app, parentAddon) {
    this._super.included.apply(this, arguments);
    if (app.import) this.addImports(app);
  },
  addImports: function(app) {
    app.import({
      development: 'vendor/lodash-includes/lodash-includes.js',
      production: 'vendor/lodash-includes/lodash-includes.min.js'
    });
  }
};
