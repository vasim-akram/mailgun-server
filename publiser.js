var amqp = require('amqplib/callback_api');

function bail(err, conn) {
  console.error(err);
  if (conn) conn.close(function() { process.exit(1); });
}

function on_connect(err, conn) {
  if (err !== null) return bail(err);

  var q = 'hello';
  var msg = 'Hello World!';
  var email_obj = [
    {
    'to_email': 'iamvasim786@gmail.com',
    'purpose': 'resetpassword'
    }
]

  function on_channel_open(err, ch) {
    if (err !== null) return bail(err, conn);
    ch.assertQueue(q, {durable: false}, function(err, ok) {
      if (err !== null) return bail(err, conn);
      ch.sendToQueue(q, new Buffer(JSON.stringify(email_obj)));
      console.log(" [x] Sent '%s'", JSON.stringify(email_obj));
      ch.close(function() { conn.close(); });
    });
  }

  conn.createChannel(on_channel_open);
}
amqp.connect(on_connect);
// curl -s --user 'api:key-908a72d40fcb0d2f75a92570aaa076ab' \
//     https://api.mailgun.net/v3/sandbox7ff8f192f6514d6b8a962d2989895295.mailgun.org/messages \
//     -F from='Mailgun Sandbox <postmaster@sandbox7ff8f192f6514d6b8a962d2989895295.mailgun.org>' \
//     -F to='Vasim <iamvasim786@gmail.com>' \
//     -F subject='Hello Vasim' \
//     -F text='Congratulations Vasim, you just sent an email with Mailgun!  You are truly awesome!'
