const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  name: String,
  price: Number,
  description: String,
  images: [String],
  category: String,
  providerId: {
    type: Schema.Types.ObjectId,
    ref: 'Provider',
  },
});

module.exports = mongoose.model('Product', ProductSchema);
