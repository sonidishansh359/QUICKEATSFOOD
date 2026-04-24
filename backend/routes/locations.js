/**
 * Location Routes
 * Handles all location-based operations for users, owners, and delivery boys
 * Including: live location updates, nearby searches, and geofencing
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Owner = require('../models/Owner');
const DeliveryBoy = require('../models/DeliveryBoy');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const {
  validateLocationUpdate,
  validateNearbyQuery,
  validateDeliveryBoyLocation,
  formatLocationResponse,
  sanitizeLocation,
  calculateDistance,
  LOCATION_CONFIG
} = require('../middleware/locationValidator');

/**
 * ==========================================
 * USER LOCATION ENDPOINTS
 * ==========================================
 */

/**
 * Update user location
 * POST /api/locations/user
 * Body: { latitude, longitude, address }
 */
router.post('/user', auth, validateLocationUpdate, async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    const userId = req.user.id;

    // Sanitize location data
    const location = sanitizeLocation({ latitude, longitude });

    // Update user with new location
    const user = await User.findByIdAndUpdate(
      userId,
      {
        location,
        address: address || req.body.address,
        lastLocationUpdate: new Date()
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Emit real-time location update via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('userLocationUpdated', {
        userId,
        location: formatLocationResponse(user.location),
        address: user.address,
        timestamp: user.lastLocationUpdate
      });
    }

    res.json({
      success: true,
      message: 'User location updated successfully',
      user: {
        id: user._id,
        name: user.name,
        location: formatLocationResponse(user.location),
        address: user.address,
        lastLocationUpdate: user.lastLocationUpdate
      }
    });
  } catch (error) {
    console.error('❌ Error updating user location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user location',
      error: error.message
    });
  }
});

/**
 * Get user location
 * GET /api/locations/user
 */
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('location address lastLocationUpdate name email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        location: formatLocationResponse(user.location),
        address: user.address,
        lastLocationUpdate: user.lastLocationUpdate
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user location',
      error: error.message
    });
  }
});

/**
 * ==========================================
 * NEARBY RESTAURANTS ENDPOINT
 * ==========================================
 */

/**
 * Find nearby restaurants
 * POST /api/locations/nearby-restaurants
 * Body: { latitude, longitude, radius (optional) }
 * Returns restaurants within specified radius from user location
 */
router.post('/nearby-restaurants', auth, validateNearbyQuery, async (req, res) => {
  try {
    const { latitude, longitude, radius = LOCATION_CONFIG.DEFAULT_RADIUS_KM, cuisine } = req.body;
    console.log('📍 [Nearby] Request body:', JSON.stringify(req.body, null, 2));
    const { isRestaurantOpen } = require('../utils/timeUtils');

    // Convert radius from km to meters for MongoDB geospatial query
    const radiusInMeters = radius * 1000;

    // Build match stage
    const matchStage = { isOpen: true, deleted: { $ne: true }, approved: true };

    // Add cuisine filter if provided and not 'All'
    if (cuisine && cuisine !== 'All' && cuisine.trim() !== '') {
      // Create a regex that matches the cuisine as a whole word or part of a comma-separated list
      // e.g. "Pizza" matches "Pizza", "Pizza, Burger", "Italian, Pizza"
      // We use word boundaries or logic to ensure we don't match "Pineapple" when searching for "Apple" if we want strictness,
      // but for cuisines, usually partial match is okay.
      // However, to be robust against "North Indian" vs "Indian", we might want to check containment.
      // The user wants "Indian" to find "North Indian" => YES.
      // The previous logic `new RegExp(cuisine, 'i')` does this.
      // The issue was likely empty string or whitespace.

      const cleanCuisine = cuisine.trim();
      console.log(`[Backend] Filtering by cuisine: "${cleanCuisine}"`);
      matchStage.cuisine = { $regex: new RegExp(cleanCuisine, 'i') };
    } else {
      console.log('[Backend] No cuisine filter applied');
    }

    // Query restaurants near user location
    const restaurants = await Restaurant.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          distanceField: 'distance',
          maxDistance: radiusInMeters,
          spherical: true
        }
      },
      {
        $match: matchStage
      },
      {
        $lookup: {
          from: 'owners',
          localField: 'owner',
          foreignField: '_id',
          as: 'ownerDetails'
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          cuisine: 1,
          address: 1,
          phone: 1,
          image: 1,
          rating: 1,
          deliveryTime: 1,
          minOrder: 1,
          location: 1,
          distance: { $divide: ['$distance', 1000] }, // Convert back to km
          owner: 1,
          owner: 1,
          isOpen: 1,
          openingTime: 1,
          closingTime: 1,
          openingPeriod: 1,
          closingPeriod: 1
        }
      },
      { $sort: { distance: 1 } },
      { $limit: 50 } // Limit results to top 50 nearest restaurants
    ]);

    console.log(`✅ Found ${restaurants.length} nearby restaurants for user at [${latitude}, ${longitude}]`);

    res.json({
      success: true,
      count: restaurants.length,
      radius: radius,
      userLocation: {
        latitude,
        longitude
      },
      restaurants: restaurants.map(r => ({
        id: r._id,
        name: r.name,
        description: r.description,
        cuisine: r.cuisine,
        address: r.address,
        phone: r.phone,
        image: r.image,
        rating: r.rating,
        deliveryTime: r.deliveryTime,
        minOrder: r.minOrder,
        location: formatLocationResponse(r.location),
        distance: r.distance.toFixed(2) + ' km',
        isOpen: isRestaurantOpen(r),
        openingTime: r.openingTime,
        closingTime: r.closingTime,
        openingPeriod: r.openingPeriod,
        closingPeriod: r.closingPeriod
      }))
    });
  } catch (error) {
    console.error('❌ Error finding nearby restaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find nearby restaurants',
      error: error.message
    });
  }
});

