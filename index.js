/*
  express-xmlrpc - xml-rpc middleware for express

  based on rsscloud-node's xmlrpc module: 
  * https://github.com/lmorchard/rsscloud-node
  specs: http://www.xmlrpc.com/spec

*/

const Parser = require('./lib/xmlrpc-parser')

// for generating responses
exports.Response = require('./lib/xmlrpc-response')
exports.Fault = require('./lib/xmlrpc-fault')

// middleware to parse body of xmlrpc method call & add to request
// * method -> request.xmlrpc.method
// * parameters -> request.xmlrpc.params
exports.requestBodyParser = (request, response, next) => {

  // only attempt to parse text/xml Content-Type
  var ct = request.headers['content-type'] || ''
  var mime = ct.split(';')[0]
  if ('text/xml' != mime) { return next() }

  var raw = []
  var parser = new Parser({
    onDone: (data) => {
      request.xmlrpc = data
      next()
    },
    onError: (msg) => {
      request.xmlrpc = null
      next()
    }
  });

  // try parsing raw body data instead of hooking up events
  if (request.rawBody) {
    return parser.parseString(request.rawBody).finish()
  }

  request.setEncoding('utf8')
  request.on('data', (chunk) => {
    raw.push(chunk)
    parser.parseString(chunk)
  })
  request.on('end', () => {
    request.rawBody = raw.join('')
    parser.finish()
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
        new exports.Fault(-32700, 'parse error: not well formed').xml())
    }

    if (request.xmlrpc.method in api) {
      console.log(`calling method '${request.xmlrpc.method}'`)

      try {
        const method = api[request.xmlrpc.method]
        method.call(context, request, response, next)

      } catch (error) {
        response.send(
          new exports.Fault(
            -32500, `error calling method '${request.xmlrpc.method}'`).xml())
        next(error) // give express recovery middleware a shot
      }

    } else {
      response.send(
        new exports.Fault(
          -32601, 
          `requested method '${request.xmlrpc.method}' not found`).xml()
      next(error) // give express recovery middleware a shot
    }
  }
}
