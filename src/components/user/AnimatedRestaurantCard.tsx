import { motion } from 'framer-motion';
import { Star, Clock, TruckIcon, Zap, Heart } from 'lucide-react';
import { Restaurant } from '@/types/auth';
import { Link } from 'react-router-dom';
import { useState } from 'react';

interface AnimatedRestaurantCardProps {
  restaurant: Restaurant;
  index: number;
}

export function AnimatedRestaurantCard({ restaurant, index }: AnimatedRestaurantCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="group"
    >
      <Link to={`/user/restaurant/${restaurant.id}`}>
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 relative">
          {/* Image container */}
          <div className="relative h-48 overflow-hidden">
            <motion.img
              src={restaurant.image}
              alt={restaurant.name}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />

            {/* Gradient overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />

            {/* Favorite button */}
            <motion.button
              onClick={(e) => {
                e.preventDefault();
                setIsFavorite(!isFavorite);
              }}
              className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                animate={{ scale: isFavorite ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 0.3 }}
              >
                <Heart
                  className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                />
              </motion.div>
            </motion.button>

            {/* Status badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
              {restaurant.isOpen ? (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-1"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2 h-2 bg-white rounded-full"
                  />
                  Open Now
                </motion.div>
              ) : (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg"
                >
                  Closed
                </motion.div>
              )}

              {restaurant.rating >= 4.5 && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 fill-current" />
                  Top Rated
                </motion.div>
              )}
            </div>

            {/* Shine effect on hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-transparent"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.8 }}
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              }}
            />
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <motion.h3
                  className="font-bold text-lg text-gray-900 truncate group-hover:text-orange-600 transition-colors"
                  whileHover={{ x: 2 }}
                >
                  {restaurant.name}
                </motion.h3>
                <p className="text-sm text-gray-600 truncate">{restaurant.cuisine}</p>
              </div>

              {/* Rating badge */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-1 bg-green-100 rounded-full px-2.5 py-1 ml-2 flex-shrink-0"
              >
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                <span className="font-bold text-sm text-gray-900">
                  {restaurant.rating.toFixed(1)}
                </span>
              </motion.div>
            </div>

            {/* Info badges */}
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-1"
              >
                <Clock className="w-4 h-4" />
                <span>{restaurant.deliveryTime}</span>
              </motion.div>

              <span className="text-gray-300">•</span>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-1"
              >
                <TruckIcon className="w-4 h-4" />
                <span className="text-green-600 font-medium">Free</span>
              </motion.div>
            </div>

            {/* Hover indicator */}
            <motion.div
              className="mt-3 flex items-center text-orange-600 font-medium text-sm"
              initial={{ opacity: 0, x: -10 }}
              whileHover={{ opacity: 1, x: 0 }}
            >
              View Menu →
            </motion.div>
          </div>

          {/* Animated border on hover */}
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-orange-500 opacity-0"
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </Link>
    </motion.div>
  );
}
