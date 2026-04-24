export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'agent';
    timestamp: Date;
}

const KNOWLEDGE_BASE = [
    {
        keywords: ['delivery', 'late', 'time', 'long'],
        answer: "Delivery times can vary based on traffic and restaurant preparation time. Standard delivery is usually 30-45 minutes. You can track your order in real-time on the tracking page!"
    },
    {
        keywords: ['payment', 'pay', 'method', 'card', 'cash'],
        answer: "We accept Credit/Debit cards, UPI, and Cash on Delivery (COD). You can choose your preferred method at checkout."
    },
    {
        keywords: ['refund', 'money', 'cancel', 'return'],
        answer: "Refunds are processed to the original payment method within 5-7 business days. If you cancelled an order, the refund should be initiated automatically."
    },
    {
        keywords: ['menu', 'food', 'order', 'restaurant'],
        answer: "You can browse hundreds of restaurants on our home page! Just enter your location to see who delivers to you."
    },
    {
        keywords: ['contact', 'support', 'help', 'call'],
        answer: "You can reach our support team at sonidishansh359@gmail.com or call us at 1-800-QUICKEATS. We're here 24/7!"
    },
    {
        keywords: ['account', 'login', 'password', 'profile'],
        answer: "You can manage your account settings, saved addresses, and change your password from the 'Profile' section."
    },
    {
        keywords: ['discount', 'offer', 'coupon', 'code'],
        answer: "Check out the 'Offers' section in the menu for the latest promo codes and discounts on your favorite restaurants!"
    },
    {
        keywords: ['location', 'address', 'city'],
        answer: "We currently serve over 500 cities! You can change your delivery location from the top bar or your profile."
    },
    {
        keywords: ['hello', 'hi', 'hey', 'start'],
        answer: "Hello there! 👋 I'm your QuickEats assistant. How can I help you today? You can ask me about orders, payments, or account help."
    },
    {
        keywords: ['thank', 'thanks', 'bye', 'goodbye'],
        answer: "You're welcome! Happy eating! 🍔🍕"
    }
];

// ... existing code ...

export const SUGGESTED_QUESTIONS = [
    "How do I pay?",
    "Show me the menu",
    "Contact support",
    "My account",
    "Offers & Discounts"
];

const DEFAULT_ANSWER = "I'm not sure I understand. Could you rephrase that? I can help with orders, payments, delivery tracking, and account info.";

export const processMessage = async (text: string): Promise<string> => {
    // ... existing code ...
    // Simulate network delay for "typing" effect
    const delay = Math.max(500, Math.random() * 1500);
    await new Promise(resolve => setTimeout(resolve, delay));

    const lowerText = text.toLowerCase();

    // Find best matching answer
    const match = KNOWLEDGE_BASE.find(item =>
        item.keywords.some(keyword => lowerText.includes(keyword))
    );

    return match ? match.answer : DEFAULT_ANSWER;
};
