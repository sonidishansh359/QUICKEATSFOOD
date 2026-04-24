import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  isSelected: boolean;
  onClick: () => void;
}

export function RoleCard({ title, description, icon: Icon, gradient, isSelected, onClick }: RoleCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative w-full p-6 rounded-2xl text-left transition-all duration-300',
        'bg-card border-2 shadow-md hover:shadow-xl',
        isSelected
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:border-primary/50'
      )}
    >
      <div
        className={cn(
          'w-14 h-14 rounded-xl flex items-center justify-center mb-4',
          gradient
        )}
      >
        <Icon className="w-7 h-7 text-primary-foreground" />
      </div>

      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>

      {isSelected && (
        <motion.div
          layoutId="selected-indicator"
          className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
}
