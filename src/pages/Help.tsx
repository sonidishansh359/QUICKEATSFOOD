import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Phone,
  Mail,
  MessageCircle,
  ChevronDown,
  ShoppingBag,
  CreditCard,
  Truck,
  User,
  RefreshCw,
  Shield,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

const categories = [
  {
    id: 1,
    title: "Orders",
    icon: ShoppingBag,
    description: "Track, modify, or cancel orders",
  },
  {
    id: 2,
    title: "Payments",
    icon: CreditCard,
    description: "Payment methods and refunds",
  },
  {
    id: 3,
    title: "Delivery",
    icon: Truck,
    description: "Delivery status and issues",
  },
  {
    id: 4,
    title: "Account",
    icon: User,
    description: "Profile and settings",
  },
  {
    id: 5,
    title: "Refunds",
    icon: RefreshCw,
    description: "Refund policies and status",
  },
  {
    id: 6,
    title: "Safety",
    icon: Shield,
    description: "Food safety and hygiene",
  },
];

const faqs = [
  {
    question: "How do I track my order?",
    answer:
      "Once your order is confirmed, you can track it in real-time from the 'My Orders' section. You'll receive notifications at each stage - when the restaurant accepts, when it's being prepared, when the rider picks it up, and when it's about to arrive.",
  },
  {
    question: "Can I cancel my order?",
    answer:
      "You can cancel your order before the restaurant starts preparing it. Go to 'My Orders', select the order, and tap 'Cancel Order'. If the restaurant has already started preparing, cancellation may not be possible, but you can contact support for assistance.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards (Visa, Mastercard, American Express), digital wallets (Apple Pay, Google Pay), and cash on delivery in select areas. You can also use QuickEats credits or promo codes for discounts",
  },
  {
    question: "How do I apply a promo code?",
    answer:
      "During checkout, you'll see a 'Promo Code' field. Enter your code and tap 'Apply'. The discount will be reflected in your order total. Note that some codes have minimum order requirements or are valid only for specific restaurants.",
  },
  {
    question: "What if my order is late?",
    answer:
      "If your order is significantly delayed beyond the estimated time, you may be eligible for a delivery fee refund or credits. Contact our support team through the app, and we'll assist you promptly.",
  },
  {
    question: "How do refunds work?",
    answer:
      "Refunds for cancelled orders or issues are processed within 5-7 business days to your original payment method. For faster resolution, you can opt to receive QuickEats credits which are applied instantly.",
  },
];

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <>
      <Helmet>
        <title>Help Center | QuickEats</title>
        <meta
          name="description"
          content="Get help with your QuickEats orders. Find answers to common questions, contact support, and resolve issues quickly."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 lg:pt-24">
          {/* Hero Section */}
          <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/30 py-12 lg:py-20">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-2xl mx-auto"
              >
                <h1 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
                  How can we help you?
                </h1>
                <p className="text-lg text-muted-foreground mb-8">
                  Search for answers or browse our help topics
                </p>
                <div className="relative max-w-xl mx-auto">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search for help..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 bg-card border border-border rounded-2xl text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </motion.div>
            </div>
          </section>

          {/* Help Categories */}
          <section className="py-12 lg:py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
                Browse by Topic
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {categories.map((category, index) => (
                  <motion.button
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                    className="flex flex-col items-center p-6 bg-card border border-border rounded-2xl hover:border-primary/30 hover:shadow-lg transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                      <category.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground text-sm mb-1">
                      {category.title}
                    </h3>
                    <p className="text-xs text-muted-foreground text-center">
                      {category.description}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-12 lg:py-16 bg-secondary/30">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
                Frequently Asked Questions
              </h2>
              <div className="max-w-3xl mx-auto space-y-4">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card border border-border rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedFaq(expandedFaq === index ? null : index)
                      }
                      className="w-full flex items-center justify-between p-5 text-left"
                    >
                      <span className="font-medium text-foreground">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-muted-foreground transition-transform ${
                          expandedFaq === index ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {expandedFaq === index && (
                      <div className="px-5 pb-5">
                        <p className="text-muted-foreground">{faq.answer}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="py-12 lg:py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
                Still Need Help?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center p-6 bg-card border border-border rounded-2xl text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <MessageCircle className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Live Chat
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Chat with our support team 24/7
                  </p>
                  <Button variant="outline" className="w-full">
                    Start Chat
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-col items-center p-6 bg-card border border-border rounded-2xl text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mb-4">
                    <Phone className="w-6 h-6 text-success" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Call Us
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Available 9 AM - 11 PM daily
                  </p>
                  <Button variant="outline" className="w-full">
                    1-800-FOOD-SWIFT
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center p-6 bg-card border border-border rounded-2xl text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Email Us
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    We'll respond within 24 hours
                  </p>
                  <Button variant="outline" className="w-full">
                    Send Email
                  </Button>
                </motion.div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Help;
