const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const auth = require('../middleware/auth');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: 'rzp_test_S9BytsU7SUZ08R',
  key_secret: '2YN4OZz9Kev704C8ToFmRuw0'
});

// Create Order endpoint
router.post('/create-order', auth, async (req, res) => {
  try {
    const { amount, currency = 'INR' } = req.body;

    if (!amount) {
      return res.status(400).json({ message: 'Amount is required' });
    }

    // Ensure amount is integer (paise)
    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise,
      currency,
      receipt: `receipt_${Date.now()}_${Math.random().toString(36).substring(7)}`
    };

    console.log('🔄 Creating Razorpay order:', options);

    const order = await razorpay.orders.create(options);

    console.log('✅ Razorpay order created:', order.id);
    res.json(order);
  } catch (error) {
    console.error('❌ Razorpay order creation failed:', error);
    res.status(500).json({
      message: 'Failed to create payment order',
      error: error.message,
      details: error.error // Razorpay error details if available
    });
  }
});

// Verify Payment endpoint
router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", '2YN4OZz9Kev704C8ToFmRuw0')
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      console.log('✅ Payment verification successful for order:', razorpay_order_id);
      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      console.log('❌ Payment verification failed for order:', razorpay_order_id);
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    console.error('❌ Payment verification error:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;
