import { motion } from "framer-motion";
import { Smartphone, Apple, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const AppDownload = () => {
  return (
    <section className="py-16 lg:py-24 bg-gradient-primary relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-foreground rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-foreground rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Content */}
          <div className="flex-1 text-center lg:text-left">
            <motion.span      
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-2 bg-primary-foreground/20 rounded-full text-primary-foreground text-sm font-medium mb-6"
            >
              📱 Download Our App
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl lg:text-4xl xl:text-5xl font-bold text-primary-foreground mb-6"
            >
              Order Food Faster with Our Mobile App
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-primary-foreground/80 mb-8 max-w-lg mx-auto lg:mx-0"
            >
              Get exclusive app-only offers, real-time order tracking, and a seamless ordering experience. Available on iOS and Android.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                variant="heroOutline"
                size="xl"
                className="gap-3"
              >
                <Apple className="w-6 h-6" />
                <div className="text-left">
                  <span className="block text-xs opacity-80">Download on the</span>
                  <span className="block font-semibold">App Store</span>
                </div>
              </Button>

              <Button
                variant="heroOutline"
                size="xl"
                className="gap-3"
              >
                <Play className="w-6 h-6" />
                <div className="text-left">
                  <span className="block text-xs opacity-80">Get it on</span>
                  <span className="block font-semibold">Google Play</span>
                </div>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex gap-8 mt-10 justify-center lg:justify-start"
            >
              <div>
                <p className="text-3xl font-bold text-primary-foreground">5M+</p>
                <p className="text-sm text-primary-foreground/70">Downloads</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary-foreground">4.9</p>
                <p className="text-sm text-primary-foreground/70">App Rating</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary-foreground">100K+</p>
                <p className="text-sm text-primary-foreground/70">Reviews</p>
              </div>
            </motion.div>
          </div>

          {/* Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex-1 flex justify-center"
          >
            <div className="relative">
              <div className="w-64 h-[500px] bg-foreground rounded-[3rem] p-3 shadow-2xl">
                <div className="w-full h-full bg-card rounded-[2.5rem] overflow-hidden relative">
                  {/* Phone Screen Content */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <div className="text-center">
                      <Smartphone className="w-16 h-16 text-primary mx-auto mb-4" />
                      <p className="text-foreground font-semibold">QuickEats App</p>
                      <p className="text-muted-foreground text-sm">Coming Soon</p>
                    </div>
                  </div>
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-foreground rounded-b-2xl" />
                </div>
              </div>
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-card rounded-2xl shadow-lg flex items-center justify-center animate-float">
                <span className="text-2xl">🍕</span>
              </div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-card rounded-2xl shadow-lg flex items-center justify-center animate-float" style={{ animationDelay: "0.5s" }}>
                <span className="text-2xl">🍔</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AppDownload;
