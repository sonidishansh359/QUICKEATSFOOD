const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const DeliveryBoy = require('../models/DeliveryBoy');
const User = require('../models/User');

/**
 * GET /api/tracking/delivery-boy/:orderId
 * Get order details for a delivery boy who is assigned to deliver this order
 * Requires: JWT token from delivery boy
 * NOTE: This must come BEFORE the generic /:orderId route to match correctly
 */
router.get('/delivery-boy/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const deliveryBoyUserId = req.user.id;

    console.log(`\n🔍 Fetching order for delivery boy ${deliveryBoyUserId}, order ${orderId}`);
    console.log('📌 User role:', req.user.role);
    console.log('📌 User ID:', req.user.id);

    // Check if user has delivery_boy role (allow if role matches, don't strictly require DeliveryBoy profile)
    const isDeliveryBoyRole = req.user.role === 'delivery_boy' || req.user.role === 'delivery';

    // Find the DeliveryBoy record for this user (optional - might not exist until first pickup)
    const deliveryBoy = await DeliveryBoy.findOne({ user: deliveryBoyUserId });

    if (!isDeliveryBoyRole && !deliveryBoy) {
      console.log(`❌ User ${deliveryBoyUserId} is not a delivery boy (role: ${req.user.role}, no profile)`);
      return res.status(403).json({ message: 'Not authorized to view delivery orders' });
    }

    // Fetch order
    const order = await Order.findById(orderId)
      .populate('user', 'name phone email address location')
      .populate('restaurant', 'name address image location')
      .populate({
        path: 'deliveryBoy',
        populate: { path: 'user', select: 'name phone email' }
      })
      .populate('items.menuItem', 'name price');

    if (!order) {
      console.log(`❌ Order ${orderId} not found`);
      return res.status(404).json({ message: 'Order not found' });
    }

    // If delivery boy is assigned to this order, verify match
    // If NOT assigned yet, allow view for role-based delivery boys (for accept/pickup flow)
    if (order.deliveryBoy) {
      const orderDeliveryBoyId = order.deliveryBoy?._id?.toString() || (order.deliveryBoy ? order.deliveryBoy.toString() : null);
      const currentDeliveryBoyId = deliveryBoy?._id?.toString() || null;

      console.log('🔐 Delivery Boy Assignment Check:', {
        orderDeliveryBoyId,
        currentDeliveryBoyId,
        match: orderDeliveryBoyId === currentDeliveryBoyId
      });

      if (currentDeliveryBoyId && orderDeliveryBoyId !== currentDeliveryBoyId) {
        console.log(`❌ Delivery boy ${currentDeliveryBoyId} not assigned to order ${orderId}`);
        return res.status(403).json({ message: 'You are not assigned to this order' });
      }
    } else {
      // Order not assigned yet - allow delivery_boy role to view for accept flow
      if (!isDeliveryBoyRole) {
        console.log(`❌ Order not assigned and user is not a delivery boy`);
        return res.status(403).json({ message: 'Not authorized to view this order' });
      }
      console.log('ℹ️ Order not yet assigned, allowing delivery boy role to view for accept flow');
    }

    console.log(`✅ Order retrieved for delivery boy ${deliveryBoyUserId}`);

    res.json({
      _id: order._id,
      status: order.status,
      deliveryStatus: order.deliveryStatus,
      user: {
        name: order.user?.name || 'Customer',
        phone: order.user?.phone || '',
        email: order.user?.email || '',
        address: order.user?.address || '',
        location: order.user?.location
      },
      restaurant: {
        _id: order.restaurant?._id,
        name: order.restaurant?.name || 'Restaurant',
        address: order.restaurant?.address || '',
        image: order.restaurant?.image || '',
        location: order.restaurant?.location
      },
      items: order.items || [],
      deliveryAddress: order.deliveryAddress || '',
      specialInstructions: order.specialInstructions || '',
      specialInstructions: order.specialInstructions || '',
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      acceptedAt: order.acceptedAt,
      deliveryBoy: order.deliveryBoy ? {
        _id: order.deliveryBoy._id,
        name: order.deliveryBoy.user?.name || 'Delivery Boy',
        phone: order.deliveryBoy.user?.phone || order.deliveryBoy.phone || '',
        vehicleType: order.deliveryBoy.vehicleType,
        vehicleNumber: order.deliveryBoy.licenseNumber,
        rating: order.deliveryBoy.rating || 0
      } : null
    });
  } catch (error) {
    console.error('❌ Error fetching order for delivery boy:', error);
    res.status(500).json({ message: 'Error fetching order details' });
  }
});

