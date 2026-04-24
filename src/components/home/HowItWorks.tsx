import { motion } from "framer-motion";
import { MapPin, UtensilsCrossed, Bike, Check } from "lucide-react";

const steps = [
  {
    icon: MapPin,
    title: "Enter Your Address",
    description: "Share your location to find the best restaurants nearby",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: UtensilsCrossed,
    title: "Choose Your Meal",
    description: "Browse menus and pick your favorite dishes from top restaurants",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Bike,
    title: "Fast Delivery",
    description: "Track your order in real-time as it makes its way to you",
    color: "bg-success/10 text-success",
  },
  {
    icon: Check,
    title: "Enjoy Your Food",
    description: "Receive your order fresh and hot at your doorstep",
    color: "bg-primary/10 text-primary",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4"
          >
            Simple Process
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl lg:text-4xl font-bold text-foreground mb-4"
          >
            How It Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            Getting your favorite food delivered is easier than ever. Just follow these simple steps.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative text-center"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-border" />
              )}

              {/* Step Number */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold z-10">
                {index + 1}
              </div>

              {/* Icon */}
              <div
                className={`w-20 h-20 mx-auto rounded-2xl ${step.color} flex items-center justify-center mb-6`}
              >
                <step.icon className="w-8 h-8" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
