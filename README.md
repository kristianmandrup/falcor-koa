falcor-koa [![npm](https://img.shields.io/npm/v/falcor-koa.svg?style=flat-square)]()
====================================================================================

[Falcor](https://netflix.github.io/falcor/) middleware for [Koa](https://github.com/koajs/koa/). Inspired by [falcor-express](https://github.com/Netflix/falcor-router/).

***Experimental, do not use in prodcution!***

### Usage

```javascript
var Koa = require('koa');
var FalcorRouter = require('falcor-router');
var falcorKoa = require('falcor-koa');
var app = Koa();

app.use(falcorKoa.dataSourceRoute(new FalcorRouter([{
  route: 'greeting',
  get: function() {
    return {
      path: ['greeting'],
      value: 'Hello World!'
    }
  }
}])));

app.listen(3000);
```

### Quick Router

To cut down on repetitive boilerplate and allow Router configuration entirely from data, use the `quickRouter` function. Note: A method (such as `get`) can point to either an Object or a Function (that when called should return a Falcor response Object).

```js
import { dataSourceRoute, quickRouter } from '../lib'
FalcorRouter.create = quickRouter;

const testConfig = {
  route: 'test',
  methods: {
    get: {
      path: ['test'],
      value: 'Hello Test'
    }
  }
};

const quickConfig = {
  route: 'quick',
  methods: {
    get: {
      path: ['quick'],
      value: 'Quick Hello'
    }
  }
};

const multiRouter = FalcorRouter.create([quickConfig, testConfig]);

const quickRouter = FalcorRouter.create(quickConfig);

app.use(dataSourceRoute(quickRouter))
// app.use(dataSourceRoute(multiRouter))
```
