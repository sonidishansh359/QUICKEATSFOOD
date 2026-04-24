/**
 * Location Validation Middleware
 * Validates geographic coordinates and location data
 * Used for all location-based operations
 */

const { validationResult } = require('express-validator');
const { body } = require('express-validator');

/**
 * Configuration for location validation
 */
const LOCATION_CONFIG = {
  MAX_LATITUDE: 90,
  MIN_LATITUDE: -90,
  MAX_LONGITUDE: 180,
  MIN_LONGITUDE: -180,
  DEFAULT_RADIUS_KM: 5, // Default search radius in kilometers
  MAX_RADIUS_KM: 50, // Maximum allowed radius
  MIN_RADIUS_KM: 0.1 // Minimum allowed radius
};

/**
 * Validate latitude
 * @param {number} latitude
 * @returns {boolean}
 */
const isValidLatitude = (latitude) => {
  const lat = parseFloat(latitude);
  return !isNaN(lat) && lat >= LOCATION_CONFIG.MIN_LATITUDE && lat <= LOCATION_CONFIG.MAX_LATITUDE;
};

/**
 * Validate longitude
 * @param {number} longitude
 * @returns {boolean}
 */
const isValidLongitude = (longitude) => {
  const lng = parseFloat(longitude);
  return !isNaN(lng) && lng >= LOCATION_CONFIG.MIN_LONGITUDE && lng <= LOCATION_CONFIG.MAX_LONGITUDE;
};

/**
 * Validate coordinates array [longitude, latitude]
 * @param {array} coordinates
 * @returns {boolean}
 */
const isValidCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return false;
  }
  const [lng, lat] = coordinates;
  return isValidLongitude(lng) && isValidLatitude(lat);
};

/**
 * Validate radius in kilometers
 * @param {number} radius
 * @returns {boolean}
 */
const isValidRadius = (radius) => {
  const r = parseFloat(radius);
  return !isNaN(r) && r >= LOCATION_CONFIG.MIN_RADIUS_KM && r <= LOCATION_CONFIG.MAX_RADIUS_KM;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {array} coord1 - [longitude, latitude]
 * @param {array} coord2 - [longitude, latitude]
 * @returns {number} - Distance in kilometers
 */
const calculateDistance = (coord1, coord2) => {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;

  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ Location validation error:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Location validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Validation rules for updating user location
 */
const validateLocationUpdate = [
  body('latitude')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('address')
    .optional()
    .isString().withMessage('Address must be a string')
    .trim(),
  handleValidationErrors
];

/**
 * Validation rules for nearby restaurants query
 */
const validateNearbyQuery = [
  body('latitude')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('radius')
    .optional()
    .isFloat({ min: 0.1, max: 50 }).withMessage('Radius must be between 0.1 and 50 km'),
  handleValidationErrors
];

/**
 * Validation rules for delivery boy location
 */
const validateDeliveryBoyLocation = [
  body('latitude')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('address')
    .optional()
    .isString().withMessage('Address must be a string')
    .trim(),
  handleValidationErrors
];

/**
 * Format location response
 * @param {object} location - Mongoose location object
 * @returns {object} - Formatted location
 */
const formatLocationResponse = (location) => {
  if (!location || !location.coordinates) {
    return {
      latitude: 0,
      longitude: 0,
      coordinates: [0, 0]
    };
  }

  const [longitude, latitude] = location.coordinates;
  return {
    latitude,
    longitude,
    coordinates: location.coordinates,
    type: location.type || 'Point'
  };
};

/**
 * Sanitize location data before saving
 * @param {object} locationData - Raw location data
 * @returns {object} - Sanitized location
 */
const sanitizeLocation = (locationData) => {
  if (!locationData || (!locationData.latitude && !locationData.coordinates)) {
    return {
      type: 'Point',
      coordinates: [0, 0]
    };
  }

  let lat, lng;

  if (locationData.coordinates) {
    [lng, lat] = locationData.coordinates;
  } else {
    lat = parseFloat(locationData.latitude);
    lng = parseFloat(locationData.longitude);
  }

  // Validate after parsing
  if (!isValidLatitude(lat) || !isValidLongitude(lng)) {
    console.warn('⚠️ Invalid coordinates provided:', { lat, lng });
    return {
      type: 'Point',
      coordinates: [0, 0]
    };
  }

  return {
    type: 'Point',
    coordinates: [lng, lat] // MongoDB GeoJSON format: [longitude, latitude]
  };
};

module.exports = {
  LOCATION_CONFIG,
  isValidLatitude,
  isValidLongitude,
  isValidCoordinates,
  isValidRadius,
  calculateDistance,
  validateLocationUpdate,
  validateNearbyQuery,
  validateDeliveryBoyLocation,
  formatLocationResponse,
  sanitizeLocation,
  handleValidationErrors
};
