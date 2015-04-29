/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-promisebus',
  included: function(app) {
    this._super.included(app);

    app.import({
      development: 'vendor/lodash-includes/lodash-includes.js',
      production: 'vendor/lodash-includes/lodash-includes.min.js'
    });
  }
};
