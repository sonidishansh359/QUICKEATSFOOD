
/**
 * Checks if a restaurant is currently open based on its opening/closing times.
 * @param {Object} restaurant - The restaurant object containing time details
 * @returns {boolean} - True if open, False if closed
 */
const isRestaurantOpen = (restaurant) => {
    if (!restaurant.openingTime || !restaurant.closingTime) {
        // If times are not fully set, fallback to the manual isOpen toggle
        return restaurant.isOpen;
    }

    // Use IST (Indian Standard Time) for comparison
    const now = new Date();
    const options = { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric', hour12: false };
    const formatter = new Intl.DateTimeFormat([], options);
    const [currentHours, currentMinutesVal] = formatter.format(now).split(':').map(Number);
    const currentMinutes = currentHours * 60 + currentMinutesVal;

    // Helper to convert time string (e.g., "10:30", "02:00") + period ("AM", "PM") to minutes from midnight
    const convertToMinutes = (timeStr, period) => {
        if (!timeStr) return 0;
        let [hours, minutes] = timeStr.trim().split(':').map(Number);

        // Handle 24-hour format (hours > 12 OR no period)
        if (hours > 12 || !period) {
            return hours * 60 + minutes;
        }

        // Handle 12-hour format
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0; // Midnight case

        return hours * 60 + minutes;
    };

    const openMinutes = convertToMinutes(restaurant.openingTime, restaurant.openingPeriod);
    const closeMinutes = convertToMinutes(restaurant.closingTime, restaurant.closingPeriod);

    if (closeMinutes < openMinutes) {
        // Case: Crosses midnight (e.g., 6 PM to 2 AM)
        // Open if current time is after open time OR before close time
        return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
    } else {
        // Standard case (e.g., 10 AM to 10 PM)
        return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    }
};

module.exports = { isRestaurantOpen };
