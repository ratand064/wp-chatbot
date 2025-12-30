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
    
    // STEP 1: Sabse pehle Meta ko batao ki request mil gayi (To avoid timeout)
    res.sendStatus(200);

    // Incoming log check karein
    // console.log('Incoming webhook:', JSON.stringify(body, null, 2));

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      // Check: Kya ye actual message hai? (Status update like 'sent/delivered' ignore karein)
      if (value?.messages && value?.messages?.[0]) {
        
        const message = value.messages[0];
        const from = message.from;

        // Check: Kya user ka naam available hai?
        const profileName = value.contacts?.[0]?.profile?.name || "User";

        // IMPORTANT: Sirf TEXT messages handle karein
        if (message.type === 'text') {
            const messageBody = message.text.body;
            console.log(`📩 Message from ${profileName} (${from}): ${messageBody}`);

            // Send reply
            await sendWhatsAppMessage(from, `Hello ${profileName}! 👋\n\nI received: "${messageBody}"`);
        
        } else {
            // Agar image/sticker/audio hai
            console.log(`📩 Non-text message received type: ${message.type}`);
            await sendWhatsAppMessage(from, `Sorry ${profileName}, I can only read text messages right now.`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error in logic:', error);
    // Yahan res.sendStatus mat lagana kyunki hum upar already bhej chuke hain
  }
};

// Send WhatsApp message
async function sendWhatsAppMessage(to, message) {
  try {
    // API Version v19.0 ya v20.0 use karein (v18 purana ho sakta hai)
    const url = `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`;
    
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

    console.log('✅ Reply sent successfully!');
    return response.data;
  } catch (error) {
    // Error ki puri details print karein taaki debug kar sakein
    console.error('❌ Send error details:', error.response?.data || error.message);
  }
}