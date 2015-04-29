/*globals _, Promise */

/**
 * A bad implementation of Promise.all() for an object's keys.
 */
Promise.props = function props(obj) {
  return new Promise(function(resolve, reject) {

    var promises = [];
    _.each(obj, function(val) {
      promises.push(val);
    });

    Promise.all(promises)
      .then(function(resolvedValues) {
        var returnObj = {};

        _.each(_.keys(obj), function(key, index) {
          returnObj[key] = resolvedValues[index];
        });

        return resolve(returnObj);
      })
      .catch(reject);
  });
};

function PromiseBus() {
  this.bus = {};
  return this;
}

/**
 * The equivalent of EventEmitter's `on`
 * @param {string} event The event to register this worker on
 * @param {string} [name] The name of the current worker. Taken from `worker.name` if unspecified. Must be unique; will overwrite the old worker with this name if it isn't
 * @param {Array.<string>} dependencies The list of workers on this event that this worker depends on
 * @param {function} worker The worker. Will be supplied the event's arguments first, then its dependencies as arguments
 * @return {this}
 */
PromiseBus.prototype.register = function(event, name, dependencies, worker) {
  if (!worker) {
    worker = dependencies;
    dependencies = name;
    name = worker.name;
  }

  if (_.isEmpty(name)) {
    throw new Error('Empty name not allowed');
  }

  if (!this.bus[event]) {
    this.bus[event] = {};
  }

  this.bus[event][name] = {
    name: name,
    dependencies: dependencies,
    worker: worker
  };

  return this;
};

/**
 * The equivalent of EventEmitter's `removeListener`
 * @param {string} event The event to unregister from
 * @param {string} name The worker to unregister
 * @return {this}
 */
PromiseBus.prototype.unregister = function(event, name) {
  if (this.bus[event]) {
    delete this.bus[event][name];
  }

  return this;
};

/**
 * The equivalent of EventEmitter's `listeners`
 * @param {string} event The event to get the hash of workers for
 * @return {Object.<string,{dependencies: Array.<string>, worker: function}>}
 */
PromiseBus.prototype.workers = function(event) {
  return this.bus[event] || {};
};

/**
 * The equivalent of EventEmitter's `emit`
 * @param {string} event The event to run
 * @param {...?} args Optional additional arguments for the workers
 * @return {Promise.<Object.<string, ?>>} returns a promise for the results
 */
PromiseBus.prototype.run = function() {
  return Promise.props(this._buildGraph.apply(this, arguments));
};

// this function synchronously builds the promise chain as
// specified by the dependency information. It uses the string keys of
// the given workers to late-bind promises to each other's `.then`
// functions.
PromiseBus.prototype._buildGraph = function(event) {
  var args = Array.prototype.slice.call(arguments, 1);
  var tasks = _.cloneDeep(this.bus[event]);

  var results = {};
  var undone = _.keys(tasks).length;
  var lastUndone = undone;

  while (undone > 0) {
    // essentially, we loop through the task list continuously,
    // looking for things whose dependency promises have been built
    // this allows us to do late binding of dependencies, in the
    // promise chain
    // Don't do circular graphs!
    _.each(tasks, function buildTask(task, name) {
      // if we haven't built the task yet, and all its dependencies are ready
      if (!task.built && _.all(_.at(results, task.dependencies))) {
        results[name] = Promise.props(_.pick(results, task.dependencies))
          .then(function(values) {
            return task.worker.apply(null, args.concat([values]));
          });

        task.built = true;
        undone--;
      }
    });

    // if we've been unable to build anything, because everything is
    // waiting on something else
    if (undone === lastUndone) {
      var unbuilt = _(tasks).reject('built').map('name').value();
      throw new Error('Unsatisfiable dependency graph found for event ' + event +
      ' (unresolved tasks: ' + unbuilt.join(', ') + ')');
    }

    lastUndone = undone;
  }

  return results;
};

export default PromiseBus;