/**
 * ==========================================
 * OWNER/RESTAURANT LOCATION ENDPOINTS
 * ==========================================
 */

/**
 * Update owner location
 * POST /api/locations/owner
 * Body: { latitude, longitude, address }
 */
router.post('/owner', auth, validateLocationUpdate, async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    const userId = req.user.id;

    // Find owner by userId
    const owner = await Owner.findOne({ user: userId });
    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found'
      });
    }

    // Sanitize location
    const location = sanitizeLocation({ latitude, longitude });

    // Update owner location
    const updatedOwner = await Owner.findByIdAndUpdate(
      owner._id,
      {
        location,
        address: address || req.body.address,
        lastLocationUpdate: new Date()
      },
      { new: true }
    ).populate('user', 'name email');

    // Emit real-time location update
    const io = req.app.get('io');
    if (io) {
      io.to(`owner_${owner._id}`).emit('ownerLocationUpdated', {
        ownerId: owner._id,
        userId,
        location: formatLocationResponse(updatedOwner.location),
        address: updatedOwner.address,
        timestamp: updatedOwner.lastLocationUpdate
      });
    }

    res.json({
      success: true,
      message: 'Owner location updated successfully',
      owner: {
        id: updatedOwner._id,
        userId: updatedOwner.user._id,
        name: updatedOwner.user.name,
        location: formatLocationResponse(updatedOwner.location),
        address: updatedOwner.address,
        lastLocationUpdate: updatedOwner.lastLocationUpdate
      }
    });
  } catch (error) {
    console.error('❌ Error updating owner location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update owner location',
      error: error.message
    });
  }
});

/**
 * Update restaurant location
 * PUT /api/locations/restaurant/:restaurantId
 * Body: { latitude, longitude, address }
 */
router.put('/restaurant/:restaurantId', auth, validateLocationUpdate, async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    const { restaurantId } = req.params;
    const userId = req.user.id;

    // Verify owner permission
    const owner = await Owner.findOne({ user: userId });
    if (!owner) {
      return res.status(403).json({
        success: false,
        message: 'Only owners can update restaurant locations'
      });
    }

    // Find restaurant and verify ownership
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || !restaurant.owner.equals(owner._id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this restaurant location'
      });
    }

    // Sanitize location
    const location = sanitizeLocation({ latitude, longitude });

    // Update restaurant location
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      restaurantId,
      {
        location,
        address: address || req.body.address
      },
      { new: true }
    );

    console.log(`✅ Restaurant ${restaurantId} location updated`);

    res.json({
      success: true,
      message: 'Restaurant location updated successfully',
      restaurant: {
        id: updatedRestaurant._id,
        name: updatedRestaurant.name,
        location: formatLocationResponse(updatedRestaurant.location),
        address: updatedRestaurant.address
      }
    });
  } catch (error) {
    console.error('❌ Error updating restaurant location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update restaurant location',
      error: error.message
    });
  }
});

/**
 * ==========================================
 * DELIVERY BOY LOCATION ENDPOINTS
 * ==========================================
 */

/**
 * Update delivery boy location
 * POST /api/locations/delivery-boy
 * Body: { latitude, longitude, address }
 */
