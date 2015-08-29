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
  const context = {}

  if (queryMap) {
    Object.keys(queryMap).forEach(key => {
      let arg = queryMap[key]

      if (parseArgs[key] && arg) {
        context[key] = JSON.parse(arg)
      } else {
        context[key] = arg
      }
    })
  }
  return Object.freeze(context)
}

import FalcorRouter from 'falcor-router'

function createRoute(config = {}) {
  let routeConfig = {
    route: config.route,
  };

  for (let method in config.methods) {
    let returnVal = config.methods[method];
    routeConfig[method] = function() {
      return (typeof returnVal === 'function') ? returnVal() : returnVal;
    }
  }
  return routeConfig;
}

export function quickRouter(routes) {
  routes = routes.length ? routes : [routes];
  console.log('routes', routes);
  const falcorRoutes = routes.map((config) => {
    return createRoute(config);
  })
  console.log('falcorRoutes', falcorRoutes);
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
