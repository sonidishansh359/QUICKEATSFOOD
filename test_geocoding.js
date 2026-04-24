const fetch = require('node-fetch');

const geocodeAddress = async (address) => {
    try {
        const encodedAddress = encodeURIComponent(address);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}`;

        console.log(`Fetching: ${url}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'QuickEats-Delivery-App/1.0'
            }
        });

        const data = await response.json();
        console.log('Result:', JSON.stringify(data, null, 2));

        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
        return null;
    } catch (error) {
        console.error('Error geocoding address:', error);
        return null;
    }
};

geocodeAddress("Laxmi Vilas Rao Palace, Akota Bridge, Alkapuri, Vadodara, Gujarat, 390001, India");
