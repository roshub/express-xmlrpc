# express-xmlrpc

  xml-rpc server middleware for [express](http://expressjs.com/)
  built on [node](http://nodejs.org)

    'use strict'

    const xmlrpc = require('express-xmlrpc')
    const express = require('express')
    const app = express()

    const port = process.env.PORT || 18776;
    const data = { data: 9001 }

    app.use(xmlrpc.bodyParser) 

    app.post('/', xmlrpc.apiHandler({
      echo: function (request, response, next) {
        try {
          response.send(
            xmlrpc.serializeResponse(request.xmlrpc.params[0]))
        } catch (error) {
          response.send(
            xmlrpc.serializeFault(-32500, 'test error: ' + error.toString()))
        }
      }},
      data // optional context object is passed to api method calls
    ))

    app.listen(port)

    const client = xmlrpc.createClient({ port: port })
    client.methodCall('echo', [data], (error, value) => {
      console.log(`error: '${error}'`)
      console.log(`value: '${JSON.stringify(value)}'`)
    })


## installation

    $ yarn add philetus/express-xmlrpc


## features

  * express middleware
  * platform-independent xml parser
  * includes a router to make using this module dead-simple

## running tests

make sure the dev dependencies are installed

    $ yarn install

run the test

    $ yarn test

## license

(The MIT License)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
