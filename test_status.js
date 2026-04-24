
const timeStringToMinutes = (timeStr) => {
    if (!timeStr) return -1;
    const regex = /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i;
    const match = timeStr.trim().match(regex);
    if (!match) return -1;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const modifier = match[3] ? match[3].toUpperCase() : null;
    if (hours > 12 || !modifier) return hours * 60 + minutes;
    if (hours === 12) hours = modifier === 'AM' ? 0 : 12;
    else if (modifier === 'PM') hours += 12;
    return hours * 60 + minutes;
};

const getStatus = (openStr, closeStr, nowStr) => {
    const open = timeStringToMinutes(openStr);
    const close = timeStringToMinutes(closeStr);
    const now = timeStringToMinutes(nowStr); // Simulating nowMins passing string

    console.log(`Open: ${openStr} (${open}), Close: ${closeStr} (${close}), Now: ${nowStr} (${now})`);

    if (open === -1 || close === -1) return 'CLOSED (Invalid)';

    let isOpen = false;
    if (open < close) {
        isOpen = now >= open && now < close;
    } else if (open > close) {
        isOpen = now >= open || now < close;
    } else {
        return 'CLOSED (Equal)';
    }

    if (isOpen) {
        // Check closing soon logic (simplified)
        // ... assuming not relevant for "10 to 10" mismatch causing CLOSED
        return 'OPEN';
    } else {
        return 'CLOSED';
    }
}

// Test cases
console.log("Test 1 (10:00 to 22:00, now 10:40):", getStatus("10:00", "22:00", "10:40"));
console.log("Test 2 (10:00 to 10:00, now 10:40):", getStatus("10:00", "10:00", "10:40"));
console.log("Test 3 (10:00 AM to 10:00 PM, now 10:40 AM):", getStatus("10:00 AM", "10:00 PM", "10:40 AM"));
