const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      enum: ['hydration'],
      required: true
    },
   
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    image: {
      type: String,
      required: true
    },
    thumbnail: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

// Create compound unique index for provider + name to allow same service names for different providers
serviceSchema.index({ provider: 1, name: 1 }, { unique: true });

// Remove any old title field indexes if they exist
serviceSchema.on('index', function(error) {
  if (error) {
    console.log('Index creation error:', error);
  }
});

module.exports = mongoose.model('Service', serviceSchema);
