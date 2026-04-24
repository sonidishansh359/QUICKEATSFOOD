const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const ownerAuth = require('../middleware/ownerAuth');

// Get all menu items (public for users to view)
router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.dietaryType && ['Veg', 'NonVeg'].includes(req.query.dietaryType)) {
      query.dietaryType = req.query.dietaryType;
    }
    const menuItems = await MenuItem.find(query);
    res.json(menuItems);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get menu items for a restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    // Block menu access for soft-deleted restaurants
    const Restaurant = require('../models/Restaurant');
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant || restaurant.deleted) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const query = { restaurant: req.params.restaurantId };
    if (req.query.dietaryType && ['Veg', 'NonVeg'].includes(req.query.dietaryType)) {
      query.dietaryType = req.query.dietaryType;
    }
    const menuItems = await MenuItem.find(query);
    res.json(menuItems);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});



// Update menu item (owner only)
router.put('/:id', ownerAuth, async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    // Check if owner owns the restaurant
    const Restaurant = require('../models/Restaurant');
    const restaurant = await Restaurant.findById(menuItem.restaurant);
    if (restaurant.owner.toString() !== req.owner._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get current commission rate
    const SystemSettings = require('../models/SystemSettings');
    const settings = await SystemSettings.getSettings();
    const multiplier = 1 + (settings.commissionRate / 100);

    const { name, description, price, image, category, isAvailable, dietaryType } = req.body;
    menuItem.name = name || menuItem.name;
    menuItem.description = description || menuItem.description;
    if (price) {
      menuItem.originalPrice = price;
      menuItem.price = Math.round(price * multiplier);
    }
    menuItem.image = image || menuItem.image;
    menuItem.category = category || menuItem.category;
    if (dietaryType) menuItem.dietaryType = dietaryType;
    menuItem.isAvailable = isAvailable !== undefined ? isAvailable : menuItem.isAvailable;

    await menuItem.save();

    // Emit socket event to notify clients about updated menu item
    const io = req.app.get('io');
    io.emit('menuItemUpdated', {
      menuItem: {
        id: menuItem._id,
        restaurantId: menuItem.restaurant,
        name: menuItem.name,
        description: menuItem.description,
        price: menuItem.price,
        originalPrice: menuItem.originalPrice,
        category: menuItem.category,
        image: menuItem.image,
        dietaryType: menuItem.dietaryType || 'Veg',
        isAvailable: menuItem.isAvailable,
        createdAt: menuItem.createdAt,
      }
    });

    res.json(menuItem);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete menu item (owner only)
router.delete('/:id', ownerAuth, async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    // Check if owner owns the restaurant
    const Restaurant = require('../models/Restaurant');
    const restaurant = await Restaurant.findById(menuItem.restaurant);
    if (restaurant.owner.toString() !== req.owner._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await MenuItem.findByIdAndDelete(req.params.id);

    // Emit socket event
    const io = req.app.get('io');
    io.emit('menuItemDeleted', {
      menuItemId: req.params.id,
      restaurantId: menuItem.restaurant
    });

    res.json({ message: 'Menu item deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle menu item availability (owner only)
router.put('/:id/toggle-availability', ownerAuth, async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    // Check if owner owns the restaurant
    const Restaurant = require('../models/Restaurant');
    const restaurant = await Restaurant.findById(menuItem.restaurant);
    if (restaurant.owner.toString() !== req.owner._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    menuItem.isAvailable = !menuItem.isAvailable;
    await menuItem.save();

    // Emit socket event
    const io = req.app.get('io');
    io.emit('menuItemUpdated', {
      menuItem: {
        id: menuItem._id,
        restaurantId: menuItem.restaurant,
        name: menuItem.name,
        description: menuItem.description,
        price: menuItem.price,
        category: menuItem.category,
        image: menuItem.image,
        isVeg: menuItem.isVeg || false,
        isAvailable: menuItem.isAvailable,
        createdAt: menuItem.createdAt,
      }
    });

    res.json(menuItem);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
