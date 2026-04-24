// OTP Generation and Verification Utility

/**
 * Generate a random 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate OTP expiry time (10 minutes from now)
 */
const getOTPExpiry = () => {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
};

/**
 * Check if OTP is still valid
 */
const isOTPValid = (expiryTime) => {
  return new Date() <= new Date(expiryTime);
};

module.exports = {
  generateOTP,
  getOTPExpiry,
  isOTPValid
};
