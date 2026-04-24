import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  icon?: React.ReactNode;
  successAnimation?: boolean;
}

export function AnimatedButton({
  children,
  onClick,
  isLoading = false,
  disabled = false,
  variant = 'default',
  size = 'default',
  className,
  icon,
  successAnimation = false
}: AnimatedButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Button
        onClick={onClick}
        disabled={disabled || isLoading}
        variant={variant}
        size={size}
        className={cn(
          "relative overflow-hidden group",
          successAnimation && "bg-gradient-to-r from-orange-500 to-pink-500",
          className
        )}
      >
        {/* Shimmer effect */}
        {!disabled && !isLoading && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
        )}
        
        {/* Sparkle effect on hover */}
        {!disabled && !isLoading && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          >
            <Sparkles className="absolute top-1 right-2 w-3 h-3 text-white/60 animate-pulse" />
            <Sparkles className="absolute bottom-2 left-3 w-2 h-2 text-white/40 animate-pulse" style={{ animationDelay: '0.2s' }} />
          </motion.div>
        )}

        <span className="relative z-10 flex items-center gap-2">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {icon}
              {children}
            </>
          )}
        </span>
      </Button>
    </motion.div>
  );
}
