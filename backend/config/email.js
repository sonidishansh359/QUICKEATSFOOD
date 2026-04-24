const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sonidishansh359@gmail.com',
    pass: 'krprcgobqptxeotf'
  }
});

// Helper function to convert image to Base64
function getImageBase64() {
  try {
    const imagePath = path.join(__dirname, '../src/assets/mailimage.webp');
    if (fs.existsSync(imagePath)) {
      const imageData = fs.readFileSync(imagePath);
      return `data:image/webp;base64,${imageData.toString('base64')}`;
    }
  } catch (error) {
    console.log('Image not found, using fallback');
  }
  return 'cid:mailimage@foodswift'; // Fallback for CID reference
}

// Welcome email templates
const welcomeTemplates = {
  user: (name) => ({
    subject: 'Welcome to QuickEats - Your Food Delivery Journey Starts Here',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; line-height: 1.6; }
          .wrapper { width: 100%; background: #f5f5f5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .hero-image { width: 100% !important; height: auto !important; display: block !important; max-width: 600px !important; border-radius: 8px 8px 0 0; }
          .brand-header { background: #ff6b35; padding: 20px 30px; text-align: center; color: white; }
          .brand-header h1 { font-size: 24px; font-weight: 700; margin: 0; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 18px; color: #1a202c; margin-bottom: 10px; font-weight: 600; }
          .greeting strong { color: #ff6b35; }
          .intro { font-size: 15px; color: #4a5568; line-height: 1.8; margin-bottom: 30px; }
          .features { margin: 30px 0; }
          .feature-item { padding: 15px; margin-bottom: 12px; background: #fff9f5; border-left: 4px solid #ff6b35; border-radius: 4px; transition: all 0.3s ease; }
          .feature-item:last-child { margin-bottom: 0; }
          .feature-icon { font-size: 20px; margin-right: 12px; display: inline-block; }
          .feature-text { color: #2d3748; font-size: 14px; line-height: 1.6; display: inline-block; }
          .feature-text strong { color: #1a202c; display: block; margin-bottom: 4px; font-weight: 600; }
          .feature-text span { color: #718096; font-size: 13px; }
          .cta-section { text-align: center; margin: 35px 0 30px 0; }
          .cta-button { display: inline-block; padding: 14px 48px; background: #ff6b35; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; transition: all 0.3s ease; }
          .cta-button:hover { background: #e55a2a; transform: scale(1.02); }
          .footer { background: #f9f9f9; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #718096; }
          .footer strong { color: #1a202c; }
          .divider { height: 1px; background: #e2e8f0; margin: 20px 0; }
          
          @media only screen and (max-width: 600px) {
            .wrapper { padding: 10px !important; }
            .container { border-radius: 0 !important; }
            .content { padding: 25px 20px !important; }
            .brand-header { padding: 15px 20px !important; }
            .brand-header h1 { font-size: 20px !important; }
            .greeting { font-size: 16px !important; }
            .intro { font-size: 14px !important; margin-bottom: 20px !important; }
            .feature-item { padding: 12px !important; margin-bottom: 10px !important; }
            .feature-icon { font-size: 18px !important; }
            .feature-text { font-size: 13px !important; }
            .cta-button { padding: 12px 40px !important; font-size: 14px !important; }
            .footer { padding: 20px !important; font-size: 11px !important; }
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <img src="${getImageBase64()}" alt="QuickEats" class="hero-image">
            
            <div class="brand-header">
              <h1>🍽️ QuickEats</h1>
            </div>
            
            <div class="content">
              <p class="greeting">Hello <strong>${name}</strong>,</p>
              
              <p class="intro">Welcome to QuickEats! We're thrilled to have you join our community. Get ready to discover amazing restaurants, place orders in seconds, and enjoy delicious meals delivered hot to your doorstep.</p>
              
              <div class="features">
                <div class="feature-item">
                  <span class="feature-icon">🍕</span>
                  <div class="feature-text">
                    <strong>Browse Premium Restaurants</strong>
                    <span>Discover hundreds of cuisines from local favorites</span>
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">⚡</span>
                  <div class="feature-text">
                    <strong>Order in Seconds</strong>
                    <span>Quick and easy ordering process from your phone</span>
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">🚀</span>
                  <div class="feature-text">
                    <strong>Fast & Fresh Delivery</strong>
                    <span>Hot food delivered to your doorstep quickly</span>
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">💳</span>
                  <div class="feature-text">
                    <strong>Secure Payments</strong>
                    <span>Multiple safe payment options for your convenience</span>
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">⭐</span>
                  <div class="feature-text">
                    <strong>Rate & Review</strong>
                    <span>Share your experience and help the community</span>
                  </div>
                </div>
              </div>
              
              <div class="cta-section">
                <a href="http://localhost:5173" class="cta-button">Start Ordering Now</a>
              </div>
              
              <div class="divider"></div>
              
              <p class="intro" style="margin-bottom: 0; font-size: 13px; color: #718096;">Have any questions? Our support team is available 24/7 to help you get the most out of QuickEats.</p>
            </div>
            
            <div class="footer">
              <p><strong>QuickEats</strong> - Delivering Happiness, One Meal at a Time</p>
              <p style="margin-top: 10px; font-size: 11px;">This email was sent because you signed up for QuickEats. If you didn't create this account, please ignore this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  owner: (name) => ({
    subject: 'Welcome to QuickEats Business - Grow Your Restaurant',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; line-height: 1.6; }
          .wrapper { width: 100%; background: #f5f5f5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .hero-image { width: 100% !important; height: auto !important; display: block !important; max-width: 600px !important; border-radius: 8px 8px 0 0; }
          .brand-header { background: #ff6b35; padding: 20px 30px; text-align: center; color: white; }
          .brand-header h1 { font-size: 24px; font-weight: 700; margin: 0; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 18px; color: #1a202c; margin-bottom: 10px; font-weight: 600; }
          .greeting strong { color: #ff6b35; }
          .intro { font-size: 15px; color: #4a5568; line-height: 1.8; margin-bottom: 25px; }
          .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 25px 0; }
          .stat-item { background: #fff9f5; padding: 15px; text-align: center; border-radius: 6px; border-top: 3px solid #ff6b35; }
          .stat-number { font-size: 24px; font-weight: 700; color: #ff6b35; }
          .stat-label { font-size: 12px; color: #718096; margin-top: 5px; }
          .features { margin: 25px 0; }
          .feature-item { padding: 15px; margin-bottom: 12px; background: #fff9f5; border-left: 4px solid #ff6b35; border-radius: 4px; }
          .feature-item:last-child { margin-bottom: 0; }
          .feature-icon { font-size: 20px; margin-right: 12px; display: inline-block; }
          .feature-text { color: #2d3748; font-size: 14px; line-height: 1.6; display: inline-block; }
          .feature-text strong { color: #1a202c; display: block; margin-bottom: 4px; font-weight: 600; }
          .feature-text span { color: #718096; font-size: 13px; }
          .quickstart { background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 25px 0; }
          .quickstart h3 { color: #1a202c; font-size: 16px; margin-bottom: 15px; }
          .quickstart ol { margin-left: 20px; }
          .quickstart li { color: #4a5568; margin-bottom: 8px; font-size: 14px; line-height: 1.6; }
          .cta-section { text-align: center; margin: 35px 0 30px 0; }
          .cta-button { display: inline-block; padding: 14px 48px; background: #ff6b35; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; transition: all 0.3s ease; }
          .cta-button:hover { background: #e55a2a; transform: scale(1.02); }
          .divider { height: 1px; background: #e2e8f0; margin: 20px 0; }
          .footer { background: #f9f9f9; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #718096; }
          .footer strong { color: #1a202c; }
          
          @media only screen and (max-width: 600px) {
            .wrapper { padding: 10px !important; }
            .container { border-radius: 0 !important; }
            .content { padding: 25px 20px !important; }
            .brand-header { padding: 15px 20px !important; }
            .brand-header h1 { font-size: 20px !important; }
            .stats-grid { grid-template-columns: 1fr !important; gap: 10px !important; }
            .stat-item { padding: 12px !important; }
            .greeting { font-size: 16px !important; }
            .intro { font-size: 14px !important; }
            .feature-item { padding: 12px !important; margin-bottom: 10px !important; }
            .feature-text { font-size: 13px !important; }
            .quickstart { padding: 15px !important; }
            .quickstart h3 { font-size: 14px !important; }
            .quickstart li { font-size: 13px !important; }
            .cta-button { padding: 12px 40px !important; font-size: 14px !important; }
            .footer { padding: 20px !important; font-size: 11px !important; }
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <img src="${getImageBase64()}" alt="QuickEats" class="hero-image">
            
            <div class="brand-header">
              <h1>📊 QuickEats Business</h1>
            </div>
            
            <div class="content">
              <p class="greeting">Hello <strong>${name}</strong>,</p>
              
              <p class="intro">Welcome to QuickEats Business! Your restaurant is now ready to reach thousands of hungry customers. Manage your menu, track orders, and grow your business - all from one dashboard.</p>
              
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-number">10K+</div>
                  <div class="stat-label">Active Users</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">500+</div>
                  <div class="stat-label">Partner Restaurants</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">50K+</div>
                  <div class="stat-label">Monthly Orders</div>
                </div>
              </div>
              
              <div class="features">
                <div class="feature-item">
                  <span class="feature-icon">📊</span>
                  <div class="feature-text">
                    <strong>Real-time Analytics</strong>
                    <span>Track orders, sales, and customer insights</span>
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">🍽️</span>
                  <div class="feature-text">
                    <strong>Menu Management</strong>
                    <span>Easily update items, prices, and categories</span>
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">🔔</span>
                  <div class="feature-text">
                    <strong>Instant Notifications</strong>
                    <span>Never miss an order or customer message</span>
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">💰</span>
                  <div class="feature-text">
                    <strong>Revenue Insights</strong>
                    <span>Detailed reports to optimize your business</span>
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">⭐</span>
                  <div class="feature-text">
                    <strong>Customer Feedback</strong>
                    <span>Read reviews and build your reputation</span>
                  </div>
                </div>
              </div>
              
              <div class="quickstart">
                <h3>🚀 Quick Start Guide:</h3>
                <ol>
                  <li><strong>Add Your Menu Items</strong> - Upload all dishes with descriptions and prices</li>
                  <li><strong>Set Delivery Options</strong> - Configure your delivery areas and timings</li>
                  <li><strong>Customize Settings</strong> - Add your restaurant photos and details</li>
                  <li><strong>Go Live</strong> - Start accepting orders from customers</li>
                </ol>
              </div>
              
              <div class="cta-section">
                <a href="http://localhost:5173/owner" class="cta-button">Go to Dashboard</a>
              </div>
              
              <div class="divider"></div>
              
              <p class="intro" style="margin-bottom: 0; font-size: 13px; color: #718096;">Need help setting up? Our business team is here to assist you every step of the way.</p>
            </div>
            
            <div class="footer">
              <p><strong>QuickEats Business</strong> - Grow Your Restaurant, Reach More Customers</p>
              <p style="margin-top: 10px; font-size: 11px;">This email was sent because you registered as a restaurant partner. Contact us at business@foodswift.com for support.</p></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  delivery_boy: (name) => ({
    subject: 'Welcome to QuickEats Delivery - Start Earning Today',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; line-height: 1.6; }
          .wrapper { width: 100%; background: #f5f5f5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .hero-image { width: 100% !important; height: auto !important; display: block !important; max-width: 600px !important; border-radius: 8px 8px 0 0; }
          .brand-header { background: #ff6b35; padding: 20px 30px; text-align: center; color: white; }
          .brand-header h1 { font-size: 24px; font-weight: 700; margin: 0; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 18px; color: #1a202c; margin-bottom: 10px; font-weight: 600; }
          .greeting strong { color: #ff6b35; }
          .intro { font-size: 15px; color: #4a5568; line-height: 1.8; margin-bottom: 25px; }
          .earning-banner { background: linear-gradient(135deg, #fff9f5 0%, #ffe8df 100%); border-left: 4px solid #ff6b35; padding: 25px; border-radius: 6px; text-align: center; margin: 25px 0; }
          .earning-amount { font-size: 32px; font-weight: 700; color: #ff6b35; }
          .earning-label { font-size: 14px; color: #718096; margin-top: 5px; }
          .features { margin: 25px 0; }
          .feature-item { padding: 15px; margin-bottom: 12px; background: #fff9f5; border-left: 4px solid #ff6b35; border-radius: 4px; transition: all 0.3s ease; }
          .feature-item:last-child { margin-bottom: 0; }
          .feature-icon { font-size: 20px; margin-right: 12px; display: inline-block; }
          .feature-text { color: #2d3748; font-size: 14px; line-height: 1.6; display: inline-block; }
          .feature-text strong { color: #1a202c; display: block; margin-bottom: 4px; font-weight: 600; }
          .feature-text span { color: #718096; font-size: 13px; }
          .tips-box { background: #f9f9f9; border-left: 4px solid #ff6b35; padding: 20px; border-radius: 6px; margin: 25px 0; }
          .tips-box h3 { color: #ff6b35; margin-bottom: 15px; font-size: 16px; }
          .tips-box .tip { color: #4a5568; margin-bottom: 8px; padding-left: 25px; position: relative; font-size: 14px; }
          .tips-box .tip:before { content: "💡"; position: absolute; left: 0; }
          .cta-section { text-align: center; margin: 35px 0 30px 0; }
          .cta-button { display: inline-block; padding: 14px 48px; background: #ff6b35; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; transition: all 0.3s ease; }
          .cta-button:hover { background: #e55a2a; transform: scale(1.02); }
          .divider { height: 1px; background: #e2e8f0; margin: 20px 0; }
          .footer { background: #f9f9f9; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #718096; }
          .footer strong { color: #1a202c; }
          
          @media only screen and (max-width: 600px) {
            .wrapper { padding: 10px !important; }
            .container { border-radius: 0 !important; }
            .content { padding: 25px 20px !important; }
            .brand-header { padding: 15px 20px !important; }
            .brand-header h1 { font-size: 20px !important; }
            .greeting { font-size: 16px !important; }
            .intro { font-size: 14px !important; margin-bottom: 20px !important; }
            .earning-banner { padding: 20px !important; }
            .earning-amount { font-size: 28px !important; }
            .feature-item { padding: 12px !important; margin-bottom: 10px !important; }
            .feature-icon { font-size: 18px !important; }
            .feature-text { font-size: 13px !important; }
            .tips-box { padding: 15px !important; }
            .tips-box h3 { font-size: 14px !important; }
            .tips-box .tip { font-size: 13px !important; }
            .cta-button { padding: 12px 40px !important; font-size: 14px !important; }
            .footer { padding: 20px !important; font-size: 11px !important; }
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <img src="${getImageBase64()}" alt="QuickEats" class="hero-image">
            
            <div class="brand-header">
              <h1>🚗 QuickEats Delivery</h1>
            </div>
            
            <div class="content">
              <p class="greeting">Hello <strong>${name}</strong>,</p>
              
              <p class="intro">Welcome to the QuickEats delivery family! You're now part of our trusted delivery network. Start accepting orders and begin earning money right away.</p>
              
              <div class="earning-banner">
                <div class="earning-amount">₹500 - ₹2000/day</div>
                <div class="earning-label">Average Earning Potential</div>
              </div>
              
              <div class="features">
                <div class="feature-item">
                  <span class="feature-icon">💰</span>
                  <div class="feature-text">
                    <strong>Instant Earnings</strong>
                    <span>Get paid for every successful delivery</span>
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">⏰</span>
                  <div class="feature-text">
                    <strong>Flexible Schedule</strong>
                    <span>Work whenever you want, wherever you want</span>
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">📱</span>
                  <div class="feature-text">
                    <strong>Live Tracking</strong>
                    <span>Real-time navigation and order management</span>
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">🎁</span>
                  <div class="feature-text">
                    <strong>Weekly Bonuses</strong>
                    <span>Extra rewards for top performers</span>
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">📊</span>
                  <div class="feature-text">
                    <strong>Earnings Dashboard</strong>
                    <span>Track your income and delivery stats</span>
                  </div>
                </div>
              </div>
              
              <div class="tips-box">
                <h3>💡 Tips to Maximize Your Earnings:</h3>
                <div class="tip">Work during peak hours (12-2 PM & 7-10 PM)</div>
                <div class="tip">Accept multiple orders in the same area</div>
                <div class="tip">Maintain high ratings for priority orders</div>
                <div class="tip">Keep your app online to never miss opportunities</div>
              </div>
              
              <div class="cta-section">
                <a href="http://localhost:5173/delivery" class="cta-button">Start Delivering Now</a>
              </div>
              
              <div class="divider"></div>
              
              <p class="intro" style="margin-bottom: 0; font-size: 13px; color: #718096;">Questions about getting started? Our support team is available 24/7 to help.</p>
            </div>
            
            <div class="footer">
              <p><strong>QuickEats Delivery</strong> - Your Path to Financial Freedom</p>
              <p style="margin-top: 10px; font-size: 11px;">This email was sent because you registered as a delivery partner. Contact us at delivery@foodswift.com for support.</p></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Send welcome email
const sendWelcomeEmail = async (email, name, role) => {
  try {
    const template = welcomeTemplates[role](name);

    const mailOptions = {
      from: '"QuickEats Team 🍔" <sonidishansh359@gmail.com>',
      to: email,
      subject: template.subject,
      html: template.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email} (${role}):`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error.message);
    return { success: false, error: error.message };
  }
};

// Send OTP email for password reset
const sendOTPEmail = async (email, name, otp, role) => {
  try {
    const roleNames = {
      user: 'Customer',
      owner: 'Restaurant Owner',
      delivery_boy: 'Delivery Partner'
    };

    const mailOptions = {
      from: '"QuickEats Security 🔐" <sonidishansh359@gmail.com>',
      to: email,
      subject: 'Your Password Reset Code - QuickEats',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 500px; margin: 20px auto; background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #ddd; }
            h2 { color: #333; text-align: center; margin-bottom: 20px; }
            .message { font-size: 15px; color: #555; margin-bottom: 20px; }
            .otp-section { background: white; padding: 20px; border-radius: 6px; border: 2px solid #ff6b35; text-align: center; margin: 20px 0; }
            .otp-label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
            .otp-code { font-size: 48px; font-weight: bold; color: #ff6b35; font-family: monospace; letter-spacing: 8px; margin: 10px 0; }
            .otp-expire { font-size: 12px; color: #ff6b35; margin-top: 10px; }
            .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; font-size: 14px; color: #856404; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 15px; }
            .support { font-size: 14px; color: #666; margin-top: 15px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>🔐 Password Reset Code</h2>
            
            <p class="message">Hi <strong>${name}</strong>,</p>
            
            <p class="message">You requested to reset your QuickEats password. Use this code to reset it:</p>
            
            <div class="otp-section">
              <div class="otp-label">Your Code</div>
              <div class="otp-code">${otp}</div>
              <div class="otp-expire">Valid for 10 minutes only</div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Security Alert:</strong><br>
              • Never share this code with anyone<br>
              • QuickEats will never ask for this code<br>
              • If you didn't request this, ignore this email
            </div>
            
            <p class="message">Enter this code in the QuickEats app to set a new password.</p>
            
            <div class="support">
              Need help? Contact us at support@foodswift.com
            </div>
            
            <div class="footer">
              <p>This is an automated security email. Please do not reply.</p>
              <p>QuickEats Security Team</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message);
    return { success: false, error: error.message };
  }
};

// Send Delivery Confirmation OTP
const sendDeliveryOTPEmail = async (email, customerName, otp, orderId, restaurantName) => {
  try {
    const mailOptions = {
      from: 'sonidishansh359@gmail.com',
      to: email,
      subject: `🍕 Your QuickEats Delivery OTP - Order #${orderId.slice(-6)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; line-height: 1.6; }
            .wrapper { width: 100%; background: #f5f5f5; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .brand-header { background: linear-gradient(135deg, #ff6b35 0%, #ff8a50 100%); padding: 20px 30px; text-align: center; color: white; }
            .brand-header h1 { font-size: 24px; font-weight: 700; margin: 0; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 18px; color: #1a202c; margin-bottom: 20px; font-weight: 600; }
            .otp-container { background: linear-gradient(135deg, #ff6b35 0%, #ff8a50 100%); padding: 30px; border-radius: 8px; text-align: center; margin: 30px 0; }
            .otp-label { font-size: 12px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; }
            .otp-code { font-size: 42px; font-weight: 800; color: white; letter-spacing: 5px; font-family: 'Courier New', monospace; }
            .otp-expiry { font-size: 13px; color: rgba(255,255,255,0.9); margin-top: 15px; }
            .info-block { background: #f0f9ff; padding: 15px; border-left: 4px solid #ff6b35; margin: 20px 0; border-radius: 4px; }
            .info-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
            .info-value { font-size: 16px; color: #1a202c; font-weight: 600; margin-top: 5px; }
            .instruction { font-size: 15px; color: #4a5568; line-height: 1.8; margin: 20px 0; }
            .warning { background: #fff5f5; padding: 15px; border-left: 4px solid #f56565; margin: 20px 0; border-radius: 4px; }
            .warning-text { font-size: 13px; color: #c53030; }
            .footer { text-align: center; padding: 30px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #718096; }
            .footer p { margin: 5px 0; }
            .highlight { color: #ff6b35; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="brand-header">
                <h1>🍕 QuickEats</h1>
              </div>
              
              <div class="content">
                <div class="greeting">
                  Hi <span class="highlight">${customerName}</span>! 👋
                </div>
                
                <div class="instruction">
                  Your delivery partner has arrived with your order from <span class="highlight">${restaurantName}</span>. 
                  Please provide this OTP to confirm the delivery.
                </div>
                
                <div class="otp-container">
                  <div class="otp-label">Your Delivery OTP</div>
                  <div class="otp-code">${otp}</div>
                  <div class="otp-expiry">Valid for 10 minutes only</div>
                </div>
                
                <div class="info-block">
                  <div class="info-label">Order ID</div>
                  <div class="info-value">#${orderId.slice(-6)}</div>
                </div>
                
                <div class="instruction">
                  <strong>How to use this OTP:</strong><br>
                  1. Share this OTP with your delivery partner<br>
                  2. They will enter it in their app to confirm delivery<br>
                  3. Your order will be marked as delivered
                </div>
                
                <div class="warning">
                  <div class="warning-text">
                    <strong>⚠️ Security Note:</strong> Never share this OTP with anyone else. Your delivery partner will ask for it to verify the delivery.
                  </div>
                </div>
                
                <div class="instruction" style="font-size: 13px; color: #718096;">
                  If this OTP expires, your delivery partner can request a new one.
                </div>
              </div>
              
              <div class="footer">
                <p>This is an automated delivery confirmation email. Please do not reply.</p>
                <p>QuickEats Delivery Team</p>
                <p>© 2026 QuickEats. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Delivery OTP email sent to ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending delivery OTP email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendWelcomeEmail, sendOTPEmail, sendDeliveryOTPEmail };

// Send recovery request to admin for approval
const sendRecoveryRequestToAdmin = async (adminEmail, userEmail, userName, token) => {
  try {
    const os = require('os');
    const host = process.env.PUBLIC_HOST || null;

    // find a LAN IPv4 address (e.g., 192.168.x.x) to allow mobile devices on same network to reach the server
    const nets = os.networkInterfaces();
    let lanIp = null;
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4
        if (net.family === 'IPv4' && !net.internal) {
          lanIp = net.address;
          break;
        }
      }
      if (lanIp) break;
    }

    const fallbackHost = host || (lanIp ? `http://${lanIp}:5000` : 'http://127.0.0.1:5000');
    const approveUrl = `${fallbackHost}/api/users/recover-approve?token=${token}`;
    const mailOptions = {
      from: '"QuickEats Admin" <sonidishansh359@gmail.com>',
      to: adminEmail,
      subject: `Account recovery request for ${userEmail}`,
      html: `
        <!doctype html>
        <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <div style="max-width:600px;margin:0 auto;padding:20px;background:#f9f9f9;border-radius:8px;">
            <h3>Account recovery request</h3>
            <p>User <strong>${userName}</strong> (<em>${userEmail}</em>) has requested account recovery.</p>
            <p style="margin:18px 0;">
              <a href="${approveUrl}" style="display:inline-block;padding:12px 20px;background:#1d72b8;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Approve Recovery</a>
            </p>
            <p>If the above button doesn't work from mobile, open one of these links in the admin device's browser:</p>
            <ul>
              <li>Main: <a href="${approveUrl}">${approveUrl}</a></li>
              ${host ? '' : (lanIp ? `<li>LAN (mobile): <a href="http://${lanIp}:5000/api/users/recover-approve?token=${token}">http://${lanIp}:5000/api/users/recover-approve?token=${token}</a></li>` : '')}
            </ul>
            <hr />
            <p style="font-size:12px;color:#666;">If you don't recognize this request, ignore this email.</p>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Recovery request email sent to admin ${adminEmail}:`, info.messageId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending recovery request email:', error.message);
    return { success: false, error: error.message };
  }
};

// Notify user that recovery was approved
const sendRecoveryApprovedToUser = async (email, name) => {
  try {
    const mailOptions = {
      from: '"QuickEats Team" <sonidishansh359@gmail.com>',
      to: email,
      subject: 'Your QuickEats account has been restored',
      html: `
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your account has been restored by the administrator. You can now login using your previous credentials.</p>
        <p>If you did not request this, please contact support immediately.</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Recovery approved email sent to ${email}:`, info.messageId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending recovery approved email:', error.message);
    return { success: false, error: error.message };
  }
};

// Send Order Receipt Email
const sendOrderReceiptEmail = async (email, userName, order, items) => {
  try {
    const formattedDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const itemsHtml = items.map(item => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px 0;">
          <div style="font-weight: 600; color: #2d3748;">${item.name || (item.menuItem && item.menuItem.name) || 'Item'}</div>
          <div style="font-size: 12px; color: #718096;">Qty: ${item.quantity}</div>
        </td>
        <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #2d3748;">
          ₹${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `).join('');

    const paymentMethodLabel = order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment';
    const paymentStatusColor = order.paymentStatus === 'paid' ? '#48bb78' : '#ed8936';
    const paymentStatusLabel = order.paymentStatus === 'paid' ? 'PAID' : 'PENDING';

    const mailOptions = {
      from: '"QuickEats Orders 🧾" <sonidishansh359@gmail.com>',
      to: email,
      subject: `Order Receipt #${order._id.toString().slice(-6)} - QuickEats`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #2d3748; background-color: #f7fafc; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); margin-top: 20px; margin-bottom: 20px;">
            
            <!-- Header -->
            <div style="background-color: #ff6b35; padding: 30px 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800;">QuickEats</h1>
              <p style="margin: 5px 0 0; opacity: 0.9;">Order Receipt</p>
            </div>

            <!-- Order Info -->
            <div style="padding: 30px 20px; border-bottom: 1px solid #edf2f7;">
              <div style="font-size: 14px; color: #718096; margin-bottom: 5px;">Hello ${userName},</div>
              <h2 style="margin: 0 0 15px; font-size: 20px; color: #1a202c;">Thank you for your order!</h2>
              <p style="margin: 0; color: #718096; font-size: 14px;">
                Your order ID is <strong style="color: #2d3748;">#${order._id.toString().slice(-6)}</strong>
              </p>
              <p style="margin: 5px 0 0; color: #718096; font-size: 14px;">
                Placed on ${formattedDate}
              </p>
            </div>

            <!-- Items -->
            <div style="padding: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #edf2f7;">
                    <th style="text-align: left; padding-bottom: 10px; color: #718096; font-size: 12px; text-transform: uppercase;">Item</th>
                    <th style="text-align: right; padding-bottom: 10px; color: #718096; font-size: 12px; text-transform: uppercase;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </div>

            <!-- Totals & Payment -->
            <div style="background-color: #f8fafc; padding: 20px; border-top: 1px solid #edf2f7;">
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 5px 0; color: #718096;">Subtotal</td>
                  <td style="padding: 5px 0; text-align: right; font-weight: 600;">₹${(order.subtotal || order.totalAmount).toFixed(2)}</td>
                </tr>
                ${order.taxAmount && order.taxAmount > 0 ? `
                <tr>
                  <td style="padding: 5px 0; color: #718096;">GST & Handling</td>
                  <td style="padding: 5px 0; text-align: right; font-weight: 600;">₹${order.taxAmount.toFixed(2)}</td>
                </tr>
                ` : ''}
                ${order.discountAmount > 0 ? `
                <tr>
                  <td style="padding: 5px 0; color: #38a169;">Promo Discount</td>
                  <td style="padding: 5px 0; text-align: right; color: #38a169; font-weight: 600;">-₹${order.discountAmount.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 5px 0; color: #718096;">Delivery Fee</td>
                  <td style="padding: 5px 0; text-align: right; font-weight: 600;">₹0.00</td>
                </tr>
                <tr style="border-top: 1px solid #e2e8f0;">
                  <td style="padding-top: 15px; font-size: 18px; font-weight: 700; color: #2d3748;">Total</td>
                  <td style="padding-top: 15px; text-align: right; font-size: 18px; font-weight: 700; color: #ff6b35;">₹${order.totalAmount.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <!-- Payment Details Box -->
            <div style="padding: 20px;">
              <div style="background-color: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px;">
                <div style="font-size: 12px; text-transform: uppercase; color: #718096; margin-bottom: 10px; font-weight: 600;">Payment Information</div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="color: #4a5568; font-size: 14px;">Method</span>
                  <span style="color: #2d3748; font-weight: 600; font-size: 14px;">${paymentMethodLabel}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #4a5568; font-size: 14px;">Status</span>
                  <span style="background-color: ${paymentStatusColor}20; color: ${paymentStatusColor}; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 700;">${paymentStatusLabel}</span>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding: 20px; font-size: 12px; color: #a0aec0; background-color: #fff;">
              <p style="margin-bottom: 10px;">If you have any questions, reply to this email or contact support@quickeats.com</p>
              <p>&copy; ${new Date().getFullYear()} QuickEats. All rights reserved.</p>
            </div>

          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Order receipt email sent to ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending order receipt email:', error.message);
    return { success: false, error: error.message };
  }
};

// Send Order Cancelled Email
const sendOrderCancelledEmail = async (email, userName, order, refundAmount, reason) => {
  try {
    const formattedDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    
    const mailOptions = {
      from: '"QuickEats Support 🚨" <sonidishansh359@gmail.com>',
      to: email,
      subject: `Order Cancelled #${order._id.toString().slice(-6)} - QuickEats`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #e53e3e; text-align: center;">Order Cancelled</h2>
            <p>Hello <strong>${userName}</strong>,</p>
            <p>We are writing to inform you that your order <strong>#${order._id.toString().slice(-6)}</strong> placed on ${formattedDate} has been cancelled by the restaurant.</p>
            ${refundAmount > 0 ? `<p style="color: #38a169; font-weight: bold; padding: 10px; background: #f0fff4; border-radius: 4px;">A refund of ₹${refundAmount.toFixed(2)} has been initiated and should reflect in your account soon.</p>` : ''}
            <p>We apologize for any inconvenience caused. Please feel free to explore other restaurants on QuickEats.</p>
            <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #888;">&copy; ${new Date().getFullYear()} QuickEats. All rights reserved.</p>
          </div>
        </body>
        </html>
      `
    };
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Order cancelled email sent to ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending order cancelled email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendWelcomeEmail, sendOTPEmail, sendDeliveryOTPEmail, sendRecoveryRequestToAdmin, sendRecoveryApprovedToUser, sendOrderReceiptEmail, sendOrderCancelledEmail };
