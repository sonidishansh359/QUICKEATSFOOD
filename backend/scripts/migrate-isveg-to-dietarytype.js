require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');

async function migrate() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/restaurant');
        console.log('Connected.');

        const items = await MenuItem.find({ dietaryType: { $exists: false } }).lean();
        console.log(`Found ${items.length} items missing dietaryType.`);

        let updatedCount = 0;
        for (const item of items) {
            // Check if isVeg is present on the raw doc, default to Veg if missing
            const isVeg = item.isVeg !== undefined ? item.isVeg : true;
            const dietaryType = isVeg ? 'Veg' : 'NonVeg';

            await MenuItem.findByIdAndUpdate(item._id, { dietaryType });
            updatedCount++;
        }

        const result = await MenuItem.updateMany(
            { isVeg: { $exists: true } },
            { $unset: { isVeg: "" } }
        );

        console.log(`Migrated ${updatedCount} items to dietaryType. Removed isVeg from ${result.modifiedCount} items.`);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
