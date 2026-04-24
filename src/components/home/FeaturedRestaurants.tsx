import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import RestaurantCard from "./RestaurantCard";

const restaurants = [
  {
    id: 1,
    name: "Burger Palace",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
    cuisine: "American",
    rating: 4.8,
    reviewCount: 245,
    deliveryTime: "15-20 min",
    deliveryFee: "Free",
    distance: "1.2 km",
    featured: true,
    discount: "20% OFF",
    openTime: "10:00 AM",
    closeTime: "10:00 PM",
  },
  {
    id: 2,
    name: "Tokyo Sushi House",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=80",
    cuisine: "Japanese",
    rating: 4.9,
    reviewCount: 189,
    deliveryTime: "20-25 min",
    deliveryFee: "$2.99",
    distance: "2.1 km",
    openTime: "11:00 AM",
    closeTime: "11:00 PM",
  },
  {
    id: 3,
    name: "Pizza Napoli",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop&q=80",
    cuisine: "Italian",
    rating: 4.7,
    reviewCount: 312,
    deliveryTime: "15-25 min",
    deliveryFee: "Free",
    distance: "0.8 km",
    featured: true,
    openTime: "6:00 PM",
    closeTime: "3:00 AM",
  },
  {
    id: 4,
    name: "Spice Route",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80",
    cuisine: "Indian",
    rating: 4.6,
    reviewCount: 156,
    deliveryTime: "18-24 min",
    deliveryFee: "$1.99",
    distance: "3.5 km",
    discount: "15% OFF",
    openTime: "7:00 AM",
    closeTime: "11:00 PM",
  },
  {
    id: 5,
    name: "Taco Loco",
    image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&auto=format&fit=crop&q=80",
    cuisine: "Mexican",
    rating: 4.5,
    reviewCount: 98,
    deliveryTime: "15-20 min",
    deliveryFee: "Free",
    distance: "1.8 km",
    openTime: "8:00 AM",
    closeTime: "8:00 PM",
  },
  {
    id: 6,
    name: "Dragon Wok",
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&auto=format&fit=crop&q=80",
    cuisine: "Chinese",
    rating: 4.7,
    reviewCount: 203,
    deliveryTime: "20-25 min",
    deliveryFee: "$2.49",
    distance: "2.4 km",
    openTime: "12:00 PM",
    closeTime: "12:00 AM",
  },
  {
    id: 7,
    name: "Sweet Tooth Bakery",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80",
    cuisine: "Desserts",
    rating: 4.9,
    reviewCount: 421,
    deliveryTime: "15-20 min",
    deliveryFee: "Free",
    distance: "0.5 km",
    featured: true,
    openTime: "9:00 AM",
    closeTime: "9:00 PM",
  },
  {
    id: 8,
    name: "Mediterranean Grill",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
    cuisine: "Mediterranean",
    rating: 4.6,
    reviewCount: 167,
    deliveryTime: "20-25 min",
    deliveryFee: "$1.99",
    distance: "2.9 km",
    openTime: "10:00 AM",
    closeTime: "10:00 PM",
  },
];

const FeaturedRestaurants = () => {
  return (
    <section className="py-12 lg:py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl lg:text-3xl font-bold text-foreground mb-2"
            >
              Popular Restaurants Near You
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground"
            >
              Order from the best restaurants in your area
            </motion.p>
          </div>
          <Button variant="outline" className="gap-2">
            View All
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {restaurants.map((restaurant, index) => (
            <RestaurantCard
              key={restaurant.id}
              {...restaurant}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedRestaurants;
