const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const Owner = require('../models/Owner');
const Transaction = require('../models/Transaction');
const Suggestion = require('../models/Suggestion');
const PromoCode = require('../models/PromoCode');
const auth = require('../middleware/auth');
const ownerAuth = require('../middleware/ownerAuth');

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

// Create order
router.post('/', auth, async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress, totalAmount, paymentMethod, specialInstructions, promoCodeId, subtotal, paymentDetails, taxAmount } = req.body;

    // Check if restaurant is open
    const { isRestaurantOpen } = require('../utils/timeUtils');
    const restaurantCheck = await Restaurant.findById(restaurantId);

    if (!restaurantCheck) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (!isRestaurantOpen(restaurantCheck)) {
      return res.status(400).json({ message: 'Restaurant is currently closed for orders' });
    }

    console.log('\n=== NEW ORDER PLACED ===');
    console.log('User ID:', req.user.id);
    console.log('Restaurant ID:', restaurantId);
    console.log('Items:', JSON.stringify(items, null, 2));
    console.log('Total Amount:', totalAmount);
    console.log('Subtotal:', subtotal);
    console.log('Delivery Address:', deliveryAddress);
    console.log('Promo Code:', promoCodeId || 'None');

    // Validate required fields
    if (!restaurantId) {
      console.log('❌ Validation failed: Missing restaurantId');
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }
    if (!items || items.length === 0) {
      console.log('❌ Validation failed: No items in order');
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }
    if (!deliveryAddress) {
      console.log('❌ Validation failed: Missing delivery address');
      return res.status(400).json({ message: 'Delivery address is required' });
    }
    if (!totalAmount || totalAmount <= 0) {
      console.log('❌ Validation failed: Invalid total amount');
      return res.status(400).json({ message: 'Valid total amount is required' });
    }

    // Validate items structure
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.menuItem) {
        console.log(`❌ Validation failed: Item ${i} missing menuItem`);
        return res.status(400).json({ message: `Item ${i + 1} is missing menu item reference` });
      }
      if (!item.quantity || item.quantity <= 0) {
        console.log(`❌ Validation failed: Item ${i} has invalid quantity`);
        return res.status(400).json({ message: `Item ${i + 1} has invalid quantity` });
      }
      if (!item.price || item.price <= 0) {
        console.log(`❌ Validation failed: Item ${i} has invalid price`);
        return res.status(400).json({ message: `Item ${i + 1} has invalid price` });
      }
    }

    // Calculate discount if promo code is provided
    let discountAmount = 0;
    if (promoCodeId) {
      const promoCode = await PromoCode.findById(promoCodeId);
      if (promoCode) {
        discountAmount = (subtotal * promoCode.discountPercentage) / 100;
        // Increment usage count
        promoCode.usageCount += 1;
        await promoCode.save();
        console.log('💰 Discount applied:', promoCode.code, '-', discountAmount);
      }
    }

    // Validate restaurant exists and is not soft-deleted
    const restaurantDoc = await Restaurant.findById(restaurantId).select('name image owner deleted');
    if (!restaurantDoc || restaurantDoc.deleted) {
      return res.status(400).json({ message: 'This restaurant is unavailable' });
    }

    // Calculate Owner and Admin Earnings
    let totalOwnerEarning = 0;
    const enrichedItems = [];

    // We need to fetch original prices from DB to be secure and accurate
    const MenuItem = require('../models/MenuItem');
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId || item.menuItem); // Handle both formats
      let basePrice;
      let itemName = item.name;

      if (menuItem) {
        // Use originalPrice (Base Price) if available. 
        basePrice = menuItem.originalPrice !== undefined
          ? menuItem.originalPrice
          : (menuItem.price / 1.15);
        
        itemName = menuItem.name;

        console.log(`🔍 Item Debug: Name=${menuItem.name}, ID=${menuItem._id}, OriginalPrice=${menuItem.originalPrice}, Price=${menuItem.price}, CalcBase=${basePrice}, ReqPrice=${item.price}`);

        totalOwnerEarning += basePrice * item.quantity;
      } else {
        // Fallback if item deleted (shouldn't happen due to checks above)
        console.log(`⚠️ Item not found in DB, using fallback. ReqPrice=${item.price}`);
        basePrice = (item.price / 1.15);
        totalOwnerEarning += basePrice * item.quantity;
      }

      enrichedItems.push({
        ...item,
        name: itemName || item.name || 'Item',
        originalPrice: Math.round(basePrice * 100) / 100
      });
    }

    // Rounding to 2 decimal places to avoid floating point issues
    totalOwnerEarning = Math.round(totalOwnerEarning * 100) / 100;
    const adminEarning = Math.round((totalAmount - totalOwnerEarning) * 100) / 100;

    console.log(`💰 Earnings Split - Owner: ${totalOwnerEarning}, Admin: ${adminEarning}`);

    const order = new Order({
      user: req.user.id,
      restaurant: restaurantId,
      items: enrichedItems,
      deliveryAddress,
      subtotal: subtotal || totalAmount,
      totalAmount,
      ownerEarning: totalOwnerEarning,
      adminEarning: adminEarning,
      discountAmount,
      taxAmount: taxAmount || 0,
      promoCode: promoCodeId || null,
      specialInstructions: specialInstructions || '',
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: (paymentMethod === 'online' || paymentMethod === 'upi' || paymentMethod === 'card') ? 'paid' : 'pay_on_delivery',
      razorpayOrderId: paymentDetails?.razorpayOrderId,
      razorpayPaymentId: paymentDetails?.razorpayPaymentId,
      razorpaySignature: paymentDetails?.razorpaySignature
    });

    await order.save();
    console.log('✅ Order saved to DB:', order._id);

    // --- ADMIN EARNINGS UPDATE (New Flow) ---
    try {
      const Admin = require('../models/Admin');
      const Transaction = require('../models/Transaction');
      const User = require('../models/User');

      // Find the MAIN admin user
      const ADMIN_EMAIL = 'quickeatsfoodadmin@gmail.com';
      let adminUser = await User.findOne({ email: ADMIN_EMAIL });

      if (!adminUser) {
        // Fallback to any admin if main one is missing (though it should exist)
        adminUser = await User.findOne({ role: 'admin' });
      }

      if (adminUser) {
        let admin = await Admin.findOne({ user: adminUser._id });
        if (!admin) {
          console.log('Admin wallet not found, creating new one for:', adminUser.email);
          admin = new Admin({ user: adminUser._id });
        }

        const previousBalance = admin.availableBalance || 0;
        admin.availableBalance = previousBalance + totalAmount;
        admin.totalEarnings = (admin.totalEarnings || 0) + totalAmount;

        await admin.save();
        console.log(`💰 Admin Earnings Updated: +${totalAmount}`);
        console.log(`   - Previous Balance: ${previousBalance}`);
        console.log(`   - New Balance: ${admin.availableBalance}`);

        // Create Transaction
        await Transaction.create({
          admin: admin._id,
          amount: totalAmount,
          type: 'earning',
          status: 'success',
          referenceId: order._id.toString(),
          description: `Order #${order._id.toString().slice(-6)} Payment`
        });
        console.log('✅ Admin Transaction log created.');
      } else {
        console.error('❌ CRITICAL: No Admin user found. Earnings not credited!');
      }
    } catch (adminErr) {
      console.error('⚠️ Error updating admin earnings:', adminErr);
    }
    // ----------------------------------------

    await order.populate('restaurant', 'name image owner');
    await order.populate('user', 'name phone email');

    console.log('🏪 Restaurant:', order.restaurant?.name, '| Owner:', order.restaurant?.owner);

    let suggestionDoc = null;
    if (specialInstructions && specialInstructions.trim()) {
      const restaurantOwnerId = order.restaurant?.owner || (await Restaurant.findById(restaurantId).select('owner'))?.owner;
      if (restaurantOwnerId) {
        suggestionDoc = await Suggestion.create({
          order: order._id,
          restaurant: restaurantId,
          owner: restaurantOwnerId,
          user: req.user.id,
          text: specialInstructions.trim()
        });
      } else {
        console.warn('⚠️ No owner found for restaurant; skipping suggestion save');
      }
    }

    const orderPayload = order.toObject();
    orderPayload.specialInstructions = suggestionDoc?.text || orderPayload.specialInstructions || '';
    console.log('📝 Order special instructions:', orderPayload.specialInstructions || '(none)');

    // Emit socket event to owner
    const io = req.app.get('io');
    const restaurant = await Restaurant.findById(restaurantId);

    if (restaurant && restaurant.owner) {
      // Get the owner's user ID
      const owner = await Owner.findById(restaurant.owner);
      if (owner) {
        console.log(`📤 Emitting newOrder to owner room: owner_${owner.user}`);
        io.to(`owner_${owner.user}`).emit('newOrder', orderPayload);
      }
    }

    // Emit to Admin
    io.to('admin_tracking').emit('newOrderAdmin', {
      ...orderPayload,
      user: { name: req.user.name || 'Customer' } // Ensure basic user details
    });

    // Emit socket event to user that order was placed successfully
    console.log(`📤 Emitting orderPlaced to user: user_${req.user.id}`);
    io.to(`user_${req.user.id}`).emit('orderStatusUpdate', {
      orderId: order._id,
      status: 'placed',
      restaurantName: order.restaurant.name,
      message: 'Order placed successfully!'
    });

    // Send Order Receipt Email
    try {
      const { sendOrderReceiptEmail } = require('../config/email');
      if (order.user && order.user.email) {
        console.log(`📧 Sending order receipt to ${order.user.email}...`);
        sendOrderReceiptEmail(order.user.email, order.user.name, order, order.items)
          .catch(err => console.error('❌ Error triggering receipt email:', err));
      }
    } catch (emailError) {
      console.error('❌ Error initializing email service:', emailError);
    }

    console.log('✅ Order placed successfully - ID:', order._id);
    res.status(201).json(order);
  } catch (err) {
    console.error('❌ Error creating order:', err);

    // Check if it's a mongoose validation error
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      console.error('Validation errors:', errors);
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors
      });
    }

    // Check if it's a cast error (invalid ObjectId)
    if (err.name === 'CastError') {
      console.error('Cast error:', err.message);
      return res.status(400).json({
        message: 'Invalid ID format',
        field: err.path
      });
    }

    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get user orders
