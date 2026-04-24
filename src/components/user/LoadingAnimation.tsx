import { motion } from 'framer-motion';
import { Loader2, UtensilsCrossed, ChefHat, Sparkles } from 'lucide-react';

interface LoadingAnimationProps {
  message?: string;
  type?: 'default' | 'order' | 'food' | 'payment';
}

export function LoadingAnimation({ message = 'Loading...', type = 'default' }: LoadingAnimationProps) {
  const getIcon = () => {
    switch (type) {
      case 'order':
        return <UtensilsCrossed className="w-12 h-12" />;
      case 'food':
        return <ChefHat className="w-12 h-12" />;
      case 'payment':
        return <Loader2 className="w-12 h-12 animate-spin" />;
      default:
        return <Loader2 className="w-12 h-12 animate-spin" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Animated icon container */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: type === 'food' ? [0, 10, -10, 0] : 0,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative mb-6"
      >
        {/* Glow effect */}
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full blur-xl"
        />

        {/* Icon */}
        <div className="relative z-10 text-orange-600">
          {getIcon()}
        </div>

        {/* Orbiting sparkles */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              rotate: 360
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.4
            }}
            className="absolute inset-0"
          >
            <Sparkles
              className="absolute top-0 left-1/2 w-4 h-4 text-orange-400"
              style={{
                transform: `translateX(-50%) translateY(-${20 + i * 5}px)`
              }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Loading dots */}
      <div className="flex items-center gap-2 mb-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.15
            }}
            className="w-2 h-2 bg-orange-500 rounded-full"
          />
        ))}
      </div>

      {/* Message */}
      <motion.p
        animate={{
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="text-gray-600 font-medium"
      >
        {message}
      </motion.p>
    </div>
  );
}

// Skeleton loader for cards
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 p-4">
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="space-y-3"
      >
        <div className="h-40 bg-gray-200 rounded-xl" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-3 bg-gray-200 rounded w-20" />
          <div className="h-3 bg-gray-200 rounded w-16" />
        </div>
      </motion.div>
    </div>
  );
}
