require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

// Determine allowed origin (support both dev ports)
// Determine allowed origin (support both dev ports and local network IPs)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8081',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8081',
  'http://localhost:8082',
  'http://127.0.0.1:8082',
  'https://quickeatsfood.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list or is a local network IP
    if (allowedOrigins.indexOf(origin) !== -1 ||
      origin.startsWith('http://10.') ||
      origin.startsWith('http://192.168.') ||
      origin.startsWith('http://172.') ||
      origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

const io = socketIo(server, {
  cors: corsOptions
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database connection
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant';
if (!process.env.MONGO_URI) {
  console.warn('⚠️ WARNING: MONGO_URI environment variable is not set. Falling back to localhost MongoDB.');
}
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.error('👉 Tip: Ensure your MONGO_URI is correct and your IP is whitelisted in MongoDB Atlas (add 0.0.0.0/0 for Render).');
    }
  });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/owners', require('./routes/owners'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/delivery-boys', require('./routes/delivery-boys'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/promo-codes', require('./routes/promo-codes'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin-earnings', require('./routes/admin-earnings'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/admin/reports', require('./routes/reports.routes'));
app.use('/api/owner-report', require('./routes/owner-report'));
app.use('/api/delivery-report', require('./routes/delivery-report'));


// Attach io to app for use in routes
app.set('io', io);

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      socket.userId = decoded.user.id;
      socket.userRole = decoded.user.role;
      console.log('✅ Socket authenticated - User ID:', decoded.user.id, 'Role:', decoded.user.role);
      next();
    } catch (err) {
      console.error('❌ Socket authentication error:', err.message);
      next(new Error('Authentication error'));
    }
  } else {
    // Allow connection without token for now, but mark as unauthenticated
    console.log('⚠️ Socket connection without authentication token');
    next();
  }
});

