import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Sparkles, Package, TruckIcon, ChefHat } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface OrderSuccessAnimationProps {
  show: boolean;
  orderNumber?: string;
  onComplete?: () => void;
}

export function OrderSuccessAnimation({ show, orderNumber, onComplete }: OrderSuccessAnimationProps) {
  useEffect(() => {
    if (show) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          clearInterval(interval);
          if (onComplete) {
            setTimeout(onComplete, 500);
          }
          return;
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur"
        >
          {/* Ambient holo grid */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.12),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(249,115,22,0.12),transparent_28%),radial-gradient(circle_at_50%_80%,rgba(168,85,247,0.12),transparent_32%)]"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            {[...Array(16)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-px w-full bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"
                style={{ top: `${(i / 16) * 100}%` }}
                animate={{ x: ['-10%', '10%', '-10%'], opacity: [0.2, 0.7, 0.2] }}
                transition={{ duration: 6 + i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}
            {[...Array(12)].map((_, i) => (
              <motion.span
                key={`dot-${i}`}
                className="absolute w-2 h-2 rounded-full bg-white/50"
                style={{ left: `${(i * 9) % 100}%`, top: `${(i * 13) % 100}%` }}
                animate={{ y: [0, -14, 0], opacity: [0.3, 0.9, 0.3] }}
                transition={{ duration: 5 + i * 0.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.05 }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.6, rotate: -4 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.6, rotate: 6 }}
            transition={{ type: "spring", stiffness: 240, damping: 18 }}
            className="bg-slate-900/80 backdrop-blur-xl border border-cyan-400/30 rounded-3xl p-8 max-w-4xl w-full mx-4 shadow-[0_25px_90px_rgba(0,0,0,0.45)] relative overflow-hidden"
          >
            {/* Gradient sweep */}
            <motion.div
              className="absolute inset-0"
              style={{ backgroundImage: 'linear-gradient(120deg, rgba(14,165,233,0.14), rgba(168,85,247,0.14), rgba(249,115,22,0.14))' }}
              animate={{ filter: ['hue-rotate(0deg)', 'hue-rotate(50deg)', 'hue-rotate(0deg)'] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute inset-0"
              style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.1), transparent 35%), radial-gradient(circle at 80% 70%, rgba(16, 185, 129, 0.12), transparent 40%)' }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="relative z-10 text-white space-y-8">
              <div className="grid md:grid-cols-5 gap-6 items-center">
                {/* 3D badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 260 }}
                  className="md:col-span-2 flex justify-center"
                >
                  <div className="relative w-72 h-72">
                    <motion.div
                      className="absolute inset-6 rounded-full border border-cyan-300/40"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.div
                      className="absolute inset-3 rounded-full bg-gradient-to-br from-emerald-500 via-cyan-500 to-amber-400 blur-xl"
                      animate={{ scale: [1, 1.06, 1], opacity: [0.7, 0.95, 0.7] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                      className="absolute inset-0"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 text-amber-200" />
                      <Sparkles className="absolute bottom-4 right-6 w-6 h-6 text-cyan-200" />
                      <Sparkles className="absolute top-10 left-6 w-5 h-5 text-emerald-200" />
                    </motion.div>
                    <motion.div
                      className="absolute inset-8 rounded-full bg-slate-950/70 border border-white/10 shadow-2xl flex items-center justify-center"
                      animate={{ scale: [1, 1.03, 1], boxShadow: [
                        '0 0 40px rgba(16,185,129,0.35)',
                        '0 0 55px rgba(59,130,246,0.4)',
                        '0 0 40px rgba(16,185,129,0.35)'
                      ] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <CheckCircle className="w-20 h-20 text-emerald-300" strokeWidth={3} />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Copy + chips */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="md:col-span-3 space-y-4"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs uppercase tracking-[0.3em] text-cyan-200">
                    Order locked in
                    <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.8, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                  </div>
                  <h2 className="text-4xl font-bold leading-tight">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-emerald-200 to-amber-200">Order placed successfully!</span>
                  </h2>
                  <p className="text-cyan-100/80 text-lg">
                    Kitchen, rider, and live tracking are synced. We already optimized your route.
                  </p>
                  {orderNumber && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-white/10 shadow-lg"
                    >
                      <Sparkles className="w-4 h-4 text-amber-200" />
                      <span className="text-sm font-semibold text-white">Order #{orderNumber}</span>
                    </motion.div>
                  )}
                </motion.div>
              </div>

              {/* Metric strip */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="grid md:grid-cols-3 gap-4"
              >
                {[{
                  title: 'ETA primed',
                  value: '30-45 minutes',
                  icon: ClockChip,
                  accent: 'from-emerald-400/30 to-cyan-400/20'
                }, {
                  title: 'Dropping to',
                  value: 'Your saved address',
                  icon: MapChip,
                  accent: 'from-cyan-400/30 to-blue-500/20'
                }, {
                  title: 'Live tracking',
                  value: 'Auto-updating',
                  icon: PulseChip,
                  accent: 'from-amber-400/30 to-pink-500/20'
                }].map((item, idx) => (
                  <motion.div
                    key={item.title}
                    className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg`}
                    animate={{ y: [0, idx % 2 === 0 ? -4 : 4, 0] }}
                    transition={{ duration: 3 + idx * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.accent}`} />
                    <div className="relative flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-center">
                        <item.icon />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">{item.title}</p>
                        <p className="text-base font-semibold text-white">{item.value}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Status rail */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid md:grid-cols-3 gap-4"
              >
                {[{
                  label: 'Confirmed',
                  desc: 'Restaurant accepted instantly',
                  icon: Package,
                  gradient: 'from-emerald-400 to-cyan-400'
                }, {
                  label: 'Cooking',
                  desc: 'Chef sync locked',
                  icon: ChefHat,
                  gradient: 'from-amber-400 to-pink-500'
                }, {
                  label: 'Route live',
                  desc: 'Rider navigation ready',
                  icon: TruckIcon,
                  gradient: 'from-cyan-400 to-indigo-500'
                }].map((step, idx) => (
                  <motion.div
                    key={step.label}
                    className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                    animate={{ scale: [1, 1.02, 1], rotate: [0, idx % 2 === 0 ? 0.4 : -0.4, 0] }}
                    transition={{ duration: 2.6 + idx * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <div className={`absolute inset-0 opacity-70 bg-gradient-to-br ${step.gradient}`} />
                    <div className="relative flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-center text-white">
                        <step.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{step.label}</p>
                        <p className="text-xs text-cyan-100/80">{step.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center text-sm text-cyan-100"
              >
                Redirecting to live tracking with rider beacons and kitchen pings...
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ClockChip() {
  return (
    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-300 to-cyan-300 flex items-center justify-center text-slate-900">
      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    </div>
  );
}

function MapChip() {
  return (
    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-cyan-300 to-blue-400 flex items-center justify-center text-slate-900">
      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 1 1 18 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    </div>
  );
}

function PulseChip() {
  return (
    <motion.div
      className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-300 to-pink-400"
      animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 1.6, repeat: Infinity }}
    />
  );
}
