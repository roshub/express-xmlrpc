var http         = require('http')
  , https        = require('https')
  , url          = require('url')
  , Serializer   = require('./serializer')
  , Deserializer = require('./deserializer')

/**
 * Creates a Client object for making XML-RPC method calls.
 *
 * @constructor
 * @param {Object|String} options - Server options to make the HTTP request to.
 *                                  Either a URI string
 *                                  (e.g. 'http://localhost:9090') or an object
 *                                  with fields:
 *   - {String} host              - (optional)
 *   - {Number} port
 *   - {String} url               - (optional) - may be used instead of host/port pair
 * @param {Boolean} isSecure      - True if using https for making calls,
 *                                  otherwise false.
 * @return {Client}
 */
function Client(options, isSecure) {

  // Invokes with new if called without
  if (false === (this instanceof Client)) {
    return new Client(options, isSecure)
  }

  // If a string URI is passed in, converts to URI fields
  if (typeof options === 'string') {
    options = url.parse(options)
    options.host = options.hostname
    options.path = options.pathname
  }

  if (typeof options.url !== 'undefined') {
    var parsedUrl = url.parse(options.url);
    options.host = parsedUrl.hostname;
    options.path = parsedUrl.pathname;
    options.port = parsedUrl.port;
  }

  // Set the HTTP request headers
  var headers = {
    'User-Agent'     : 'NodeJS XML-RPC Client'
  , 'Content-Type'   : 'text/xml'
  , 'Accept'         : 'text/xml'
  , 'Accept-Charset' : 'utf8'
  , 'Connection'     : 'Keep-Alive'
  }
  options.headers = options.headers || {}

  if (options.headers.Authorization == null &&
      options.basic_auth != null &&
      options.basic_auth.user != null &&
      options.basic_auth.pass != null)
  {
    var auth = options.basic_auth.user + ':' + options.basic_auth.pass
    options.headers['Authorization'] = 'Basic ' + new Buffer(auth).toString('base64')
  }

  for (var attribute in headers) {
    if (options.headers[attribute] === undefined) {
      options.headers[attribute] = headers[attribute]
    }
  }

  options.method = 'POST'
  this.options = options

  this.isSecure = isSecure
  this.headersProcessors = {
    processors: [],
    composeRequest: function(headers) {
      this.processors.forEach(function(p) {p.composeRequest(headers);})
    },
    parseResponse: function(headers) {
      this.processors.forEach(function(p) {p.parseResponse(headers);})
    }
  };
}

/**
 * Makes an XML-RPC call to the server specified by the constructor's options.
 *
 * @param {String} method     - The method name.
 * @param {Array} params      - Params to send in the call.
 * @param {Function} callback - function(error, value) { ... }
 *   - {Object|null} error    - Any errors when making the call, otherwise null.
 *   - {mixed} value          - The value returned in the method response.
 */
Client.prototype.methodCall = function methodCall(method, params, callback) {
  var options   = this.options
  var xml       = Serializer.serializeMethodCall(method, params, options.encoding)
  var transport = this.isSecure ? https : http

  options.headers['Content-Length'] = Buffer.byteLength(xml, 'utf8')
  this.headersProcessors.composeRequest(options.headers)
  var request = transport.request(options, function(response) {

    var body = []
    response.on('data', function (chunk) { body.push(chunk) })

    function __enrichError (err) {
      Object.defineProperty(err, 'req', { value: request })
      Object.defineProperty(err, 'res', { value: response })
      Object.defineProperty(err, 'body', { value: body.join('') })
      return err
    }

    if (response.statusCode == 404) {
      callback(__enrichError(new Error('Not Found')))
    }
    else {
      this.headersProcessors.parseResponse(response.headers)

      var deserializer = new Deserializer(options.responseEncoding)

      deserializer.deserializeMethodResponse(response, function(err, result) {
        if (err) {
          err = __enrichError(err)
        }
        callback(err, result)
      })
    }
  }.bind(this))

  request.on('error', callback)
  request.write(xml, 'utf8')
  request.end()
}

module.exports = Client