// Socket.IO handlers
io.on('connection', (socket) => {
  console.log('🔌 User connected - Socket ID:', socket.id, 'User ID:', socket.userId, 'Role:', socket.userRole);
  console.log('📊 Total connected clients:', io.engine.clientsCount);

  // Handle owner connection and join room
  socket.on('joinOwnerRoom', (ownerId) => {
    socket.join(`owner_${ownerId}`);
    console.log(`Owner ${ownerId} joined room: owner_${ownerId}`);
  });

  // Handle delivery boy connection and join room
  socket.on('joinDeliveryBoyRoom', (data) => {
    const deliveryBoyId = typeof data === 'object' ? data.deliveryBoyId : data;
    if (!deliveryBoyId) return;
    socket.join(`delivery_${deliveryBoyId}`);
    console.log(`Delivery boy ${deliveryBoyId} joined room: delivery_${deliveryBoyId}`);
  });

  // Handle user connection and join user-specific room for order updates
  socket.on('joinUserRoom', (data) => {
    const userId = data.userId;
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room: user_${userId}`);
  });

  // Join order room for chat/updates
  socket.on('joinOrderChat', (data) => {
    const { orderId } = data || {};
    if (!orderId) return;
    socket.join(`order_${orderId}`);
    console.log(`Socket ${socket.id} joined order chat room: order_${orderId}`);
  });

  /**
   * ==========================================
   * LOCATION TRACKING SOCKET EVENTS
   * ==========================================
   */

  // User sends live location
  socket.on('userLocationUpdate', (data) => {
    try {
      const { userId, orderId, latitude, longitude, address } = data;
      console.log(`\n📍 USER SENDING LOCATION - Order: ${orderId}, User: ${userId}, Coords: [${latitude.toFixed(6)}, ${longitude.toFixed(6)}]`);

      // Broadcast to admin/tracking dashboard
      io.to('admin_tracking').emit('userLocationUpdated', {
        userId,
        orderId,
        latitude,
        longitude,
        address,
        timestamp: new Date(),
        socketId: socket.id
      });

      // Broadcast to specific user's room
      io.to(`user_${userId}`).emit('userLocationUpdated', {
        userId,
        orderId,
        latitude,
        longitude,
        address,
        timestamp: new Date()
      });

      // Also broadcast to delivery boy who is tracking this order
      if (orderId) {
        const roomName = `order_${orderId}`;
        const roomClients = io.sockets.adapter.rooms.get(roomName);
        const clientCount = roomClients ? roomClients.size : 0;

        console.log(`📢 Broadcasting user location to room ${roomName} (${clientCount} clients connected)`);

        io.to(roomName).emit('userLocationUpdate', {
          orderId,
          userId,
          latitude,
          longitude,
          address,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('❌ Error handling user location update:', error);
      socket.emit('error', { message: 'Failed to update location' });
    }
  });

  // Delivery boy sends live location
  socket.on('deliveryBoyLocationUpdate', (data) => {
    try {
      const { deliveryBoyId, latitude, longitude, address, orderId } = data;
      console.log(`📍 Delivery Boy ${deliveryBoyId} location update: [${latitude}, ${longitude}]`);

      // Broadcast to all tracking dashboards
      io.to('admin_delivery_tracking').emit('deliveryBoyLocationUpdated', {
        deliveryBoyId,
        latitude,
        longitude,
        address,
        orderId,
        timestamp: new Date()
      });

      // Broadcast to specific order room so user can track delivery
      if (orderId) {
        io.to(`order_${orderId}`).emit('deliveryBoyLocationUpdated', {
          deliveryBoyId,
          latitude,
          longitude,
          address,
          orderId,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('❌ Error handling delivery boy location update:', error);
      socket.emit('error', { message: 'Failed to update delivery location' });
    }
  });

  // Owner sends live location
  socket.on('ownerLocationUpdate', (data) => {
    try {
      const { ownerId, latitude, longitude, address } = data;
      console.log(`📍 Owner ${ownerId} location update: [${latitude}, ${longitude}]`);

      // Broadcast to admin
      io.to('admin_tracking').emit('ownerLocationUpdated', {
        ownerId,
        latitude,
        longitude,
        address,
        timestamp: new Date()
      });

      // Broadcast to specific owner's room
      io.to(`owner_${ownerId}`).emit('ownerLocationUpdated', {
        ownerId,
        latitude,
        longitude,
        address,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('❌ Error handling owner location update:', error);
      socket.emit('error', { message: 'Failed to update location' });
    }
  });

  // Subscribe to delivery tracking
  socket.on('subscribeToDeliveryTracking', (data) => {
    const { orderId } = data;
    socket.join(`order_${orderId}`);
    console.log(`✅ Socket ${socket.id} subscribed to order tracking: order_${orderId}`);
    socket.emit('subscriptionConfirmed', { orderId, message: 'Now tracking delivery' });
  });

  // Subscribe to admin tracking dashboard
  socket.on('subscribeToAdminTracking', () => {
    socket.join('admin_tracking');
    socket.join('admin_delivery_tracking');
    console.log(`✅ Socket ${socket.id} subscribed to admin tracking`);
    socket.emit('subscriptionConfirmed', { message: 'Admin tracking active' });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('🔌 User disconnected - Socket ID:', socket.id, 'User ID:', socket.userId);
    console.log('📊 Remaining connected clients:', io.engine.clientsCount);
  });

  /**
   * ==========================================
   * LIVE DELIVERY TRACKING EVENTS
   * ==========================================
   */

  // Universal location update handler (from any user: customer, delivery boy, owner)
  socket.on('updateLocation', (data) => {
    try {
      const { orderId, latitude, longitude, accuracy, timestamp } = data;
      // Prefer scalar socket.userId (authenticated) over client data
      const userId = socket.userId || data.userId;
      const role = socket.userRole || 'unknown';

      console.log(`\n📍 LOCATION UPDATE - Role: ${role}, Order: ${orderId}, User: ${userId}, Coords: [${latitude?.toFixed(6)}, ${longitude?.toFixed(6)}]`);

      // Validate coordinates
      if (!latitude || !longitude || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        console.error('❌ Invalid coordinates:', { latitude, longitude });
        return;
      }


      if (!orderId) {
        console.warn('⚠️ No orderId provided in location update');
        return;
      }

      const roomName = `order_${orderId}`;
      const roomClients = io.sockets.adapter.rooms.get(roomName);
      const clientCount = roomClients ? roomClients.size : 0;

      console.log(`📢 Broadcasting updateDeliveryLocation to room ${roomName} (${clientCount} clients)`);

      // Broadcast to all clients tracking this order
      const payload = {
        orderId,
        deliveryBoyId: userId,
        latitude,
        longitude,
        accuracy: accuracy || 50,
        timestamp: timestamp || Date.now(),
        role
      };

      // PERSIST LOCATION TO DATABASE
      if (userId) {
        // Find user by ID and update location
        // We use FindByIdAndUpdate to be efficient
        const User = require('./models/User'); // Ensure User model is available
        User.findByIdAndUpdate(userId, {
          location: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          lastLocationUpdate: new Date()
        }).catch(err => {
          console.error('❌ Failed to persist location to DB:', err.message);
        });
      }

      io.to(roomName).emit('updateDeliveryLocation', payload);
      console.log(`✅ Broadcasted updateDeliveryLocation to ${clientCount} clients:`, payload);

      // Also emit legacy events for backward compatibility
      if (role === 'user') {
        io.to(roomName).emit('userLocationUpdate', {
          orderId,
          userId,
          latitude,
          longitude,
          timestamp: timestamp || Date.now()
        });
        console.log(`✅ [LEGACY] Also sent userLocationUpdate`);
      }
    } catch (error) {
      console.error('❌ Error in location update:', error);
    }
  });

  // Legacy event for backward compatibility
  socket.on('deliveryBoyLocationForTracking', (data) => {
    socket.emit('updateLocation', data);
  });

  /**
   * ==========================================
   * IN-APP CHAT EVENTS
   * ==========================================
   */

  socket.on('sendChatMessage', (data = {}) => {
    try {
      const { orderId, message, senderId, senderRole, receiverType, receiverId } = data;
      if (!orderId || !message) return;

      const chatPayload = {
        orderId,
        message,
        senderId: senderId || socket.userId,
        senderRole: senderRole || socket.userRole || 'guest',
        receiverType: receiverType || 'order',
        receiverId: receiverId || null,
        timestamp: new Date().toISOString(),
      };

      // Broadcast to the order room so all participants see it
      io.to(`order_${orderId}`).emit('chatMessage', chatPayload);

      // Also fan-out to specific participant rooms when available
      if (receiverType === 'user' && receiverId) {
        io.to(`user_${receiverId}`).emit('chatMessage', chatPayload);
      }
      if (receiverType === 'delivery' && receiverId) {
        io.to(`delivery_${receiverId}`).emit('chatMessage', chatPayload);
      }
      if (receiverType === 'restaurant' && receiverId) {
        io.to(`owner_${receiverId}`).emit('chatMessage', chatPayload);
      }

      console.log('💬 Chat message dispatched:', chatPayload);
    } catch (error) {
      console.error('❌ Chat message error:', error.message);
    }
  });

  // User subscribes to live tracking for an order
  socket.on('subscribeToLiveTracking', (data) => {
    try {
      const { orderId } = data;
      const userId = socket.userId;

      if (!orderId) {
        socket.emit('trackingError', { message: 'Order ID required' });
        return;
      }

      console.log(`\n📍 USER SUBSCRIBING - User ${userId} subscribing to order room: order_${orderId}`);

      socket.join(`order_${orderId}`);

      const roomName = `order_${orderId}`;
      const roomClients = io.sockets.adapter.rooms.get(roomName);
      const clientCount = roomClients ? roomClients.size : 0;
      console.log(`✅ User joined room order_${orderId} - Total clients in room: ${clientCount}`);

      socket.emit('trackingSubscribed', {
        orderId,
        message: 'Live tracking started',
        timestamp: Date.now()
      });

      console.log(`✅ Subscription confirmed for order_${orderId}`);
    } catch (error) {
      console.error('❌ Error subscribing to tracking:', error);
      socket.emit('trackingError', { message: 'Failed to subscribe to tracking' });
    }
  });

  // Delivery boy unsubscribes from tracking
  socket.on('unsubscribeFromTracking', (data) => {
    try {
      const { orderId } = data;
      console.log(`\n🛑 Unsubscribing from tracking for order ${orderId}`);
      socket.leave(`order_${orderId}`);
      socket.emit('trackingUnsubscribed', { orderId });
    } catch (error) {
      console.error('❌ Error unsubscribing from tracking:', error);
    }
  });

  // Delivery boy rings customer
  socket.on('ringCustomer', async (data) => {
    try {
      const { orderId } = data;
      console.log(`\n🔔 Delivery boy ringing customer for order ${orderId}`);
      if (orderId) {
        io.to(`order_${orderId}`).emit('ringCustomer', { orderId, timestamp: Date.now() });

        // Also emit directly to the user's personal room
        const Order = require('./models/Order');
        const order = await Order.findById(orderId).select('user');
        if (order && order.user) {
          const userId = order.user._id || order.user;
          console.log(`🔔 Also emitting ring Customer to user room: user_${userId}`);
          io.to(`user_${userId}`).emit('ringCustomer', { orderId, timestamp: Date.now() });
        }
      }
    } catch (error) {
      console.error('❌ Error ringing customer:', error);
    }
  });

  // Order status update for tracking
  socket.on('trackingStatusUpdate', (data) => {
    try {
      const { orderId, status, message } = data;
      console.log(`\n📦 Tracking status update for order ${orderId}: ${status}`);

      io.to(`order_${orderId}`).emit('trackingStatusUpdate', {
        orderId,
        status,
        message,
        timestamp: Date.now()
      });

      console.log(`✅ Status update emitted for order ${orderId}`);
    } catch (error) {
      console.error('❌ Error emitting status update:', error);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
  ********************************************
  * 🚀 SERVER RESTARTED SUCCESSFULLY         *
  * ✅ NEW BALANCE LOGIC IS ACTIVE           *
  * 📡 Server running on port ${PORT}          *
  ********************************************
  `);
});
// Export io for use in routes
module.exports = { server, io, app };