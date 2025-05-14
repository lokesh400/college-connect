const mongoose = require('mongoose');
const User = require('./User');  // Assuming User model exists

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: [{
    type: {
      // You can add types like "heading", "paragraph", "image", or "important"
      type: String,
      enum: ['heading', 'paragraph', 'image', 'important'],
      required: true,
    },
    text: String,  // Holds the actual text content (for headings, paragraphs)
    image: String, // Holds image URL if the type is 'image'
    isImportant: Boolean, // If the type is 'important', mark words
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Link to the User model
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Blog', blogSchema);
