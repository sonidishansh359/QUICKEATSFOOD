import { motion } from 'framer-motion';
import { Plus, Minus, Trash2, Sparkles } from 'lucide-react';
import { CartItem } from '@/contexts/UserDataContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface AnimatedCartItemProps {
  item: CartItem;
  index: number;
  onUpdateQuantity: (menuItemId: string, quantity: number) => void;
  onRemove: (menuItemId: string) => void;
}

export function AnimatedCartItem({ item, index, onUpdateQuantity, onRemove }: AnimatedCartItemProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => onRemove(item.menuItemId), 300);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: isRemoving ? 0 : 1, x: isRemoving ? -100 : 0 }}
      exit={{ opacity: 0, x: -100, transition: { duration: 0.3 } }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 30 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative overflow-hidden group"
    >
      {/* Hover gradient effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-pink-500/0"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6 }}
      />

      <div className="relative z-10 flex gap-4">
        {/* Image with hover effect */}
        <motion.div
          whileHover={{ scale: 1.05, rotate: 2 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0"
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-200 to-pink-200 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-orange-600" />
            </div>
          )}
          
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent"
            initial={{ x: '-100%', y: '-100%' }}
            whileHover={{ x: '100%', y: '100%' }}
            transition={{ duration: 0.6 }}
          />
        </motion.div>

        {/* Item details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
              <p className="text-sm text-gray-500">{item.restaurantName}</p>
            </div>
            <motion.div
              whileHover={{ scale: 1.1, rotate: 180 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemove}
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>

          <div className="flex items-center justify-between">
            {/* Quantity controls */}
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onUpdateQuantity(item.menuItemId, Math.max(1, item.quantity - 1))}
                  disabled={item.quantity <= 1}
                  className="h-8 w-8 rounded-lg border-2 hover:border-orange-500 hover:bg-orange-50 transition-all"
                >
                  <Minus className="w-3 h-3" />
                </Button>
              </motion.div>

              <motion.span
                key={item.quantity}
                initial={{ scale: 1.5, color: '#f97316' }}
                animate={{ scale: 1, color: '#111827' }}
                className="w-8 text-center font-semibold text-gray-900"
              >
                {item.quantity}
              </motion.span>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onUpdateQuantity(item.menuItemId, item.quantity + 1)}
                  className="h-8 w-8 rounded-lg border-2 hover:border-orange-500 hover:bg-orange-50 transition-all"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </motion.div>
            </div>

            {/* Price with animation */}
            <motion.div
              key={item.price * item.quantity}
              initial={{ scale: 1.2, color: '#f97316' }}
              animate={{ scale: 1, color: '#111827' }}
              className="font-bold text-lg"
            >
              ₹{(item.price * item.quantity).toFixed(2)}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Pulse effect on hover */}
      <motion.div
        className="absolute -top-10 -right-10 w-20 h-20 bg-orange-500/20 rounded-full blur-2xl"
        initial={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}
