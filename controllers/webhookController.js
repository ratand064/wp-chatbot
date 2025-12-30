const axios = require('axios');

// Webhook verification
exports.verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('✅ Webhook verified!');
    return res.status(200).send(challenge);
  } else {
    console.log('❌ Verification failed');
    return res.sendStatus(403);
  }
};

// Handle incoming messages
exports.handleMessage = async (req, res) => {
  try {
    const body = req.body;
    
    console.log('Incoming webhook:', JSON.stringify(body, null, 2));

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry[0];
      const changes = entry.changes[0];
      const value = changes.value;

      if (value.messages && value.messages[0]) {
        const message = value.messages[0];
        const from = message.from;
        const messageBody = message.text.body;
        const profileName = value.contacts[0].profile.name;

        console.log(`📩 Message from ${profileName} (${from}): ${messageBody}`);

        // Send reply
        await sendWhatsAppMessage(from, `Hello ${profileName}! 👋\n\nThanks for your message: "${messageBody}"\n\nThis is an automated response!`);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Error:', error);
    res.sendStatus(500);
  }
};

// Send WhatsApp message
async function sendWhatsAppMessage(to, message) {
  try {
    const url = `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`;
    
    const response = await axios.post(url, {
      messaging_product: 'whatsapp',
      to: to,
      text: { body: message }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Message sent!');
    return response.data;
  } catch (error) {
    console.error('❌ Send error:', error.response?.data || error.message);
  }
}