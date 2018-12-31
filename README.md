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


## Installation

    $ yarn add express-xmlrpc

## Running Tests

make sure the dev dependencies are installed

    $ yarn install

run the test

    $ yarn test

## Credits

Originally forked from the [xrpc project](https://www.npmjs.com/package/xrpc).
Uses Serializer and Deserializer logic from the [rosnodejs](https://github.com/RethinkRobotics-opensource/rosnodejs) package.