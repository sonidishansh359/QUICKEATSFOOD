const axios = require('axios');

const debugApi = async () => {
    try {
        const API_BASE = 'http://localhost:5000/api';

        // 1. Register a temporary user
        const randomStr = Math.random().toString(36).substring(7);
        const userPayload = {
            name: `Debug User ${randomStr}`,
            email: `debug_${randomStr}@test.com`,
            password: 'password123',
            role: 'user'
        };

        console.log(`Registering user: ${userPayload.email}`);

        let token;
        try {
            const regResponse = await axios.post(`${API_BASE}/auth/register`, userPayload);
            token = regResponse.data.token;
            console.log('Registration successful, token received.');
        } catch (err) {
            console.error('Registration failed:', err.message);
            if (err.response) console.error(err.response.data);
            return;
        }

        if (!token) {
            console.error('No token obtained. Exiting.');
            return;
        }

        // 2. Make API call to nearby-restaurants
        const apiUrl = `${API_BASE}/locations/nearby-restaurants`;

        const body = {
            latitude: 23.0,
            longitude: 72.5,
            radius: 50, // 50km
            cuisine: 'Desserts'
        };

        console.log('Sending request to:', apiUrl);
        console.log('Body:', body);

        try {
            const response = await axios.post(apiUrl, body, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Response Status:', response.status);
            console.log('Response Count:', response.data.count);
            console.log('Response Restaurants:');
            if (response.data.restaurants) {
                response.data.restaurants.forEach(r => {
                    console.log(`- ${r.name} (Cuisine: "${r.cuisine}")`);
                });
            } else {
                console.log('No restaurants array in response');
            }

        } catch (apiErr) {
            console.error('API Error:', apiErr.message);
            if (apiErr.response) {
                console.error('Data:', apiErr.response.data);
            }
        }

    } catch (err) {
        console.error('Error:', err);
    }
};

debugApi();
