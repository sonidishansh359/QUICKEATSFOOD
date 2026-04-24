import { io } from 'socket.io-client';

const run = async () => {
    try {
        const SOCKET_URL = 'http://localhost:5000';
        const socket = io(SOCKET_URL);

        console.log('Connecting to socket...');

        socket.on('connect', () => {
            console.log('✅ Connected to socket server');

            const testOrderId = 'test_order_123';
            const testDeliveryBoyId = 'delivery_boy_test_id';
            const testLat = 28.6139;
            const testLng = 77.2090;

            // 2. Join Order Room (as a user would)
            // We need two sockets ideally, but let's try to just listen on the same one for simplicity
            // server emits to room_orderId. If we join it, we should get it.
            socket.emit('subscribeToLiveTracking', { orderId: testOrderId });

            // 3. Emit Location Update (as a delivery boy would)
            setTimeout(() => {
                console.log('🚀 Emitting location update...');
                socket.emit('updateLocation', {
                    orderId: testOrderId,
                    userId: testDeliveryBoyId,
                    latitude: testLat,
                    longitude: testLng,
                    accuracy: 10,
                    timestamp: Date.now()
                });
            }, 1000); // Wait a bit for subscription to activate

            // 4. Listen for the broadcast
            const timeout = setTimeout(() => {
                console.error('❌ Timeout: Did not receive updateDeliveryLocation event.');
                socket.disconnect();
                process.exit(1);
            }, 5000);

            socket.on('updateDeliveryLocation', (data) => {
                console.log('📩 Received updateDeliveryLocation:', data);

                // Allow slight floating point differences
                if (data.orderId === testOrderId && Math.abs(data.latitude - testLat) < 0.0001 && Math.abs(data.longitude - testLng) < 0.0001) {
                    console.log('✅ VERIFICATION SUCCESS: Location broadcasted correctly.');
                    clearTimeout(timeout);
                    socket.disconnect();
                    process.exit(0);
                } else {
                    console.log('⚠️ Received data for different event or mismatch:', data);
                }
            });
        });

        socket.on('connect_error', (err) => {
            console.error('❌ Connection Error:', err.message);
            process.exit(1);
        });
    } catch (error) {
        console.error('❌ Script Error:', error);
        process.exit(1);
    }
};

run();
