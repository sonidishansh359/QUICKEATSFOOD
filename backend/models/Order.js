const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  items: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number } // Base price at time of order
  }],
  deliveryAddress: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  ownerEarning: { type: Number, default: 0 }, // Earning for the restaurant owner (Base Price)
  adminEarning: { type: Number, default: 0 }, // Earning for admin (15% Markup + Tax)
  subtotal: { type: Number }, // Amount before discount
  discountAmount: { type: Number, default: 0 }, // Discount amount applied
  taxAmount: { type: Number, default: 0 }, // Tax amount added to order
  promoCode: { type: mongoose.Schema.Types.ObjectId, ref: 'PromoCode' }, // Applied promo code
  specialInstructions: { type: String }, // User's special requests for the order
  paymentMethod: { type: String, enum: ['upi', 'card', 'cod', 'online'], default: 'cod' },
  paymentStatus: { type: String, enum: ['unpaid', 'paid', 'pay_on_delivery', 'cash_collected', 'refunded'], default: 'unpaid' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  status: { type: String, enum: ['placed', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'], default: 'placed' },
  // Delivery tracking - internal state for delivery boys (not visible to user)
  deliveryStatus: { type: String, enum: ['assigned', 'picked', 'on_the_way', 'delivered'], default: 'assigned' },
  deliveryBoy: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryBoy' },
  acceptedAt: { type: Date }, // When delivery boy accepted the order
  // OTP verification for delivery confirmation
  deliveryOTP: { type: String }, // OTP sent to customer for delivery confirmation
  deliveryOTPExpiry: { type: Date }, // Expiry time for OTP (10 minutes)
  deliveryOTPAttempts: { type: Number, default: 0 }, // Track failed OTP attempts
  isOTPVerified: { type: Boolean, default: false }, // Track if OTP was verified
  deliveredAt: { type: Date }, // When order was successfully delivered
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
