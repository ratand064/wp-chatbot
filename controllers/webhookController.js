const Message = require('../models/Message');
const axios = require('axios');

// Webhook verification
exports.verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === process.env.VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully!');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed');
    res.sendStatus(403);
  }
};

// Handle incoming messages
exports.handleMessage = async (req, res) => {
  try {
    const body = req.body;

    // Check if it's a WhatsApp message
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry[0];
      const changes = entry.changes[0];
      const value = changes.value;

      // Check if message exists
      if (value.messages && value.messages[0]) {
        const message = value.messages[0];
        const from = message.from; // User's phone number
        const messageBody = message.text.body;
        const messageId = message.id;
        const profileName = value.contacts[0].profile.name;

        console.log(`📩 Message from ${profileName} (${from}): ${messageBody}`);

        // Save message to database
        const newMessage = new Message({
          from: from,
          body: messageBody,
          messageId: messageId,
          profileName: profileName
        });

        await newMessage.save();
        console.log('✅ Message saved to database');

        // Send auto-reply
        await sendWhatsAppMessage(from, `Hello ${profileName}! 👋\n\nThanks for your message: "${messageBody}"\n\nThis is an automated response. How can I help you today?`);

        // Mark as replied
        newMessage.replied = true;
        await newMessage.save();
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Error handling message:', error);
    res.sendStatus(500);
  }
};

// Function to send WhatsApp message
async function sendWhatsAppMessage(to, message) {
  try {
    const url = `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`;
    
    const data = {
      messaging_product: 'whatsapp',
      to: to,
      text: { body: message }
    };

    const config = {
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await axios.post(url, data, config);
    console.log('✅ Message sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error sending message:', error.response?.data || error.message);
    throw error;
  }
}