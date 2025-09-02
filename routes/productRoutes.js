const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Provider = require('../models/Provider');

// GET /api/products?lat=xx&lng=yy&category=zz
router.get('/', async (req, res) => {
  try {
    const { lat, lng, category } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const products = await Product.aggregate([
      {
        $lookup: {
          from: 'providers',          // collection name in DB
          localField: 'providerId',   // field in Product
          foreignField: '_id',        // field in Provider
          as: 'provider',
        },
      },
      { $unwind: '$provider' },
      {
        $match: {
          'provider.location': {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)],
              },
              $maxDistance: 10000, // 10 km radius
            },
          },
          ...(category ? { category } : {}), // optional category filter
        },
      },
      {
        $project: {
          name: 1,
          price: 1,
          images: 1,
          description: 1,
          // provider details excluded here intentionally
        },
      },
    ]);

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
