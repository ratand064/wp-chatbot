const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  messageId: {
    type: String,
    unique: true
  },
  profileName: String,
  replied: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Message', messageSchema);