router.post('/delivery-boy', auth, validateDeliveryBoyLocation, async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    const userId = req.user.id;

    // Find delivery boy
    const deliveryBoy = await DeliveryBoy.findOne({ user: userId });
    if (!deliveryBoy) {
      return res.status(404).json({
        success: false,
        message: 'Delivery boy profile not found'
      });
    }

    // Sanitize location
    const location = sanitizeLocation({ latitude, longitude });

    // Update delivery boy location
    const updatedDeliveryBoy = await DeliveryBoy.findByIdAndUpdate(
      deliveryBoy._id,
      {
        location,
        address: address || req.body.address,
        lastLocationUpdate: new Date()
      },
      { new: true }
    ).populate('user', 'name email phone');

    // Emit real-time location update to all connected clients
    const io = req.app.get('io');
    if (io) {
      // Notify owner/admin
      io.to(`admin_delivery_tracking`).emit('deliveryBoyLocationUpdated', {
        deliveryBoyId: deliveryBoy._id,
        userId,
        location: formatLocationResponse(updatedDeliveryBoy.location),
        address: updatedDeliveryBoy.address,
        isAvailable: updatedDeliveryBoy.isAvailable,
        timestamp: updatedDeliveryBoy.lastLocationUpdate
      });

      // Notify users with active orders from this delivery boy
      if (updatedDeliveryBoy.currentOrders && updatedDeliveryBoy.currentOrders.length > 0) {
        for (const orderId of updatedDeliveryBoy.currentOrders) {
          io.to(`order_${orderId}`).emit('deliveryBoyLocationUpdated', {
            deliveryBoyId: deliveryBoy._id,
            location: formatLocationResponse(updatedDeliveryBoy.location),
            address: updatedDeliveryBoy.address,
            timestamp: updatedDeliveryBoy.lastLocationUpdate
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'Delivery boy location updated successfully',
      deliveryBoy: {
        id: updatedDeliveryBoy._id,
        userId: updatedDeliveryBoy.user._id,
        name: updatedDeliveryBoy.user.name,
        phone: updatedDeliveryBoy.user.phone,
        location: formatLocationResponse(updatedDeliveryBoy.location),
        address: updatedDeliveryBoy.address,
        isAvailable: updatedDeliveryBoy.isAvailable,
        lastLocationUpdate: updatedDeliveryBoy.lastLocationUpdate
      }
    });
  } catch (error) {
    console.error('❌ Error updating delivery boy location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update delivery boy location',
      error: error.message
    });
  }
});

/**
 * Get nearby available delivery boys
 * POST /api/locations/nearby-delivery-boys
 * Body: { latitude, longitude, radius (optional) }
 * Returns available delivery boys near a location (e.g., restaurant)
 */
router.post('/nearby-delivery-boys', auth, validateNearbyQuery, async (req, res) => {
  try {
    const { latitude, longitude, radius = LOCATION_CONFIG.DEFAULT_RADIUS_KM } = req.body;

    // Convert radius to meters
    const radiusInMeters = radius * 1000;

    // Query available delivery boys near location
    const deliveryBoys = await DeliveryBoy.aggregate([
      {
        $match: { isAvailable: true }
      },
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          distanceField: 'distance',
          maxDistance: radiusInMeters,
          spherical: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $project: {
          phone: 1,
          vehicleType: 1,
          isAvailable: 1,
          location: 1,
          address: 1,
          distance: { $divide: ['$distance', 1000] }, // Convert to km
          userDetails: {
            name: 1,
            email: 1,
            phone: 1
          },
          currentOrders: { $size: { $ifNull: ['$currentOrders', []] } },
          rating: 1
        }
      },
      { $sort: { distance: 1, currentOrders: 1 } },
      { $limit: 10 }
    ]);

    console.log(`✅ Found ${deliveryBoys.length} nearby available delivery boys`);

    res.json({
      success: true,
      count: deliveryBoys.length,
      radius: radius,
      location: { latitude, longitude },
      deliveryBoys: deliveryBoys.map(db => ({
        id: db._id,
        name: db.userDetails.name,
        email: db.userDetails.email,
        phone: db.userDetails.phone,
        vehicleType: db.vehicleType,
        location: formatLocationResponse(db.location),
        address: db.address,
        distance: db.distance.toFixed(2) + ' km',
        isAvailable: db.isAvailable,
        currentOrders: db.currentOrders,
        rating: db.rating
      }))
    });
  } catch (error) {
    console.error('❌ Error finding nearby delivery boys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find nearby delivery boys',
      error: error.message
    });
  }
});

/**
 * ==========================================
 * UTILITY ENDPOINTS
 * ==========================================
 */

/**
 * Calculate distance between two points
 * POST /api/locations/distance
 * Body: { point1: [lat, lng], point2: [lat, lng] }
 */
router.post('/distance', (req, res) => {
  try {
    const { point1, point2 } = req.body;

    if (!Array.isArray(point1) || !Array.isArray(point2) || point1.length !== 2 || point2.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinate format. Expected [latitude, longitude]'
      });
    }

    // Note: calculateDistance expects [longitude, latitude]
    const distance = calculateDistance(
      [point1[1], point1[0]], // Convert to [lng, lat]
      [point2[1], point2[0]]
    );

    res.json({
      success: true,
      distance: distance.toFixed(2) + ' km',
      distanceMeters: Math.round(distance * 1000)
    });
  } catch (error) {
    console.error('❌ Error calculating distance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate distance',
      error: error.message
    });
  }
});

module.exports = router;
