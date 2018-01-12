'use strict'

// express-xmlrpc - xml-rpc middleware for express
// xml-rpc spec: http://www.xmlrpc.com/spec

const Deserializer = require('./lib/deserializer.js')
const Serializer = require('./lib/serializer.js')
const Client = require('./lib/client.js')
// for generating responses
exports.serializeResponse = Serializer.serializeMethodResponse // (params)
exports.serializeFault = Serializer.serializeFault // (code, msg)
exports.createClient = (options) => new Client(options, false)

// middleware to parse body of xmlrpc method call & add to request
// * method -> request.xmlrpc.method
// * parameters -> request.xmlrpc.params
exports.bodyParser = (request, response, next) => {

  const deserializer = new Deserializer()
  deserializer.deserializeMethodCall(request, (error, method, params) => {
    if (error !== null) {
      request.xmlrpc = null
      console.error('failed to deserialize method call from body:', error)
      next()
    } else {
      request.xmlrpc = {
        method: method,
        params: params,
      }
      next()
    }
  })
}

// generate route handler for xmlrpc method requests from api & context
// api is an object with method names mapped to handler functions:
// { methodName: methodNameHandler[(request, response, next)], .. }
// context is an optional context object to be mapped to this inside of call
exports.apiHandler = (api, context) => {
  return (request, response, next) => {

    // if xml wasnt successfully parsed respond with fault
    if (!request.xmlrpc) {
      response.send(
        exports.serializeFault(-32700, 'parse error: not well formed'))
    }

    if (request.xmlrpc.method in api) {
      console.log(`calling method '${request.xmlrpc.method}'`)

      try {
        const method = api[request.xmlrpc.method]
        method.call(context, request, response, next)

      } catch (error) {
        response.send(
          exports.serializeFault(
            -32500, `error calling method '${request.xmlrpc.method}'`))
        next(error) // give express recovery middleware a shot
      }

    } else {
      response.send(
        exports.serializeFault(
          -32601,`requested method '${request.xmlrpc.method}' not found`))
    }
  }
}