/**
 * GET /api/tracking/:orderId
 * Get complete tracking information for an order
 * Requires: JWT token from user
 */
router.get('/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    console.log(`\n🔍 Fetching tracking for order ${orderId}, user ${userId}`);

    // Fetch order with all details
    const order = await Order.findById(orderId)
      .populate('user')
      .populate('restaurant')
      .populate('deliveryBoy')
      .lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify user owns this order
    if (order.user._id.toString() !== userId.toString()) {
      console.log(`❌ Unauthorized: User ${userId} tried to access order of user ${order.user._id}`);
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if order has delivery boy assigned
    if (!order.deliveryBoy) {
      console.log(`ℹ️ Order ${orderId} has no delivery boy assigned yet`);
      return res.json({
        orderId: order._id,
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        hasDeliveryBoy: false,
        deliveryBoyPopulated: null
      });
    }

    // Get delivery boy with user info
    const deliveryBoyWithUser = await DeliveryBoy.findById(order.deliveryBoy)
      .populate('user')
      .lean();

    if (!deliveryBoyWithUser) {
      return res.json({
        orderId: order._id,
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        hasDeliveryBoy: false
      });
    }

    console.log(`✅ Tracking data retrieved for order ${orderId}`);

    res.json({
      orderId: order._id,
      status: order.status,
      deliveryStatus: order.deliveryStatus,
      hasDeliveryBoy: true,
      deliveryBoyPopulated: {
        hasUser: !!deliveryBoyWithUser.user,
        userName: deliveryBoyWithUser.user?.name || 'Delivery Boy',
        userPhone: deliveryBoyWithUser.user?.phone || '',
        deliveryBoyPhone: deliveryBoyWithUser.phone || '',
        vehicleType: deliveryBoyWithUser.vehicleType || 'bike',
        licenseNumber: deliveryBoyWithUser.licenseNumber || 'N/A',
        rating: deliveryBoyWithUser.rating || 0
      },
      restaurant: {
        _id: order.restaurant._id,
        name: order.restaurant.name
      },
      deliveryAddress: order.deliveryAddress,
      acceptedAt: order.acceptedAt,
      createdAt: order.createdAt
    });
  } catch (error) {
    console.error('❌ Error fetching tracking:', error);
    res.status(500).json({ message: 'Error fetching tracking information' });
  }
});

/**
 * POST /api/tracking/:orderId/start
 * Start live tracking for an order (called when order is accepted)
 * Requires: JWT token from delivery boy
 */
router.post('/:orderId/start', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const deliveryBoyUserId = req.user._id;

    console.log(`\n🚀 Starting tracking for order ${orderId}, delivery boy: ${deliveryBoyUserId}`);

    // Verify delivery boy exists
    const deliveryBoy = await DeliveryBoy.findOne({ user: deliveryBoyUserId });
    if (!deliveryBoy) {
      return res.status(403).json({ message: 'Not authorized as delivery boy' });
    }

    // Update order status if not already started
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'out_for_delivery') {
      console.log(`⚠️ Order status is ${order.status}, expected out_for_delivery`);
    }

    console.log(`✅ Tracking started for order ${orderId}`);
    res.json({ success: true, message: 'Tracking started' });
  } catch (error) {
    console.error('❌ Error starting tracking:', error);
    res.status(500).json({ message: 'Error starting tracking' });
  }
});

/**
 * POST /api/tracking/:orderId/stop
 * Stop live tracking for an order (called when order is delivered)
 * Requires: JWT token from delivery boy
 */
router.post('/:orderId/stop', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const deliveryBoyUserId = req.user._id;

    console.log(`\n🛑 Stopping tracking for order ${orderId}, delivery boy: ${deliveryBoyUserId}`);

    // Verify delivery boy exists
    const deliveryBoy = await DeliveryBoy.findOne({ user: deliveryBoyUserId });
    if (!deliveryBoy) {
      return res.status(403).json({ message: 'Not authorized as delivery boy' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log(`✅ Tracking stopped for order ${orderId}`);
    res.json({ success: true, message: 'Tracking stopped' });
  } catch (error) {
    console.error('❌ Error stopping tracking:', error);
    res.status(500).json({ message: 'Error stopping tracking' });
  }
});

module.exports = router;
