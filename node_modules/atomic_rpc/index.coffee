ws = require 'ws'
_ = require 'lodash'
emitter = require 'events'

module.exports = class AtomicRPC extends emitter
  constructor: (args) ->
    {
      @host
      @port
      @server
      @reconnect
      @timeout
    } = args
    @connections = {}
    @exposures = {}
    @timeout ?= 2000
    @scopes = {}
    @callbacks = {}
    @id = 0
    @debug = false
  initialize: ->
    if @server?
      socket = new ws.Server {@port}
      socket.on 'connection', (client) =>
        @_connectionHandler client
        client.on 'close', => @_disconnectionHandler client
        client.on 'error', => @_errorHandler error, client
      socket.on 'error', (error) =>
        @_errorHandler error, socket
    else
      @_connectClient()

  _connectClient: ->
    socket = new ws "ws://#{@host}:#{@port}"
    socket.on 'open',  => @_connectionHandler socket
    socket.on 'close', => @_disconnectionHandler socket
    socket.on 'error', (error) => @_errorHandler error, socket

  expose: (method, funk, scope = null) ->
    @exposures[method] = funk
    if scope
      @scopes[method] = scope

  call: ({id: connectionId, method, params, callback}) ->
    if _.isEmpty @connections
      console.error "NOT CONNECTED" if @debug
      if callback?
        callback 'not connected'
    unless connectionId?
      _.every @connections, (socket, id) =>
        @call {id, method, params, callback}
        true
      return

    unless @connections[connectionId]?
      console.error "NO SUCH SOCKET: #{connectionId}" if @debug
      if callback?
        callback 'no such socket'
      return
    params ?= {}
    message = {method, params}
    if callback?
      if process.hrtime?
        id = process.hrtime().join('')
      else
        id = Date.now() + "#{connectionId}"
      message.id = id
      _callback = =>
        delete @callbacks[id]
        callback.apply @, arguments

      setTimeout =>
        if @callbacks[id]?
          console.error "TIMEOUT!!! method: #{method},
           socket: #{connectionId}" if @debug
          @callbacks[id].call @, 'timeout'
      , @timeout
      @callbacks[id] = _callback


    console.warn "MESSAGE TO #{connectionId}", message if @debug
    @connections[connectionId].send JSON.stringify message

  _messageHandler: (socket, message) ->
    message = JSON.parse message
    {
      id
      method
      params
      error
      result
    } = message
    @emit 'message', message
    console.info "MESSAGE FROM #{socket.id}", message if @debug
    if method?
      args = [params]
      if id?
        args.push callback = (error, result) ->
          message = {id}
          if error?
            message.error = error
          unless error? and result?
            message.result = result
          console.warn "MESSAGE TO #{socket.id}", message if @debug
          socket.send JSON.stringify message
      else
        args.push null
      args.push socket.id
      unless @exposures[method]?
        console.error "NO SUCH EXPOSED METHOD: #{method}" if @debug
        return callback('no such exposed method') if id?
      try
        @exposures[method].apply (@scopes[method] or @), args
      catch e
        console.error e
    else if error? or result?
      @callbacks[id]?.call @, error, result

  _connectionHandler: (socket) ->
    socket.on 'message', (message) =>
      @_messageHandler socket, message
    @connections[@id] = socket
    socket.id = @id
    @id++
    console.info "CONNECTED #{socket.id}" if @debug
    @emit 'connect', socket

  _errorHandler: (error, socket) ->
    console.error error if @debug

  _disconnectionHandler: (socket) ->
    @emit 'disconnect', socket
    console.error "DISCONNECTED #{socket.id}" if @debug
    delete @connections[socket.id]
    if @reconnect?
      setTimeout =>
        console.log 'RECONNECTING...' if @debug
        @_connectClient()
      , 5000
