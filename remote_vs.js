const rpc = require('atomic_rpc');

class RemoteVS {
  constructor() {
    this.remote = new rpc({
      server: true,
      port: 7778
    });

    this.remote.on('connect', (packet) => {
      console.log('connecting ' + packet.id);
    });

    this.remote.initialize();
  }

  call() {
    this.remote.call.apply(this.remote, arguments);
  }

  expose() {
    this.remote.expose.apply(this.remote, arguments);
  }
}

module.exports = new RemoteVS();
