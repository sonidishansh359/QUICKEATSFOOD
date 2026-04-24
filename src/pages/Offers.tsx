import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Tag, Clock, Percent, Gift, Zap, Truck } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

const offers = [
  {
    id: 1,
    title: "50% OFF Your First Order",
    description: "New to QuickEats? Get 50% off on your first order up to ₹20",
    code: "WELCOME50",
    validUntil: "Dec 31, 2024",
    icon: Gift,
    gradient: "from-primary to-primary/60",
  },
  {
    id: 2,
    title: "Free Delivery Weekend",
    description: "Enjoy free delivery on all orders above ₹15 this weekend",
    code: "FREEDEL",
    validUntil: "Every Weekend",
    icon: Truck,
    gradient: "from-success to-success/60",
  },
  {
    id: 3,
    title: "Flash Sale: 30% OFF",
    description: "Order between 2-5 PM and get 30% off on selected restaurants",
    code: "FLASH30",
    validUntil: "Daily 2-5 PM",
    icon: Zap,
    gradient: "from-accent to-accent/60",
  },
  {
    id: 4,
    title: "Buy 1 Get 1 Free",
    description: "Order any pizza and get another one absolutely free",
    code: "BOGO",
    validUntil: "Jan 15, 2025",
    icon: Percent,
    gradient: "from-secondary-foreground to-secondary-foreground/60",
  },
];

const featuredDeals = [
  {
    id: 1,
    restaurant: "Burger Palace",
    deal: "20% OFF on all burgers",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
    validUntil: "Limited Time",
  },
  {
    id: 2,
    restaurant: "Pizza Napoli",
    deal: "Free garlic bread with any pizza",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop&q=80",
    validUntil: "This Week",
  },
  {
    id: 3,
    restaurant: "Tokyo Sushi House",
    deal: "15% OFF on orders above ₹30",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=80",
    validUntil: "Ongoing",
  },
];

const Offers = () => {
  return (
    <>
      <Helmet>
        <title>Special Offers & Deals | QuickEats</title>
        <meta
          name="description"
          content="Discover exclusive offers, promo codes, and deals on your favorite food. Save big on every order with QuickEats."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 lg:pt-24">
          {/* Hero Section */}
          <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-12 lg:py-16">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-2xl mx-auto"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
                  <Tag className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Exclusive Deals
                  </span>
                </div>
                <h1 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
                  Amazing Offers Just For You
                </h1>
                <p className="text-lg text-muted-foreground">
                  Save more on every order with our exclusive promo codes and
                  restaurant deals
                </p>
              </motion.div>
            </div>
          </section>

          {/* Promo Codes */}
          <section className="py-12 lg:py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-foreground mb-8">
                Promo Codes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {offers.map((offer, index) => (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="relative overflow-hidden rounded-2xl border border-border bg-card p-6"
                  >
                    <div className="flex gap-4">
                      <div
                        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${offer.gradient} flex items-center justify-center flex-shrink-0`}
                      >
                        <offer.icon className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          {offer.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {offer.description}
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="px-3 py-1.5 bg-secondary rounded-lg border border-dashed border-border">
                            <code className="text-sm font-mono font-semibold text-primary">
                              {offer.code}
                            </code>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {offer.validUntil}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-4 right-4"
                    >
                      Copy
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Featured Restaurant Deals */}
          <section className="py-12 lg:py-16 bg-secondary/30">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-foreground mb-8">
                Restaurant Deals
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredDeals.map((deal, index) => (
                  <motion.div
                    key={deal.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                    className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition-all cursor-pointer"
                  >
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={deal.image}
                        alt={deal.restaurant}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                          {deal.validUntil}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground mb-1">
                        {deal.restaurant}
                      </h3>
                      <p className="text-sm text-success font-medium">
                        {deal.deal}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Newsletter CTA */}
          <section className="py-12 lg:py-16">
            <div className="container mx-auto px-4">
              <div className="bg-gradient-to-r from-primary to-primary/80 rounded-3xl p-8 lg:p-12 text-center">
                <h2 className="text-2xl lg:text-3xl font-bold text-primary-foreground mb-4">
                  Never Miss a Deal
                </h2>
                <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
                  Subscribe to our newsletter and get exclusive offers delivered
                  straight to your inbox
                </p>
                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 h-12 px-4 rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary-foreground/30"
                  />
                  <Button variant="secondary" className="h-12 px-6">
                    Subscribe
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Offers;
