'use strict';

let Hapi = require('hapi');
let amqp = require('amqplib/callback_api');

var api_key = 'key-908a72d40fcb0d2f75a92570aaa076ab';
var domain = 'sandbox7ff8f192f6514d6b8a962d2989895295.mailgun.org';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

// Create a server with a host and port
let server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 8000
});

var q = 'tasks';

function bail(err) {
  console.error(err);
  process.exit(1);
}

// Publisher
function publisher(conn) {
  conn.createChannel(on_open);
  function on_open(err, ch) {
    if (err !== null) return bail(err, conn);

    let q = 'hello';
    let msg = 'Hello World!';

    ch.assertQueue(q, {durable: false}, function(err, ok) {
      if (err !== null) return bail(err, conn);
      ch.sendToQueue(q, new Buffer(msg));
      console.log(" [x] Sent '%s'", msg);
      ch.close(function() { conn.close(); });
    });
  }
}

// Consumer
function consumer(conn) {
  var ok = conn.createChannel(on_open);
  function on_open(err, ch) {

    let q = 'hello';
    let res = [];
    ch.assertQueue(q, {durable: false}, function(err, ok) {
      if (err !== null) return bail(err, conn);
      ch.consume(q, function(msg) { // message callback
         res = JSON.parse(msg.content);
         console.log(" [x] Received for =>'%s'",res[0].purpose);
         var data = {
           from: 'Do Not Reply <postmaster@sandbox7ff8f192f6514d6b8a962d2989895295.mailgun.org>',
           to: 'Vasim '+res[0].to_email,
           subject: 'Reset Password Verification',
           html: '<b>Testing some Mailgun awesomness!</b>'
         };

         mailgun.messages().send(data, function (error, body) {
           if(error) return bail(error);
           console.log("[x] Email status =>'%s'",body.message);
         });

      }, {noAck: true}, function(_consumeOk) { // consume callback
        console.log(' [*] Waiting for messages. To exit press CTRL+C');
      });
    });
  }
}

   amqp.connect('amqp://localhost', function(err, conn) {
     if (err != null) bail(err);
     consumer(conn);
     //publisher(conn);
   });
  server.start(function () {
    console.log('Hapi-server running at:', server.info.uri);
  });
