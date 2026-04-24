// --- Restaurant Open/Close Logic Test (IST, AM/PM input) ---

// 1. Convert 12-hour (AM/PM) to 24-hour "HH:mm"
function to24Hour(timeStr, ampm) {
  let [h, m] = timeStr.split(":").map(Number);
  if (ampm.toUpperCase() === 'PM' && h !== 12) h += 12;
  if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// 2. "HH:mm" to minutes since midnight
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

// 3. Get current IST time
function getISTDate() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (5.5 * 60 * 60 * 1000));
}

// 4. Main Logic
function isRestaurantOpen(openTime, closeTime, now = getISTDate()) {
  if (!openTime || !closeTime) return false;
  const open = timeToMinutes(openTime);
  const close = timeToMinutes(closeTime);
  const current = now.getHours() * 60 + now.getMinutes();
  if (open === close) return false; // Closed all day
  if (open < close) {
    return current >= open && current < close;
  }
  // Overnight: open > close (e.g., 18:00–03:00)
  return current >= open || current < close;
}

// --- TEST CASES ---

function testCase(openInput, openAMPM, closeInput, closeAMPM, testHour, testMinute) {
  const openTime = to24Hour(openInput, openAMPM);
  const closeTime = to24Hour(closeInput, closeAMPM);
  const testDate = getISTDate();
  testDate.setHours(testHour, testMinute, 0, 0);
  const status = isRestaurantOpen(openTime, closeTime, testDate);
  console.log(`Open: ${openTime}, Close: ${closeTime}, Test: ${testHour.toString().padStart(2,'0')}:${testMinute.toString().padStart(2,'0')} IST => ${status ? 'OPEN' : 'CLOSED'}`);
}

console.log('--- Same-day (4:00 AM to 2:00 PM) ---');
testCase('4:00', 'AM', '2:00', 'PM', 5, 0);   // 05:00 IST, should be OPEN
testCase('4:00', 'AM', '2:00', 'PM', 14, 0);  // 14:00 IST, should be CLOSED
testCase('4:00', 'AM', '2:00', 'PM', 3, 0);   // 03:00 IST, should be CLOSED

testCase('10:00', 'AM', '10:00', 'PM', 11, 0); // 11:00 IST, should be OPEN
testCase('10:00', 'AM', '10:00', 'PM', 22, 0); // 22:00 IST, should be CLOSED

testCase('6:00', 'PM', '3:00', 'AM', 2, 30);  // Overnight, 02:30 IST, should be OPEN
testCase('6:00', 'PM', '3:00', 'AM', 17, 0);  // 17:00 IST, should be CLOSED
testCase('6:00', 'PM', '3:00', 'AM', 19, 0);  // 19:00 IST, should be OPEN

testCase('12:00', 'AM', '12:00', 'AM', 1, 0); // Closed all day, should be CLOSED

console.log('--- Current IST time test ---');
const now = getISTDate();
const openTime = to24Hour('10:00', 'AM');
const closeTime = to24Hour('10:00', 'PM');
const status = isRestaurantOpen(openTime, closeTime, now);
console.log(`Current IST: ${now.toTimeString().slice(0,5)}, Status: ${status ? 'OPEN' : 'CLOSED'}`);
