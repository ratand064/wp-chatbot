exports.verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('Webhook verification request:', { mode, token, challenge });

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully!');
    return res.status(200).send(challenge);
  } else {
    console.log('❌ Verification failed:', { 
      expectedToken: process.env.VERIFY_TOKEN, 
      receivedToken: token 
    });
    return res.sendStatus(403);
  }
};