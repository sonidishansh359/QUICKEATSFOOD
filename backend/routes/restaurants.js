
const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Owner = require('../models/Owner');
const ownerAuth = require('../middleware/ownerAuth');

// Admin: Get all unapproved restaurants
router.get('/admin/unapproved', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    const expected = process.env.ADMIN_API_KEY || 'quickeats-admin';
    if (!adminKey || adminKey !== expected) {
      return res.status(403).json({ message: 'Invalid admin key' });
    }
    const restaurants = await Restaurant.find({ approved: false, deleted: { $ne: true } }).populate('owner');
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Approve a restaurant
router.put('/admin/approve/:id', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    const expected = process.env.ADMIN_API_KEY || 'quickeats-admin';
    if (!adminKey || adminKey !== expected) {
      return res.status(403).json({ message: 'Invalid admin key' });
    }
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    restaurant.approved = true;
    if (restaurant.verification) {
      restaurant.verification.status = 'verified';
    }
    await restaurant.save();

    // Emit socket event to owner room
    const io = req.app.get('io');
    if (restaurant.owner) {
      io.to(restaurant.owner.toString()).emit('restaurantUpdated', restaurant);
    }

    res.json({ message: 'Restaurant approved', restaurant });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Request Verification (Aadhar)
router.put('/admin/verification-request/:id', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    const expected = process.env.ADMIN_API_KEY || 'quickeats-admin';
    if (!adminKey || adminKey !== expected) {
      return res.status(403).json({ message: 'Invalid admin key' });
    }
    const { adminMessage } = req.body;
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    restaurant.verification = {
      ...restaurant.verification,
      aadharRequested: true,
      adminMessage: adminMessage || 'Please upload your Aadhar card for verification.',
      status: 'requested'
    };

    await restaurant.save();

    // Emit socket event to owner room
    const io = req.app.get('io');
    if (restaurant.owner) {
      io.to(restaurant.owner.toString()).emit('restaurantUpdated', restaurant);
    }

    res.json({ message: 'Verification requested', restaurant });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all restaurants (public for users) - only approved
router.get('/', async (req, res) => {
  try {
    const { isRestaurantOpen } = require('../utils/timeUtils');
    const restaurants = await Restaurant.find({ deleted: { $ne: true }, approved: true }).populate('owner');

    // Compute dynamic isOpen status
    const restaurantsWithStatus = restaurants.map(r => {
      const openStatus = isRestaurantOpen(r);
      // We don't save this to DB on every GET, just return it
      return { ...r.toObject(), isOpen: openStatus };
    });

    res.json(restaurantsWithStatus);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get owner's restaurants (owner only) - only approved
router.get('/owner', ownerAuth, async (req, res) => {
  try {
    console.log('Fetching restaurants for owner:', req.owner._id);
    const restaurants = await Restaurant.find({ owner: req.owner._id, deleted: { $ne: true } }).populate('owner');
    console.log('Found restaurants:', restaurants.length);
    res.json(restaurants);
  } catch (err) {
    console.error('Error fetching owner restaurants:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Hard-delete restaurant (admin permanent) - MUST BE BEFORE /:id
router.delete('/:id/admin/hard', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    const expected = process.env.ADMIN_API_KEY || 'quickeats-admin';
    if (!adminKey || adminKey !== expected) {
      return res.status(403).json({ message: 'Invalid admin key' });
    }

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Remove from owners' restaurants arrays
    await Owner.updateMany({ restaurants: restaurant._id }, { $pull: { restaurants: restaurant._id } });

    // Delete menu items for this restaurant
    await MenuItem.deleteMany({ restaurant: restaurant._id });

    // Permanently delete restaurant
    await restaurant.deleteOne();

    res.json({ message: 'Restaurant permanently deleted by admin', restaurantId: req.params.id });
  } catch (err) {
    console.error('Admin hard delete error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Soft-delete restaurant (admin)
router.delete('/:id/admin', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    const expected = process.env.ADMIN_API_KEY || 'quickeats-admin';
    if (!adminKey || adminKey !== expected) {
      return res.status(403).json({ message: 'Invalid admin key' });
    }

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    restaurant.deleted = true;
    restaurant.deletedAt = new Date();
    restaurant.deletedBy = 'admin';
    await restaurant.save();

    res.json({ message: 'Restaurant deleted by admin (soft)', restaurantId: restaurant._id });
  } catch (err) {
    console.error('Admin delete error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get restaurant by ID
router.get('/:id', async (req, res) => {
  try {
    const { isRestaurantOpen } = require('../utils/timeUtils');
    const restaurant = await Restaurant.findById(req.params.id).populate('owner');
    if (!restaurant || restaurant.deleted) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Compute dynamic isOpen status
    const restaurantObj = restaurant.toObject();
    restaurantObj.isOpen = isRestaurantOpen(restaurant);

    res.json(restaurantObj);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create restaurant (owner only)
router.post('/', ownerAuth, async (req, res) => {
  try {
    const { name, description, address, phone, image, latitude, longitude } = req.body;

    // Validate location coordinates if provided
    if (latitude !== undefined && longitude !== undefined) {
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ message: 'Latitude and longitude must be numbers' });
      }
      if (latitude < -90 || latitude > 90) {
        return res.status(400).json({ message: 'Latitude must be between -90 and 90' });
      }
      if (longitude < -180 || longitude > 180) {
        return res.status(400).json({ message: 'Longitude must be between -180 and 180' });
      }
    }

    const restaurantData = {
      name,
      description,
      address,
      phone,
      image,
      owner: req.owner._id,  // Use req.owner._id instead of req.owner.id
      approved: false // Always require admin approval
    };

    // Add location if coordinates provided
    if (latitude !== undefined && longitude !== undefined) {
      restaurantData.location = {
        type: 'Point',
        coordinates: [longitude, latitude] // GeoJSON format: [lng, lat]
      };
      console.log(`✅ Restaurant location set: [${longitude}, ${latitude}] for ${name}`);
    } else {
      console.warn(`⚠️ Restaurant created without location coordinates: ${name}`);
    }

    const restaurantDataWithTime = {
      ...restaurantData,
      openingTime: req.body.openingTime,
      openingPeriod: req.body.openingPeriod,
      closingTime: req.body.closingTime,
      closingPeriod: req.body.closingPeriod
    };

    const restaurant = new Restaurant(restaurantDataWithTime);
    // Initial status check
    const { isRestaurantOpen } = require('../utils/timeUtils');
    restaurant.isOpen = isRestaurantOpen(restaurant);

    await restaurant.save();

    // Add restaurant to owner's restaurants array
    req.owner.restaurants.push(restaurant._id);
    await req.owner.save();

    // Emit to Admin
    const io = req.app.get('io');
    io.to('admin_tracking').emit('restaurantRegistered', restaurant);

    console.log('Restaurant created (pending approval):', restaurant._id, 'for owner:', req.owner._id);
    res.status(201).json(restaurant);
  } catch (err) {
    console.error('Error creating restaurant:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update restaurant (owner only)
router.put('/:id', ownerAuth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    if (restaurant.owner.toString() !== req.owner._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { name, description, cuisine, address, phone, image, rating, deliveryTime, minOrder, openingTime, closingTime } = req.body;
    restaurant.name = name !== undefined ? name : restaurant.name;
    restaurant.description = description !== undefined ? description : restaurant.description;
    restaurant.cuisine = cuisine !== undefined ? cuisine : restaurant.cuisine;
    restaurant.address = address !== undefined ? address : restaurant.address;
    restaurant.phone = phone !== undefined ? phone : restaurant.phone;
    restaurant.image = image !== undefined ? image : restaurant.image;
    // restaurant.isOpen is now only set by time logic
    restaurant.rating = rating !== undefined ? rating : restaurant.rating;
    restaurant.deliveryTime = deliveryTime !== undefined ? deliveryTime : restaurant.deliveryTime;
    restaurant.minOrder = minOrder !== undefined ? minOrder : restaurant.minOrder;
    restaurant.openingTime = openingTime !== undefined ? openingTime : restaurant.openingTime;
    restaurant.openingPeriod = req.body.openingPeriod !== undefined ? req.body.openingPeriod : restaurant.openingPeriod;
    restaurant.closingTime = closingTime !== undefined ? closingTime : restaurant.closingTime;
    restaurant.closingPeriod = req.body.closingPeriod !== undefined ? req.body.closingPeriod : restaurant.closingPeriod;

    // Re-calculate status on update
    const { isRestaurantOpen } = require('../utils/timeUtils');
    restaurant.isOpen = isRestaurantOpen(restaurant);

    await restaurant.save();
    res.json(restaurant);
  } catch (err) {
    console.error('Error updating restaurant:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Owner: Submit Verification Document
router.put('/:id/verification-submit', ownerAuth, async (req, res) => {
  try {
    const { aadharImage, ownerResponse } = req.body;
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    if (restaurant.owner.toString() !== req.owner._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    restaurant.verification = {
      ...restaurant.verification,
      aadharImage,
      ownerResponse,
      status: 'submitted'
    };

    await restaurant.save();
    res.json({ message: 'Verification submitted', restaurant });
  } catch (err) {
    console.error('Error submitting verification:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle restaurant open/close status (owner only)
// Removed manual toggle-status endpoint. Open/close is now managed by time logic only.

// Soft-delete restaurant (owner only)
router.delete('/:id', ownerAuth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    if (restaurant.owner.toString() !== req.owner._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    restaurant.deleted = true;
    restaurant.deletedAt = new Date();
    restaurant.deletedBy = `owner:${req.owner._id}`;
    await restaurant.save();
    res.json({ message: 'Restaurant deleted (soft)', restaurantId: restaurant._id });
  } catch (err) {
    console.error('Error soft-deleting restaurant:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ... (existing routes) ...

// Create menu item for a restaurant (owner only)
router.post('/:restaurantId/menu', ownerAuth, async (req, res) => {
  try {
    const { name, description, price, image, category, dietaryType } = req.body;
    const { restaurantId } = req.params;

    // Check if restaurant exists and belongs to the owner
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    if (restaurant.owner.toString() !== req.owner._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add menu item to this restaurant' });
    }

    // Get current commission rate
    const SystemSettings = require('../models/SystemSettings');
    const settings = await SystemSettings.getSettings();
    const multiplier = 1 + (settings.commissionRate / 100);

    const menuItem = new MenuItem({
      name,
      description,
      price: Math.round(price * multiplier), // Calculate price based on dynamic rate
      originalPrice: price, // Store base price
      image,
      category,
      restaurant: restaurantId,
      dietaryType: dietaryType || 'Veg'
    });
    await menuItem.save();

    // Emit socket event to notify clients about new menu item
    const io = req.app.get('io');
    io.emit('menuItemAdded', {
      menuItem: {
        id: menuItem._id,
        restaurantId: menuItem.restaurant,
        name: menuItem.name,
        description: menuItem.description,
        price: menuItem.price,
        originalPrice: menuItem.originalPrice,
        category: menuItem.category,
        image: menuItem.image,
        isVeg: menuItem.isVeg || false,
        isAvailable: menuItem.isAvailable,
        createdAt: menuItem.createdAt,
      }
    });

    res.status(201).json(menuItem);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
