/**!
 * falcor-koa - index.js
 * Copyright(c) 2015
 * Released under the Apache-2.0 license
 *
 * Authors:
 * mfellner <max.fellner@gmail.com>
 */
import request from 'supertest'
import koa from 'koa'
import should from 'should'
import FalcorRouter from 'falcor-router'

import { dataSourceRoute, quickRouter } from '../lib'

describe('dataSourceRoute', () => {

  const app = koa();

  // const router = new FalcorRouter([{
  //   route: 'test',
  //   get: function() {
  //     return {
  //       path: ['test'],
  //       value: 'Hello Test'
  //     }
  //   }
  // }]);
  // app.use(dataSourceRoute(router))

  const testConfig = {
    route: 'test',
    methods: {
      get: {
        path: ['test'],
        value: 'Hello Test'
      }
    }
  };

  // import { dataSourceRoute, quickRouter } from '../lib'
  FalcorRouter.create = quickRouter;

  const quickConfig = {
    route: 'quick',
    methods: {
      get: {
        path: ['quick'],
        value: 'Quick Hello'
      }
    }
  };

  // const quickRoute = FalcorRouter.create(testConfig);
  const quickRoute = quickRouter(testConfig);

  app.use(dataSourceRoute(quickRoute))

  var querystring = require('querystring');
  var urlencode = require('urlencode');

  function pathify(arg) {
    var str = JSON.stringify(arg);
    return str
    .replace(/"(.+?)"/g, function(match,$1) {
      return '"' + urlencode($1) + '"';
    })
    .replace(/"/g, '%22');
  }

  it('should return the JSON Graph', done => {
    var params = pathify([['test']]);
    // console.log('params', params);
    let query = '/todo?paths=' + params + '&method=get';

    request(app.listen())
      .get(query)
      .expect(200)
      .expect('Content-Type', /json/)
      .expect({
        "jsonGraph": {
          "test": "Hello Test"
        }
      })
      .end(done)
  })

  // it('quickRouter should also return a JSON Graph', done => {
  //   request(app.listen())
  //     .get('/todo?paths=[[%22quick%22]]&method=get')
  //     .expect(200)
  //     .expect('Content-Type', /json/)
  //     .expect({
  //       "jsonGraph": {
  //         "quick": "Quick Hello"
  //       }
  //     })
  //     .end(done)
  // })
})