router.get('/user', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('restaurant', 'name image')
      .populate({
        path: 'deliveryBoy',
        populate: { path: 'user', select: 'name phone email' }
      })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available orders for delivery boys (status = out_for_delivery, no delivery boy assigned)
router.get('/available-deliveries', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery_boy') {
      return res.status(403).json({ message: 'Only delivery boys can access this' });
    }

    // Get delivery boy's current location from Query Params (Live) or DB (Stored)
    let dbLatitude, dbLongitude;

    if (req.query.lat && req.query.lng) {
      dbLatitude = parseFloat(req.query.lat);
      dbLongitude = parseFloat(req.query.lng);
      console.log(`📍 Using LIVE location from query: [${dbLatitude}, ${dbLongitude}]`);
    } else {
      const DeliveryBoy = require('../models/DeliveryBoy');
      const deliveryBoy = await DeliveryBoy.findOne({ user: req.user.id });

      if (!deliveryBoy || !deliveryBoy.location || !deliveryBoy.location.coordinates ||
        (deliveryBoy.location.coordinates[0] === 0 && deliveryBoy.location.coordinates[1] === 0)) {
        console.log('⚠️ Delivery boy location not set in DB and no query params provided');
        return res.json([]); // Return empty array if location not set anywhere
      }

      [dbLongitude, dbLatitude] = deliveryBoy.location.coordinates;
      console.log(`📍 Using STORED location from DB: [${dbLatitude}, ${dbLongitude}]`);
    }

    // Find all available orders
    const orders = await Order.find({
      status: { $in: ['ready_for_pickup', 'out_for_delivery'] },
      deliveryBoy: null
    })
      .populate('user', 'name phone email location')
      .populate('restaurant', 'name address phone location')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${orders.length} total available orders`);

    // Filter orders based on 5km distance from delivery boy to RESTAURANT
    // (Delivery boy needs to be close to the restaurant to pick up)
    const MAX_DISTANCE_KM = 5;
    const filteredOrders = orders.filter(order => {
      if (!order.restaurant) {
        console.log(`⚠️ Order ${order._id} - Restaurant not populated`);
        return false;
      }

      if (!order.restaurant.location) {
        console.log(`⚠️ Order ${order._id} - Restaurant location not found`);
        return false;
      }

      const restLoc = order.restaurant.location;
      if (!restLoc.coordinates || (restLoc.coordinates[0] === 0 && restLoc.coordinates[1] === 0)) {
        console.log(`⚠️ Order ${order._id} - Restaurant coordinates invalid`);
        return false;
      }

      const [restLongitude, restLatitude] = restLoc.coordinates;

      // Calculate pickup distance (Delivery Boy -> Restaurant)
      const distance = calculateDistance(dbLatitude, dbLongitude, restLatitude, restLongitude);

      // Check if within 5km of restaurant
      let include = distance <= MAX_DISTANCE_KM;

      // Check delivery distance (Restaurant -> Customer)
      // Ensure the dropoff is not unreasonably far (e.g., > 12km) relative to the pickup
      if (include && order.user && order.user.location && order.user.location.coordinates &&
        order.user.location.coordinates.length === 2 &&
        (order.user.location.coordinates[0] !== 0 || order.user.location.coordinates[1] !== 0)) {

        const [userLng, userLat] = order.user.location.coordinates;
        // Check if delivery distance is reasonable (e.g. within 12km)
        // The user complained about 17km (likely delivery distance), so we filter those out.
        const deliveryDistance = calculateDistance(restLatitude, restLongitude, userLat, userLng);

        if (deliveryDistance > 12) {
          console.log(`❌ Order ${order._id.toString().slice(-6)} Excluded: Delivery Distance ${deliveryDistance.toFixed(2)}km > 12km`);
          include = false;
        }
      }

      console.log(`📏 Order ${order._id.toString().slice(-6)}: Rest [${restLatitude.toFixed(4)}, ${restLongitude.toFixed(4)}] Pickup Dist = ${distance.toFixed(2)} km ${include ? '✅ INCLUDED' : '❌ EXCLUDED'}`);

      // Attach distances to the order object (temporary property for mapping)
      if (include) {
        order.pickupDistance = parseFloat(distance.toFixed(1));

        // Calculate delivery distance if user location exists
        if (order.user && order.user.location && order.user.location.coordinates &&
          order.user.location.coordinates.length === 2 &&
          (order.user.location.coordinates[0] !== 0 || order.user.location.coordinates[1] !== 0)) {
          const [userLng, userLat] = order.user.location.coordinates;
          const deliveryDist = calculateDistance(restLatitude, restLongitude, userLat, userLng);
          order.deliveryDistance = parseFloat(deliveryDist.toFixed(1));
        } else {
          order.deliveryDistance = null; // Unknown
        }
      }

      return include;
    });

    console.log(`✅ Filtered to ${filteredOrders.length}/${orders.length} orders within ${MAX_DISTANCE_KM}km of restaurant`);

    // Map to a clean response format with distances
    const responseOrders = filteredOrders.map(order => {
      const obj = order.toObject();
      obj.pickupDistance = order.pickupDistance;
      obj.deliveryDistance = order.deliveryDistance;
      return obj;
    });

    res.json(responseOrders);
  } catch (err) {
    console.error('Error fetching available deliveries:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get orders for restaurant (owner only) - MUST BE BEFORE /:id ROUTE
router.get('/restaurant', ownerAuth, async (req, res) => {
  try {
    // req.owner.restaurants might be an array or a single ID, handle both cases
    const restaurantIds = Array.isArray(req.owner.restaurants)
      ? req.owner.restaurants
      : [req.owner.restaurants];

    console.log('\n=== FETCHING ORDERS FOR RESTAURANT ===');
    console.log('Owner ID:', req.owner._id);
    console.log('Owner User ID:', req.owner.user);
    console.log('Restaurant IDs:', restaurantIds);
    console.log('Filter:', { restaurant: { $in: restaurantIds } });

    const orders = await Order.find({ restaurant: { $in: restaurantIds } })
      .select('+specialInstructions')
      .populate('user', 'name phone email')
      .populate('restaurant', 'name owner')
      .populate('items.menuItem', 'name price')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${orders.length} orders for restaurants:`, restaurantIds);

    if (orders.length > 0) {
      console.log('📋 Orders:', orders.map(o => ({
        id: o._id.toString().slice(-6),
        status: o.status,
        customer: o.user?.name,
        amount: o.totalAmount,
        ownerEarning: o.ownerEarning, // Check if this exists
        firstItemOriginalPrice: o.items && o.items.length > 0 ? o.items[0].originalPrice : 'N/A',
        restaurant: o.restaurant?.name,
        created: o.createdAt
      })));
    }

    const orderIds = orders.map(o => o._id.toString());
    const suggestions = await Suggestion.find({ order: { $in: orderIds } }).lean();
    const suggestionMap = new Map(suggestions.map(s => [s.order.toString(), s.text]));

    const enriched = orders.map(o => {
      const obj = o.toObject();
      obj.specialInstructions = suggestionMap.get(o._id.toString()) || obj.specialInstructions || '';
      return obj;
    });

    console.log('📦 Returning', enriched.length, 'enriched orders to owner');

    res.json(enriched);
  } catch (err) {
    console.error('❌ Error fetching restaurant orders:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single order by ID
// Get single order by ID (requires auth)
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('\n🔍 Fetching order by ID:', req.params.id);
    console.log('📌 Requesting user:', {
      userId: req.user?.id,
      role: req.user?.role
    });

    const order = await Order.findById(req.params.id)
      .populate('user', 'name phone email')
      .populate('restaurant', 'name address image')
      .populate({
        path: 'deliveryBoy',
        populate: { path: 'user', select: 'name phone email' }
      })
      .populate('items.menuItem', 'name price');

    if (!order) {
      console.log('❌ Order not found');
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('✅ Order found:', {
      id: order._id,
      status: order.status,
      hasDeliveryBoy: !!order.deliveryBoy,
      orderUserId: order.user?._id,
      deliveryBoyId: order.deliveryBoy?._id,
      deliveryBoyUserId: order.deliveryBoy?.user?._id,
      deliveryBoyUserName: order.deliveryBoy?.user?.name,
      deliveryBoyUserPhone: order.deliveryBoy?.user?.phone
    });

    // Check if user has permission to view this order
    const orderUserId = (order.user._id || order.user).toString();
    const requestUserId = req.user.id.toString();

    console.log('🔐 FULL ID DEBUG:', {
      orderUserType: typeof order.user,
      orderUserIdType: typeof order.user._id,
      orderUserIdValue: order.user._id,
      orderUserIdString: orderUserId,
      requestUserType: typeof req.user.id,
      requestUserIdValue: req.user.id,
      requestUserIdString: requestUserId,
      match: orderUserId === requestUserId,
      req_user: JSON.stringify(req.user)
    });

    console.log('🔐 ID COMPARISON:', {
      orderUserId: `"${orderUserId}"`,
      requestUserId: `"${requestUserId}"`,
      match: orderUserId === requestUserId
    });

    // Also check if the requester is the assigned delivery boy
    let isDeliveryBoy = false;
    if (order.deliveryBoy) {
      const deliveryBoyUserId = order.deliveryBoy.user?._id?.toString() || order.deliveryBoy.user?.toString();
      isDeliveryBoy = deliveryBoyUserId === requestUserId;
      console.log('🚚 Delivery Boy Check:', {
        deliveryBoyUserId: `"${deliveryBoyUserId}"`,
        requestUserId: `"${requestUserId}"`,
        isDeliveryBoy
      });
    }

    // Check if requester is the restaurant owner
    let isRestaurantOwner = false;
    if (req.user.role === 'owner') {
      const restaurantId = (order.restaurant._id || order.restaurant).toString();
      const Owner = require('../models/Owner');
      const owner = await Owner.findOne({ user: requestUserId });
      if (owner && owner.restaurants) {
        const ownerRestaurantIds = Array.isArray(owner.restaurants)
          ? owner.restaurants.map(id => id.toString())
          : [owner.restaurants.toString()];
        isRestaurantOwner = ownerRestaurantIds.includes(restaurantId);
      }
    }

    const isAdmin = req.user.role === 'admin';

    console.log('🔐 Authorization check:', {
      orderUserId,
      requestUserId,
      isCustomer: orderUserId === requestUserId,
      isDeliveryBoy,
      isRestaurantOwner,
      isAdmin,
      userRole: req.user.role,
      willAllow: (orderUserId === requestUserId || isDeliveryBoy || isRestaurantOwner || isAdmin)
    });

    // Allow access if user is the customer OR the assigned delivery boy OR the restaurant owner OR an admin
    if (orderUserId !== requestUserId && !isDeliveryBoy && !isRestaurantOwner && !isAdmin) {
      console.log('❌ Not authorized - User is not customer, delivery boy, or restaurant owner');
      return res.status(403).json({
        message: 'Not authorized to view this order',
        debug: {
          orderUserId,
          requestUserId,
          isCustomer: orderUserId === requestUserId,
          isDeliveryBoy,
          isRestaurantOwner
        }
      });
    }

    console.log('✅ User authorized to view order');

    console.log('📤 Sending order to frontend:', {
      hasDeliveryBoy: !!order.deliveryBoy,
      deliveryBoyPopulated: order.deliveryBoy ? {
        hasUser: !!order.deliveryBoy.user,
        userName: order.deliveryBoy.user?.name,
        userPhone: order.deliveryBoy.user?.phone,
        deliveryBoyPhone: order.deliveryBoy.phone,
        vehicleType: order.deliveryBoy.vehicleType,
        licenseNumber: order.deliveryBoy.licenseNumber
      } : null
    });

    // CRITICAL: Re-fetch phone if missing in populated data
    if (order.deliveryBoy && order.deliveryBoy.user) {
      if (!order.deliveryBoy.user.phone || order.deliveryBoy.user.phone === '') {
        console.warn('⚠️ Phone missing in User model, checking DeliveryBoy phone field...');
        if (order.deliveryBoy.phone) {
          order.deliveryBoy.user.phone = order.deliveryBoy.phone;
          console.log('✅ Phone retrieved from DeliveryBoy model:', order.deliveryBoy.phone);
        } else {
          console.warn('⚠️ Phone not found in DeliveryBoy model either');
          const User = require('../models/User');
          const userWithPhone = await User.findById(order.deliveryBoy.user._id).select('phone');
          if (userWithPhone && userWithPhone.phone) {
            order.deliveryBoy.user.phone = userWithPhone.phone;
            console.log('✅ Phone retrieved from User direct query:', userWithPhone.phone);
          }
        }
      }
    }

    // Convert to plain object and add deliveryBoyPopulated for compatibility
    const orderObj = order.toObject ? order.toObject() : order;
    if (orderObj.deliveryBoy) {
      orderObj.deliveryBoyPopulated = orderObj.deliveryBoy;
    }

    console.log('📤 Final response:', JSON.stringify({
      _id: orderObj._id,
      hasDeliveryBoy: !!orderObj.deliveryBoy,
      deliveryBoy: orderObj.deliveryBoy
    }, null, 2));

    res.json(orderObj);
  } catch (err) {
    console.error('❌ Error fetching order:', err);
    console.error('Stack:', err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update order status (owner only)
router.put('/:id/status', ownerAuth, async (req, res) => {
  try {
    console.log('\n=== UPDATE ORDER STATUS REQUEST ===');
    console.log('Order ID:', req.params.id);
    console.log('Owner ID:', req.owner._id);
    console.log('Requested status:', req.body.status);

    const order = await Order.findById(req.params.id);
    if (!order) {
      console.log('❌ Order not found:', req.params.id);
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('✓ Order found');
    console.log('Order restaurant ID:', order.restaurant);

    // Check if the owner owns this restaurant by querying the Restaurant directly
    const restaurant = await Restaurant.findById(order.restaurant);
    if (!restaurant) {
      console.log('❌ Restaurant not found:', order.restaurant);
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    console.log('✓ Restaurant found');
    console.log('Restaurant owner:', restaurant.owner);
    console.log('Request owner:', req.owner._id);

    // Direct comparison - check if restaurant.owner matches req.owner._id
    if (restaurant.owner.toString() !== req.owner._id.toString()) {
      console.log('\n❌ Authorization FAILED');
      console.log('Restaurant owner:', restaurant.owner.toString());
      console.log('Request owner:', req.owner._id.toString());
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    console.log('\n✓ Authorization passed - updating order status to:', req.body.status);

    // Owner can only change status up to 'out_for_delivery' OR 'delivered' (if self-delivery/override)
    const allowedOwnerStatuses = ['placed', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!allowedOwnerStatuses.includes(req.body.status)) {
      console.log('❌ Owner cannot set status to:', req.body.status);
      return res.status(403).json({ message: 'Owner can only change status up to out_for_delivery' });
    }

    order.status = req.body.status;

    // If owner marks as 'out_for_delivery', transfer funds from Admin to Owner (New Flow)
    // Note: We use 'out_for_delivery' as the transfer point as requested ("when owner do order out for delivery")
    if (req.body.status === 'out_for_delivery') {
      await processOwnerPayout(order._id);
    }

    // --- CANCELLATION & REFUND LOGIC ---
    if (req.body.status === 'cancelled') {
      console.log('🚫 Order Cancelled by Owner. Checking refund logic for order:', order._id);
      
      const isOnlinePayment = ['online', 'upi', 'card'].includes(order.paymentMethod);
      const isPaid = order.paymentStatus === 'paid';
      
      if (isOnlinePayment || isPaid) {
        console.log(`💸 Refund needed for order ${order._id}. Amount: ₹${order.totalAmount}`);
        
        try {
          const Admin = require('../models/Admin');
          const Transaction = require('../models/Transaction');
          const User = require('../models/User');

          const ADMIN_EMAIL = 'quickeatsfoodadmin@gmail.com';
          let adminUser = await User.findOne({ email: ADMIN_EMAIL });
          if (!adminUser) {
            adminUser = await User.findOne({ role: 'admin' });
          }

          if (adminUser) {
            let adminWallet = await Admin.findOne({ user: adminUser._id });
            if (adminWallet) {
              // Admin returns the money they received back to the user
              adminWallet.availableBalance -= order.totalAmount;
              await adminWallet.save();
              console.log(`✅ Admin wallet deducted for refund. New Bal: ${adminWallet.availableBalance}`);
              
              // Create Transaction entry: "bhai order cancel thayo che a rite m"
              await Transaction.create({
                admin: adminWallet._id,
                amount: -order.totalAmount, // Negative since admin is returning funds
                type: 'withdrawal',
                status: 'success',
                description: `Refund: Order Cancelled by Restaurant #${order._id.toString().slice(-6)}`,
                referenceId: order._id.toString()
              });
              console.log('✅ Admin Refund Transaction Created.');
            }
          }
          
          order.paymentStatus = 'refunded';
        } catch (err) {
          console.error('❌ Error processing refund:', err);
        }
      }
    }
    // -----------------------------------

    await order.save();

    // Populate data before sending socket events and emails
    await order.populate('user', 'name phone email');
    
    // Send Cancellation Email to User
    if (req.body.status === 'cancelled' && order.user && order.user.email) {
      const { sendOrderCancelledEmail } = require('../config/email');
      const isOnlinePayment = ['online', 'upi', 'card'].includes(order.paymentMethod);
      const isPaidOrRefunded = ['paid', 'refunded'].includes(order.paymentStatus);
      const refundAmount = (isOnlinePayment || isPaidOrRefunded) ? order.totalAmount : 0;
      
      try {
        await sendOrderCancelledEmail(
          order.user.email,
          order.user.name,
          order,
          refundAmount,
          'Cancelled by Restaurant'
        );
      } catch (emailErr) {
        console.error('❌ Error sending cancellation email:', emailErr);
      }
    }

    // Populate data before sending socket events
    await order.populate('user', 'name phone email');
    await order.populate('restaurant', 'name address');

    // Emit socket event to notify the user about status change
    const io = req.app.get('io');
    const userId = order.user._id || order.user;
    const ownerId = order.restaurant.owner;
    console.log(`📤 Emitting orderStatusUpdate to user room: user_${userId}`);
    const statusPayload = {
      orderId: order._id,
      status: order.status,
      updatedAt: new Date()
    };
    console.log('📦 Status update payload:', JSON.stringify(statusPayload, null, 2));
    io.to(`user_${userId}`).emit('orderStatusUpdate', statusPayload);
    console.log('✅ Status update emitted to user');

    // Also emit to owner so they see notification updates
    console.log(`📤 Emitting orderStatusUpdate to owner room: owner_${ownerId}`);
    io.to(`owner_${ownerId}`).emit('orderStatusUpdate', {
      orderId: order._id,
      status: order.status,
      updatedAt: new Date()
    });
    console.log('✅ Status update emitted to owner');

    // If status is out_for_delivery, broadcast to all available delivery boys
    if (req.body.status === 'out_for_delivery') {
      console.log('📦 Broadcasting order to available delivery boys');

      // Get fresh populated order data for socket emission with location
      const populatedOrder = await Order.findById(order._id)
        .populate('user', 'name phone email location')
        .populate('restaurant', 'name address location');

      if (populatedOrder) {
        const orderPayload = {
          _id: populatedOrder._id,
          restaurant: {
            _id: populatedOrder.restaurant._id,
            name: populatedOrder.restaurant.name || 'Restaurant',
            address: populatedOrder.restaurant.address || 'Restaurant address',
            location: populatedOrder.restaurant.location
          },
          user: {
            _id: populatedOrder.user._id,
            name: populatedOrder.user.name || 'Customer',
            phone: populatedOrder.user.phone || '',
            location: populatedOrder.user.location
          },
          items: populatedOrder.items || [],
          status: populatedOrder.status,
          totalAmount: populatedOrder.totalAmount,
          deliveryAddress: populatedOrder.deliveryAddress,
          createdAt: populatedOrder.createdAt,
          updatedAt: populatedOrder.updatedAt
        };
        console.log('📤 Emitting newDeliveryOrder event:', JSON.stringify(orderPayload, null, 2));
        console.log('🔊 Broadcasting to all connected clients');
        io.emit('newDeliveryOrder', orderPayload);
        console.log('✅ Event emitted successfully');
      } else {
        console.error('❌ Failed to fetch populated order for socket emission');
      }
    }

    console.log('✓ Order updated successfully and user notified\n');
    res.json(order);
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get available orders for delivery boys (status = out_for_delivery, no delivery boy assigned)
// Accept/pickup order (delivery boy)
router.put('/:id/accept-delivery', auth, async (req, res) => {
  try {
    // Normalize role: 'delivery_boy' or 'delivery'
    const userRole = req.user.role === 'delivery_boy' ? 'delivery_boy' : req.user.role;
    if (userRole !== 'delivery_boy' && userRole !== 'delivery') {
      return res.status(403).json({ message: 'Only delivery boys can accept orders' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Allow accepting when order is not yet assigned; normalize status to out_for_delivery
    const allowedStatuses = ['placed', 'accepted', 'preparing', 'out_for_delivery'];
    if (!allowedStatuses.includes(order.status)) {
      return res.status(400).json({ message: 'Order is not available for delivery' });
    }

    if (order.deliveryBoy) {
      return res.status(400).json({ message: 'Order already assigned to another delivery boy' });
    }

    // Find or create delivery boy profile and populate user details
    const DeliveryBoy = require('../models/DeliveryBoy');
    let deliveryBoy = await DeliveryBoy.findOne({ user: req.user.id }).populate('user', 'name phone email');

    // Auto-create delivery boy profile if it doesn't exist
    if (!deliveryBoy) {
      console.log('⚠️ Delivery boy profile not found, creating one...');
      deliveryBoy = new DeliveryBoy({
        user: req.user.id,
        vehicleType: 'bike', // Default
        licenseNumber: 'TEMP-' + Date.now(), // Temporary license
        isAvailable: true,
        currentOrders: [],
        earnings: 0
      });
      await deliveryBoy.save();
      await deliveryBoy.populate('user', 'name phone email');
      console.log('✅ Created delivery boy profile:', deliveryBoy._id);
    }

    if (!deliveryBoy.user) {
      return res.status(404).json({ message: 'Delivery boy user profile not found' });
    }

    console.log('📋 Delivery boy user details:', {
      id: deliveryBoy.user._id,
      name: deliveryBoy.user.name,
      phone: deliveryBoy.user.phone || 'NOT SET',
      email: deliveryBoy.user.email
    });

    // CRITICAL: Ensure phone number exists - re-fetch from User model if needed
    if (!deliveryBoy.user.phone || deliveryBoy.user.phone === '') {
      console.warn('⚠️ Phone number not populated, fetching from User model...');
      const User = require('../models/User');
      const userWithPhone = await User.findById(deliveryBoy.user._id).select('name phone email');
      if (userWithPhone && userWithPhone.phone) {
        deliveryBoy.user.phone = userWithPhone.phone;
        console.log('✅ Phone number retrieved:', userWithPhone.phone);
      } else {
        console.error('❌ CRITICAL: User has no phone number in database!');
      }
    }

    // Assign delivery boy and change delivery status (and order status -> out_for_delivery)
    order.deliveryBoy = deliveryBoy._id;
    order.deliveryStatus = 'picked';
    order.status = 'out_for_delivery';
    order.acceptedAt = new Date(); // Record when delivery boy accepted
    await order.save();

    // Trigger Owner Payout when picked up / out for delivery
    await processOwnerPayout(order._id);


    // Update delivery boy availability
    deliveryBoy.isAvailable = false;
    deliveryBoy.currentOrders.push(order._id);
    await deliveryBoy.save();

    // Populate order with user and restaurant details including location
    await order.populate('user', 'name phone email location');
    await order.populate('restaurant', 'name address phone location');
    await order.populate({
      path: 'deliveryBoy',
      populate: { path: 'user', select: 'name phone email' }
    });

    // Emit delivery boy assigned event to the user
    const io = req.app.get('io');
    const userId = order.user?._id?.toString();

    if (!userId) {
      console.error('❌ Cannot emit: userId is undefined');
      return res.status(500).json({ message: 'Failed to notify user' });
    }

    // Get phone from deliveryBoy.phone (fallback) or deliveryBoy.user.phone
    const deliveryBoyPhone = deliveryBoy.user.phone || deliveryBoy.phone || '';

    // VALIDATION: Warn if phone is still empty
    if (!deliveryBoyPhone || deliveryBoyPhone === '') {
      console.error('❌❌❌ CRITICAL ERROR: Phone number is EMPTY! Cannot notify user properly.');
      console.error('Delivery boy user ID:', deliveryBoy.user._id);
      console.error('Please run: node backend/update-all-delivery-phones.js');
    } else {
      console.log('✅✅✅ Phone number verified:', deliveryBoyPhone);
    }

    const deliveryBoyDetails = {
      _id: deliveryBoy._id,
      user: {
        _id: deliveryBoy.user._id,
        name: deliveryBoy.user.name || 'Delivery Partner',
        phone: deliveryBoyPhone,
        email: deliveryBoy.user.email || ''
      },
      vehicleType: deliveryBoy.vehicleType || 'bike',
      vehicleNumber: deliveryBoy.licenseNumber || '',
      rating: deliveryBoy.rating || 0
    };

    console.log(`📍 Emitting deliveryBoyAssigned event to user: ${userId}`);
    console.log(`📤 Delivery boy details:`, JSON.stringify(deliveryBoyDetails, null, 2));
    io.to(`user_${userId}`).emit('deliveryBoyAssigned', {
      orderId: order._id.toString(),
      deliveryBoy: deliveryBoyDetails,
      status: order.status,
      deliveryAddress: order.deliveryAddress
    });
    console.log('✅ Delivery boy assignment notified to user');

    res.json(order);
  } catch (err) {
    console.error('Error accepting delivery:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update delivery status (delivery boy only - can mark as delivered)
router.put('/:id/delivery-status', auth, async (req, res) => {
  try {
    // Normalize role: 'delivery_boy' or 'delivery'
    const userRole = req.user.role === 'delivery_boy' ? 'delivery_boy' : req.user.role;
    if (userRole !== 'delivery_boy' && userRole !== 'delivery') {
      return res.status(403).json({ message: 'Only delivery boys can update delivery status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Find delivery boy profile
    const DeliveryBoy = require('../models/DeliveryBoy');
    const deliveryBoy = await DeliveryBoy.findOne({ user: req.user.id });
    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery boy profile not found' });
    }

    // Check if this delivery boy is assigned to this order
    if (!order.deliveryBoy || order.deliveryBoy.toString() !== deliveryBoy._id.toString()) {
      console.log('❌ Assignment mismatch:', {
        orderId: req.params.id,
        orderDeliveryBoy: order.deliveryBoy?.toString(),
        deliveryBoyId: deliveryBoy._id.toString(),
        match: order.deliveryBoy?.toString() === deliveryBoy._id.toString()
      });
      return res.status(403).json({
        message: 'You are not assigned to this order',
        orderId: req.params.id,
        expectedDeliveryBoy: deliveryBoy._id.toString(),
        assignedDeliveryBoy: order.deliveryBoy?.toString()
      });
    }

    const { status } = req.body;

    // Delivery boy can update deliveryStatus to: picked, on_the_way, delivered
    const allowedDeliveryStatuses = ['picked', 'on_the_way', 'delivered'];
    if (!allowedDeliveryStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid delivery status' });
    }

    console.log(`📍 Updating delivery status for order ${req.params.id} to: ${status}`);

    // When marking as delivered, generate and send OTP to customer
    if (status === 'delivered') {
      const { generateOTP, getOTPExpiry } = require('../utils/otp');
      const { sendDeliveryOTPEmail } = require('../config/email');

      // Generate OTP
      const otp = generateOTP();
      const otpExpiry = getOTPExpiry();

      // Store OTP in order
      order.deliveryOTP = otp;
      order.deliveryOTPExpiry = otpExpiry;
      order.deliveryOTPAttempts = 0;

      console.log(`🔐 Generated delivery OTP for order ${req.params.id}: ${otp}`);

      // Populate user and restaurant details for email
      await order.populate('user', 'name email');
      await order.populate('restaurant', 'name');

      // Send OTP email to customer
      const emailResult = await sendDeliveryOTPEmail(
        order.user.email,
        order.user.name,
        otp,
        order._id.toString(),
        order.restaurant.name
      );

      if (emailResult.success) {
        console.log(`📧 OTP email sent successfully to ${order.user.email}`);
      } else {
        console.error(`❌ Failed to send OTP email: ${emailResult.error}`);
        return res.status(500).json({
          message: 'Failed to send OTP email',
          error: emailResult.error
        });
      }

      // Save order with OTP
      await order.save();

      // Notify delivery boy to ask customer for OTP
      const io = req.app.get('io');
      const userId = order.user._id || order.user;

      io.to(`user_${userId}`).emit('deliveryOTPRequired', {
        orderId: order._id,
        message: 'Please verify delivery by entering the OTP sent to your email'
      });

      console.log(`📱 Notified user to verify OTP for order ${req.params.id}`);

      // Return response indicating OTP was sent
      return res.json({
        success: true,
        message: 'OTP sent to customer email. Please ask them to verify.',
        orderId: order._id,
        otpSent: true
      });
    }

    // Update internal delivery status for non-delivered status
    order.deliveryStatus = status;

    // Automatically transition the main order status when picked up
    if (status === 'picked') {
      order.status = 'out_for_delivery';
      console.log(`🚀 Order ${order._id} transitioned to out_for_delivery`);
      await processOwnerPayout(order._id);
    }

    await order.save();


    // If not delivered yet, just update status without OTP
    const io = req.app.get('io');
    await order.populate('user', 'name phone email');
    const userId = order.user._id || order.user;
    console.log(`ℹ️ Delivery status updated to ${status} (no OTP needed)`);

    // Emit to both user room and order room
    const statusUpdate = {
      orderId: order._id,
      status: status,
      deliveryStatus: status,
      message: `Delivery status updated to ${status}`,
      updatedAt: new Date()
    };

    io.to(`user_${userId}`).emit('orderStatusUpdate', statusUpdate);
    io.to(`order_${order._id}`).emit('orderStatusUpdate', statusUpdate);

    console.log(`📤 Status update emitted to user room & order room for order ${req.params.id}`);

    res.json({
      success: true,
      message: `Delivery status updated to ${status}`,
      orderId: order._id
    });
  } catch (err) {
    console.error('Error updating delivery status:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Verify delivery OTP (delivery boy sends OTP, system verifies it)
router.post('/:id/verify-delivery-otp', auth, async (req, res) => {
  try {
    const userRole = req.user.role === 'delivery_boy' ? 'delivery_boy' : req.user.role;
    if (userRole !== 'delivery_boy' && userRole !== 'delivery') {
      return res.status(403).json({ message: 'Only delivery boys can verify OTP' });
    }

    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if OTP exists
    if (!order.deliveryOTP) {
      return res.status(400).json({ message: 'No OTP was generated for this order' });
    }

    // Check if OTP has expired
    const { isOTPValid } = require('../utils/otp');
    if (!isOTPValid(order.deliveryOTPExpiry)) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Check if OTP matches
    if (otp !== order.deliveryOTP) {
      order.deliveryOTPAttempts = (order.deliveryOTPAttempts || 0) + 1;
      await order.save();

      // Lock after 3 failed attempts
      if (order.deliveryOTPAttempts >= 3) {
        return res.status(403).json({
          message: 'Too many failed attempts. Please request a new OTP.',
          lockedUntil: order.deliveryOTPExpiry
        });
      }

      return res.status(400).json({
        message: 'Invalid OTP. Please try again.',
        attemptsRemaining: 3 - order.deliveryOTPAttempts
      });
    }

    console.log(`✅ OTP verified for order ${req.params.id}`);

    // OTP is correct - mark as verified and complete delivery
    order.isOTPVerified = true;
    order.deliveryStatus = 'delivered';
    order.status = 'delivered';
    order.isOTPVerified = true;
    order.deliveryStatus = 'delivered';
    order.status = 'delivered';
    order.deliveredAt = new Date();

    // UPDATE PAYMENT STATUS FOR COD
    if (order.paymentMethod === 'cod') {
      order.paymentStatus = 'cash_collected';
      console.log('💰 COD Payment Marked as Collected');
    }

    const DeliveryBoy = require('../models/DeliveryBoy');
    const deliveryBoy = await DeliveryBoy.findOne({ user: req.user.id });

    if (deliveryBoy) {
      // Calculate delivery time
      const deliveredTime = new Date();
      const acceptedTime = order.acceptedAt ? new Date(order.acceptedAt) : new Date(order.createdAt);
      const deliveryTimeMinutes = Math.round((deliveredTime - acceptedTime) / 60000);

      // Add earnings (10% of order amount)
      const deliveryEarning = order.totalAmount * 0.1;

      // Update delivery boy availability and earnings
      deliveryBoy.isAvailable = true;
      deliveryBoy.currentOrders = deliveryBoy.currentOrders.filter(
        orderId => orderId.toString() !== order._id.toString()
      );
      deliveryBoy.earnings = (deliveryBoy.earnings || 0) + deliveryEarning;
      deliveryBoy.totalDeliveries = (deliveryBoy.totalDeliveries || 0) + 1;

      // Update earnings breakdown
      const today = new Date().toISOString().split('T')[0];
      deliveryBoy.earningsBreakdown.today += deliveryEarning;
      deliveryBoy.earningsBreakdown.todayOrders += 1;

      // DEBUG: CREATE AUDIT TRANSACTION STARTER
      const Transaction = require('../models/Transaction');
      try {
        await Transaction.create({
          admin: null, // No admin yet
          amount: 0,
          type: 'withdrawal',
          status: 'success',
          description: `DEBUG: Start Deduction Logic for Order #${order._id}`,
          referenceId: order._id
        });
      } catch (e) { console.error('Debug Log 1 Failed', e); }

      deliveryBoy.earningsBreakdown.thisWeek += deliveryEarning;
      deliveryBoy.earningsBreakdown.weeklyOrders += 1;
      deliveryBoy.earningsBreakdown.thisMonth += deliveryEarning;
      deliveryBoy.earningsBreakdown.monthlyOrders += 1;

      // Update Available Balance
      deliveryBoy.availableBalance = (deliveryBoy.availableBalance || 0) + deliveryEarning;

      // --- DEDUCT FROM ADMIN WALLET (Consolidated) ---
      try {
        const Admin = require('../models/Admin');
        const User = require('../models/User');

        // 1. Find Admin User (Robust check matching creation logic)
        const ADMIN_EMAIL = 'quickeatsfoodadmin@gmail.com';
        // log(`Searching for Admin by Email: ${ADMIN_EMAIL}`);
        let adminUser = await User.findOne({ email: ADMIN_EMAIL });

        if (!adminUser) {
          console.log('⚠️ Admin not found by email, trying role check...');
          // log('⚠️ Admin not found by email, trying role check...');
          adminUser = await User.findOne({ role: 'admin' });
        }


        if (adminUser) {
          // log(`✅ Admin User Found: ${adminUser.email} (${adminUser._id})`);
          // DEBUG: AUDIT ADMIN FOUND
          try {
            await Transaction.create({
              admin: null,
              amount: 0,
              type: 'withdrawal',
              status: 'success',
              description: `DEBUG: Admin Found ${adminUser.email}`,
              referenceId: order._id
            });
          } catch (e) { console.error('Debug Log 2 Failed', e); }

          let adminWallet = await Admin.findOne({ user: adminUser._id });



          if (adminWallet) {
            const oldBalance = adminWallet.availableBalance;
            // Ensure balance doesn't go negative conceptually, though we allow it for payout to succeed?
            // User requested "admin income decrease", implies straightforward math.
            adminWallet.availableBalance -= deliveryEarning;
            await adminWallet.save();

            console.log(`💸 Deducted ₹${deliveryEarning} from Admin (${adminUser.email}). Bal: ${oldBalance} -> ${adminWallet.availableBalance}`);
            // log(`✅ SUCCESS: Deducted ${deliveryEarning} from Admin ${adminUser.email}. Bal: ${oldBalance} -> ${adminWallet.availableBalance}`);



            // Create Transaction for Admin Deduction
            await Transaction.create({
              admin: adminWallet._id,
              amount: -deliveryEarning, // Negative for withdrawal consistency
              type: 'withdrawal',
              status: 'success',
              description: `Delivery Payout for Order #${order._id.toString().slice(-6)}`,
              referenceId: order._id
            });
          } else {
            console.error(`❌ Admin Wallet not found for user ${adminUser._id}`);
          }
        } else {
          console.error('❌ CRITICAL: Admin User not found for deduction!');
        }
      } catch (adminErr) {
        console.error('❌ Error deducting from admin:', adminErr);
      }
      // -----------------------------

      // Create Earning Transaction for Delivery Boy
      try {
        await Transaction.create({
          deliveryBoy: deliveryBoy._id,
          amount: deliveryEarning,
          type: 'earning',
          status: 'success',
          referenceId: order._id.toString(),
          description: `Delivery Earnings for Order #${order._id.toString().slice(-6)}`
        });
      } catch (txErr) {
        console.error('Failed to create delivery boy earning transaction:', txErr);
      }

      // Add to delivery history
      try {
        await order.populate('restaurant', 'name');
        await order.populate('user', 'name');

        const historyEntry = {
          orderId: order._id,
          restaurantName: order.restaurant?.name || 'Unknown Restaurant',
          customerName: order.user?.name || 'Unknown Customer',
          totalAmount: order.totalAmount,
          earnings: deliveryEarning,
          acceptedTime: order.acceptedAt ? order.acceptedAt.toISOString() : new Date().toISOString(),
          deliveredTime: deliveredTime.toISOString(),
          deliveryTime: deliveryTimeMinutes,
          date: today
        };

        deliveryBoy.deliveryHistory.unshift(historyEntry);
      } catch (historyErr) {
        console.error('⚠️ Error building delivery history entry:', historyErr.message);
      }

      try {
        await deliveryBoy.save();
        console.log('✅ Delivery boy earnings and history updated:', {
          earning: deliveryEarning,
          todayTotal: deliveryBoy.earningsBreakdown.today,
          totalDeliveries: deliveryBoy.totalDeliveries
        });
      } catch (saveErr) {
        console.error('⚠️ Error saving delivery boy data:', saveErr.message);
      }
    }

    // --- OWNER EARNINGS UPDATE ---
    // --- OWNER EARNINGS UPDATE (Legacy/Safety Check) ---
    // Note: We moved the main owner earning logic to the 'out_for_delivery' status change.
    // But if for some reason it wasn't triggered there (e.g. direct delivery without out_for_delivery step?), 
    // we might want to handle it here. 
    // For now, based on requirements, the "Order out for delivery" is the trigger for Owner.
    // "Delivered" is the trigger for Delivery Boy.
    // So we will focus on Delivery Boy payout here.

    // --- DELIVERY BOY PAYOUT FROM ADMIN (Removed - Duplicate Logic) ---
    // Logic consolidated above to ensure single source of truth and robust admin lookup
    // -----------------------------

    await order.save();

    // Notify user of successful delivery
    const io = req.app.get('io');
    await order.populate('user', 'name phone email');
    const userId = order.user._id || order.user;

    // Emit to user room
    io.to(`user_${userId}`).emit('orderStatusUpdate', {
      orderId: order._id,
      status: 'delivered',
      message: 'Your order has been successfully delivered!',
      updatedAt: new Date()
    });

    // Also emit to order room for users actively tracking
    io.to(`order_${order._id}`).emit('orderStatusUpdate', {
      orderId: order._id,
      status: 'delivered',
      message: 'Your order has been successfully delivered!',
      updatedAt: new Date()
    });

    console.log(`📤 User notified about successful delivery of order ${req.params.id} (user room & order room)`);

    res.json({
      success: true,
      message: 'Order successfully delivered!',
      orderId: order._id,
      earnings: deliveryBoy ? order.totalAmount * 0.1 : 0
    });
  } catch (err) {
    console.error('Error verifying delivery OTP:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Request new OTP (if expired or lost)
router.post('/:id/request-new-otp', auth, async (req, res) => {
  try {
    const userRole = req.user.role === 'delivery_boy' ? 'delivery_boy' : req.user.role;
    if (userRole !== 'delivery_boy' && userRole !== 'delivery') {
      return res.status(403).json({ message: 'Only delivery boys can request new OTP' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Find delivery boy to verify ownership
    const DeliveryBoy = require('../models/DeliveryBoy');
    const deliveryBoy = await DeliveryBoy.findOne({ user: req.user.id });
    if (!deliveryBoy || order.deliveryBoy.toString() !== deliveryBoy._id.toString()) {
      return res.status(403).json({ message: 'You are not assigned to this order' });
    }

    const { generateOTP, getOTPExpiry } = require('../utils/otp');
    const { sendDeliveryOTPEmail } = require('../config/email');

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    order.deliveryOTP = otp;
    order.deliveryOTPExpiry = otpExpiry;
    order.deliveryOTPAttempts = 0;

    console.log(`🔐 Generated new delivery OTP for order ${req.params.id}: ${otp}`);

    // Populate user and restaurant
    await order.populate('user', 'name email');
    await order.populate('restaurant', 'name');

    // Send new OTP email
    const emailResult = await sendDeliveryOTPEmail(
      order.user.email,
      order.user.name,
      otp,
      order._id.toString(),
      order.restaurant.name
    );

    if (!emailResult.success) {
      return res.status(500).json({
        message: 'Failed to send new OTP email',
        error: emailResult.error
      });
    }

    await order.save();

    console.log(`📧 New OTP email sent to ${order.user.email}`);

    res.json({
      success: true,
      message: 'New OTP has been sent to customer email',
      orderId: order._id
    });
  } catch (err) {
    console.error('Error requesting new OTP:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * Processes payout to the restaurant owner when an order is marked as 'out_for_delivery'
 * @param {string} orderId - The ID of the order
 * @returns {Promise<boolean>} - True if payout was processed or already existed
 */
async function processOwnerPayout(orderId) {
  try {
    const Order = require('../models/Order');
    const Owner = require('../models/Owner');
    const Admin = require('../models/Admin');
    const Transaction = require('../models/Transaction');
    const User = require('../models/User');
    const Restaurant = require('../models/Restaurant');

    const order = await Order.findById(orderId);
    if (!order) return false;

    // Check if payout already exists for this order
    const existingTx = await Transaction.findOne({
      referenceId: order._id.toString(),
      type: 'earning', // Owner earning
      description: { $regex: 'Earnings from Order' }
    });

    if (existingTx) {
      console.log(`⚠️ Owner payout already processed for order ${orderId}`);
      return true;
    }

    // Calculate earning amount
    const earningAmount = order.ownerEarning || (order.totalAmount * 0.85);

    // 1. Check Admin Funds
    const ADMIN_EMAIL = 'quickeatsfoodadmin@gmail.com';
    let adminUser = await User.findOne({ email: ADMIN_EMAIL });
    if (!adminUser) {
      adminUser = await User.findOne({ role: 'admin' });
    }

    if (!adminUser) {
      console.error('❌ Owner Payout Failed: Admin user not found');
      return false;
    }

    const admin = await Admin.findOne({ user: adminUser._id });
    if (!admin) {
      console.error('❌ Owner Payout Failed: Admin wallet not found');
      return false;
    }

    // 2. Find Owner
    const restaurant = await Restaurant.findById(order.restaurant);
    if (!restaurant || !restaurant.owner) {
      console.error(`❌ Owner Payout Failed: Restaurant owner not found for order ${orderId}`);
      return false;
    }
    const owner = await Owner.findById(restaurant.owner);
    if (!owner) {
      console.error(`❌ Owner Payout Failed: Owner profile not found for owner ID ${restaurant.owner}`);
      return false;
    }

    console.log(`💰 Processing payout: ₹${earningAmount} from Admin to Owner ${owner._id}`);

    // 3. Transfer Funds
    const oldAdminBalance = admin.availableBalance || 0;
    admin.availableBalance = oldAdminBalance - earningAmount;
    await admin.save();
    
    const oldOwnerBalance = owner.availableBalance || 0;
    owner.availableBalance = oldOwnerBalance + earningAmount;
    await owner.save();

    console.log(`✅ Funds Transferred: Admin (${oldAdminBalance} -> ${admin.availableBalance}), Owner (${oldOwnerBalance} -> ${owner.availableBalance})`);

    // 4. Create Transactions
    await Transaction.create({
      owner: owner._id,
      amount: earningAmount,
      type: 'earning',
      status: 'success',
      referenceId: order._id.toString(),
      description: `Earnings from Order #${order._id.toString().slice(-6)}`
    });

    await Transaction.create({
      admin: admin._id,
      amount: -earningAmount,
      type: 'withdrawal',
      status: 'success',
      referenceId: order._id.toString(),
      description: `Payout to Owner for Order #${order._id.toString().slice(-6)}`
    });

    return true;
  } catch (err) {
    console.error('❌ Error in processOwnerPayout:', err);
    return false;
  }
}

module.exports = router;

