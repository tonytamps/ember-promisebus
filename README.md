[![Build Status](https://secure.travis-ci.org/SohumB/promisebus.png)](http://travis-ci.org/SohumB/promisebus)

An EventEmitter-like interface for promises.

Like EventEmitter, it handles triggering sequences of asynchronous
actions on "events". Unlike EventEmitter, it uses promise composition
to support return values and late binding of dependencies between tasks.

Suppose you have a stream of mogs to process, and you want them to
share an event bus.

```javascript
var PromiseBus = require('promisebus');

var bus = new PromiseBus();
```

Given a mog, we can go fetch its name from the database and take its
picture with a camera we have set up in the enclosure.

```javascript
bus.register('mog', [], function name(eid) {
  return knex.select('name').from('mogs').where({ enclosure_id: eid });
})

bus.register('mog', [], function picture(eid) {
  return cameras[eid].takePicture();
});
```

Given its picture, we can approximate its age and gender, and given
its name and age, we can estimate how likely someone is to
adopt it.

```javascript
bus.register('mog', ['picture'], function age(eid, data) {
  return estimateAgeByFacialProportions(data.picture);
});

bus.register('mog', ['picture'], function gender(eid, data) {
  // mogs are highly gender-normative
  var colour = getPredominantColour(data.picture);
  return colour === 'pink' ? 'female' : 'male';
});

bus.register('mog', ['name', 'age'], function adoptionProbability(eid, data) {
  return data.age < 2 || data.name.match(/fluff/) ? 0.9 : 0.2;
});
```

So now, when we receive a mog to process, we can run all these
disparate pieces of code in one step.

```javascript
bus.run('mog', 5).then(function(mog) {
  display mog.picture;
  console.log(mog.name, " is very happy to be adopted! ", mog.gender === 'female' ? "She" : "He", " hopes to see you soon!");
  if (mog.adoptionProbability < 0.5) {
    console.debug("We totally didn't call this one.")
  }
})
```

And our mogs go happy to good homes.

---

# API Reference

`PromiseBus#register` Registers a worker to run on an event.
- `event`, String naming the event to run on
- `name`, String naming this worker. Optional, but then has to be specified in the function's name.
- `dependencies`, Array of Strings listing the workers this worker depends on
- `worker`, Function implementing the worker itself. Will be passed the event's arguments, then its dependencies.
- Returns the `PromiseBus` instance for chaining.

`PromiseBus#unregister` Unregisters an existing worker.
- `event`, String naming the event to unregister from
- `name`, Name of the worker to unregister
- Returns the `PromiseBus` instance for chaining.

`PromiseBus#workers` The list of workers for an event
- `event`, String naming the event to get the list of workers of
- Returns an object of the form `{ name: { dependencies, worker } }`

`PromiseBus#run` Run an event's workers.
- `event`, String naming the event to run.
- `args`, Arguments to pass to the workers
- Returns a Promise for an object of the form `{ name: return value }`

# Using Inside an Addon

ember-promisebus relies on a call to `app.import()` which it cannot make when installed as a 
dependency of an addon (as opposed to an app). You need to call its `addImports(app)` method
from the containing addon:

```js
module.exports = {
  name: 'containing-addon',
  included: function(app, parentAddon) {
    this._super.included.apply(this, arguments);
    require('ember-promisebus').addImports(app);
  }
};
```
