# express-xmlrpc

  xml-rpc server middleware for [express](http://expressjs.com/)
  built on [node](http://nodejs.org)

    'use strict'

    const xmlrpc = require('express-xmlrpc')
    const express = require('express')
    const app = express()

    const port = process.env.PORT || 9999

    app.use(xmlrpc.bodyParser)

    app.post('/', xmlrpc.apiHandler({
      echo: function (req, res) {
        xmlrpc.sendResult(req.body.params[0], req, res)
      }}
    ))

    app.listen(port)

    const client = xmlrpc.createClient({ port: port })
    client.methodCall('echo', [{ data: 9001 }], (error, value) => {
      console.log(`error: '${error}'`)
      console.log(`value: '${JSON.stringify(value)}'`)
    })


## installation

    $ yarn add philetus/express-xmlrpc

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
