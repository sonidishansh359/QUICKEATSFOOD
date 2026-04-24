import { getRestaurantStatus } from "@/utils/restaurantStatus";
import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RestaurantCard from "@/components/home/RestaurantCard";
import { Button } from "@/components/ui/button";

import { useUserData } from "@/contexts/UserDataContext";

const cuisineFilters = [
  "All",
  "American",
  "Japanese",
  "Italian",
  "Indian",
  "Mexican",
  "Chinese",
  "Vietnamese",
  "BBQ",
  "Healthy",
];

const sortOptions = ["Recommended", "Rating", "Delivery Time", "Distance"];

const Restaurants = () => {
  const { restaurants: allRestaurants } = useUserData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [sortBy, setSortBy] = useState("Recommended");

  const filteredRestaurants = allRestaurants.filter((restaurant) => {
    const matchesSearch =
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCuisine =
      selectedCuisine === "All" || restaurant.cuisine === selectedCuisine;
    return matchesSearch && matchesCuisine;
  });

  return (
    <>
      <Helmet>
        <title>Browse Restaurants | QuickEats</title>
        <meta
          name="description"
          content="Explore our wide selection of restaurants. Find your favorite cuisines and order food online for fast delivery."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 lg:pt-24">
          {/* Header */}
          <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/30 py-12">
            <div className="container mx-auto px-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl lg:text-4xl font-bold text-foreground mb-4"
              >
                All Restaurants
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-muted-foreground mb-8"
              >
                {filteredRestaurants.length} restaurants available near you
              </motion.p>

              {/* Search and Filters */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1 max-w-xl">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search restaurants or cuisines..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="flex gap-3">
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="h-12 pl-4 pr-10 bg-card border border-border rounded-xl text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {sortOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>

                  <Button variant="outline" className="h-12 gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Cuisine Filters */}
          <section className="py-6 border-b border-border">
            <div className="container mx-auto px-4">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {cuisineFilters.map((cuisine) => (
                  <button
                    key={cuisine}
                    onClick={() => setSelectedCuisine(cuisine)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCuisine === cuisine
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                      }`}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Restaurant Grid */}
          <section className="py-8 lg:py-12">
            <div className="container mx-auto px-4">
              {filteredRestaurants.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredRestaurants.map((restaurant) => {
                    return <RestaurantCard key={restaurant.id} {...restaurant} />;
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-lg text-muted-foreground">
                    No restaurants found matching your criteria.
                  </p>
                </div>
              )}
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Restaurants;
