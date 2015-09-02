/**!
 * falcor-koa - index.js
 * Copyright(c) 2015
 * Released under the Apache-2.0 license
 *
 * Authors:
 * mfellner <max.fellner@gmail.com>
 */
import url from 'url'

const parseArgs = Object.freeze({
  jsonGraph: true,
  callPath: true,
  arguments: true,
  pathSuffixes: true,
  paths: true
})

function requestToContext(req) {
  const queryMap = req.method === 'POST' ? req.body : url.parse(req.url, true).query;
  const context = {};

  if (queryMap) {
    Object.keys(queryMap).forEach(key => {
      let arg = queryMap[key];

      if (parseArgs[key] && arg) {
        context[key] = JSON.parse(arg);
      } else {
        context[key] = arg;
      }
    })
  }
  return Object.freeze(context);
}

import FalcorRouter from 'falcor-router'

// See: http://netflix.github.io/falcor/documentation/router.html
function createRoute(config = {}) {
  let routeConfig = {
    route: config.route,
  };

  for (let method in config.methods) {
    let returnVal = config.methods[method];
    routeConfig[method] = function(a,b) {
      return (typeof returnVal === 'function') ? returnVal(a,b) : returnVal;
    }
  }
  return routeConfig;
}

// An Observable is similar to a Promise, with the principal difference being that an Observable can
// send multiple values over time. The main advantage of using an Observable over a Promise is the ability
// to progressively return PathValues to the Router as soon as they are returned from the underlying DataSource.
// In contrast, when delivering values in a Promise, all values must be collected together in a
// JSON Graph envelope or an Array of PathValues and returned to the Router at the same time.

export function quickRouter(routes) {
  routes = routes.length ? routes : [routes];
  const falcorRoutes = routes.map((config) => {
    return createRoute(config);
  })
  return new FalcorRouter(falcorRoutes);
}

export function dataSourceRoute(dataSource) {
  return function*(next) {
    if (!dataSource) {
      this.throw('Undefined data source', 500);
    }

    const ctx = requestToContext(this.request)

    if (Object.keys(ctx).length === 0) {
      this.throw('Request not supported', 500);
    }
    if (!ctx.method || !ctx.method.length) {
      this.throw('No query method provided', 500)
    }
    if (!dataSource[ctx.method]) {
      this.throw(`Data source does not implement method ${ctx.method}`, 500)
    }

    const observable = {
      'set': () => dataSource[ctx.method](ctx.jsonGraph),
      'call': () => dataSource[ctx.method](ctx.callPath, ctx.arguments, ctx.pathSuffixes, ctx.paths),
      'get': () => dataSource[ctx.method]([].concat(ctx.paths || [])),
      'undefined': () => this.throw(`Unsupported method ${ctx.method}`, 500)
    }[ctx.method]()

    // Note: toPromise could be removed in the future (https://github.com/Netflix/falcor/issues/464)
    this.body = yield observable.toPromise()
  }
}
