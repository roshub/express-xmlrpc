'use strict'

// express-xmlrpc - xml-rpc middleware for express
// xml-rpc spec: http://www.xmlrpc.com/spec

const Deserializer = require('./lib/deserializer.js')
const Serializer = require('./lib/serializer.js')
const Client = require('./lib/client.js')
const debug = require('debug')('express-xmlrpc:index')

// for serializing xmlrpc responses inside api methods
exports.serializeResponse = Serializer.serializeMethodResponse // (params)
exports.serializeFault = Serializer.serializeFault // (code, msg)

exports.sendResult = (result, req, res, next) => {
  if (req.body.multicall) {
    return result
  }
  res.send(exports.serializeResponse(result))
}

// client to make xmlrpc method calls
exports.createClient = (options) => new Client(options, false)

// middleware to parse body of xmlrpc method call & add to request
// * method -> req.body.method
// * parameters -> req.body.params
exports.bodyParser = (req, res, next) => {
  const deserializer = new Deserializer()
  deserializer.deserializeMethodCall(req, (error, method, params) => {
    if (error !== null) {
      req.body = null
      console.error('failed to deserialize method call from body:', error)
      next()
    } else {
      req.body = {
        method: method,
        params: params,
      }
      next()
    }
  })
}

// generate route handler for xmlrpc method reqests from api & context
// api is an object with method names mapped to handler functions:
// { methodName: methodNameHandler[(request, response, next)], .. }
// context is an optional context object to be mapped to this inside of call
exports.apiHandler = (api, context, onError, onMiss) => {
  return async (req, res, next) => {

    // if xml wasnt successfully parsed respond with fault
    if (!req.body) {
      res.send(
        exports.serializeFault(-32700, 'parse error: not well formed'))
    }

    // handle system.multicall requests
    if (req.body.method === 'system.multicall') {
      req.body.multicall = true
      const results = []

      try {
        const calls = req.body.params[0] // calls are passed as list
        for (let i = 0; i < calls.length; i++) {
          req.body.method = calls[i]['methodName']
          req.body.params = calls[i]['params']
          debug(`calling multicall method: '${req.body.method}`
            + `(${JSON.stringify(req.body.params)})'`)
          const method = api[req.body.method]
          var callResult = await method.call(context, req)
          results.push([callResult])
        
        }
        
        res.send(exports.serializeResponse(results))

      } catch (error) {
        req.body.method = 'system.multicall' // put multicall back for error

        // if error handler was given call it with error, req & res
        if (onError) {
          onError.call(context, error, req, res, next)

        // otherwise log & send generic xmlrpc fault
        } else {
          console.error(`error calling method '${req.body.method}:`, error)

          res.send(
            exports.serializeFault(
              -32500, `error calling method '${req.body.method}'`))
          next(error)
        }
      }
    } else if (req.body.method in api) {
      debug(`calling method '${req.body.method}`
        + `(${JSON.stringify(req.body.params)})'`)

      try {
        const method = api[req.body.method]

        // rejected promises wont be caught unless they are awaited
        await method.call(context, req, res, next)

      } catch (error) {

        // if error handler was given call it with error, req & res
        if (onError) {
          onError.call(context, error, req, res, next)

        // otherwise log & send generic xmlrpc fault
        } else {
          console.error(`error calling method '${req.body.method}:`, error)

          res.send(
            exports.serializeFault(
              -32500, `error calling method '${req.body.method}'`))
          next(error)
        }
      }

    } else {

      // if miss handler was given call it
      if (onMiss) {
        onMiss.call(context, req, res, next)

      // otherwise send generic xmlrpc fault
      } else {
        res.send(
          exports.serializeFault(
            -32601, `requested method '${req.body.method}' not found`))
      }
    }
  }
}
