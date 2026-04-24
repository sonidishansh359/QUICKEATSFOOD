import { motion } from "framer-motion";
import { Search, MapPin, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroVideo from "@/assets/hero-food.mp4";

const HeroSection = () => {
  const stats = [
    { icon: Star, value: "4.9", label: "App Rating" },
    { icon: Clock, value: "25min", label: "Avg. Delivery" },
    { icon: MapPin, value: "500+", label: "Cities" },
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 pt-20">
        <div className="max-w-2xl">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-block px-4 py-2 bg-primary/20 backdrop-blur-sm rounded-full text-primary-foreground text-sm font-medium mb-6"
          >
            🔥 Free delivery on your first order
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight"
          >
            Delicious Food,{" "}
            <span className="text-gradient bg-gradient-primary bg-clip-text text-transparent">
              Delivered Fast
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-xl"
          >
            Order from the best local restaurants with easy, on-demand delivery. 
            Fresh meals at your doorstep in minutes.
          </motion.p>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card/95 backdrop-blur-md rounded-2xl p-2 shadow-xl max-w-xl"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <input
                  type="text"
                  placeholder="Enter your delivery address"
                  className="w-full h-12 pl-12 pr-4 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <Button variant="hero" size="lg" className="h-12">
                <Search className="w-4 h-4" />
                Find Food
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-6 mt-10"
          >
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="flex items-center gap-3 bg-primary-foreground/10 backdrop-blur-sm rounded-xl px-4 py-3"
              >
                <stat.icon className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-lg font-bold text-primary-foreground">{stat.value}</p>
                  <p className="text-xs text-primary-foreground/70">{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default HeroSection;
