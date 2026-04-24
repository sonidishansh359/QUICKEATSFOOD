import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  imageSrc?: string;
  trend?: { value: number; isPositive: boolean };
  className?: string;
  gradient?: string;
  iconColor?: string;
}

export function StatCard({ title, value, icon: Icon, imageSrc, trend, className, gradient, iconColor }: StatCardProps) {
  return (
    <div className={cn('bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-shadow relative overflow-hidden group', className)}>
      {/* Background decoration */}
      <div className={cn("absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110", gradient)} />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-4">
          {/* Icon or Image */}
          {imageSrc ? (
            <div className="w-12 h-12 lg:w-14 lg:h-14 transition-transform group-hover:scale-105">
              <img src={imageSrc} alt={title} className="w-full h-full object-contain filter drop-shadow-sm" />
            </div>
          ) : (
            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner', gradient ? `bg-gradient-to-br ${gradient} bg-opacity-10` : 'bg-slate-100')}>
              <Icon className={cn('w-6 h-6', iconColor)} />
            </div>
          )}

          {/* Trend Badge */}
          {trend && (
            <div className={cn(
              "px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1",
              trend.isPositive ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              {trend.value}%
            </div>
          )}
        </div>

        <div>
          <p className="text-3xl lg:text-4xl font-extrabold text-slate-800 tracking-tight mb-1">{value}</p>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
        </div>
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        {typeof title === 'string' ? (
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{title}</h1>
        ) : (
          title
        )}
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
