/*
  express-xmlrpc - xml-rpc middleware for express

  based on rsscloud-node's xmlrpc module: 
  * https://github.com/lmorchard/rsscloud-node
  specs: http://www.xmlrpc.com/spec

*/

const XmlrpcParser = require('./lib/xmlrpc-parser');

// for generating responses
exports.XmlrpcResponse = require('./lib/xmlrpc-response');
exports.XmlrpcFault = require('./lib/xmlrpc-fault');

// middleware to parse body of xmlrpc method call & add to request
// * method -> request.xmlrpc.method
// * parameters -> request.xmlrpc.params
exports.requestBodyParser = (request, response, next) => {

  // Only attempt to parse text/xml Content-Type
  var ct = request.headers['content-type'] || '';
  var mime = ct.split(';')[0];
  if ('text/xml' != mime) { return next(); }

  var raw = [];
  var parser = new XmlrpcParser({
    onDone: function (data) {
      request.xmlrpc = data;
      next();
    },
    onError: function (msg) {
      request.xmlrpc = false;
      next();
    }
  });

  // If there's raw body data, try parsing that instead of hooking up events.
  if (request.rawBody) {
    return parser.parseString(request.rawBody).finish();
  }

  request.setEncoding('utf8');
  request.on('data', function (chunk) {
    raw.push(chunk);
    parser.parseString(chunk);
  });
  request.on('end', function () {
    request.rawBody = raw.join('');
    parser.finish();
  });

};

