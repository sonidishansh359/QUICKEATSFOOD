import { motion, Variants, Transition } from 'framer-motion';
import { Store, MapPin, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import zomato1 from '@/assets/zomato1.avif'; // Burger
import zomto2 from '@/assets/zomto2.avif'; // Momos
import zomato3 from '@/assets/zomato3.avif'; // Pizza slice
import zomato4 from '@/assets/zomato4.avif'; // Small leaf/tomato
import zomato5 from '@/assets/zomato5.avif'; // Small leaf/tomato
import bgImage from '@/assets/pizza ai bg.png'; // Background if needed?

// Floating animation variant
const floatingAnimation: Variants = {
    initial: { y: 0 },
    animate: {
        y: [-5, 5, -5],
        transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
        } as Transition
    }
};

const floatingAnimationDelayed: Variants = {
    initial: { y: 0 },
    animate: {
        y: [-7, 7, -7],
        transition: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5
        } as Transition
    }
};

export function StatsSection() {
    const [stats, setStats] = useState({
        totalRestaurants: 300000,
        cities: 800,
        orders: 3000000000 // 3 billion
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const API_BASE_URL = typeof API_ORIGIN === 'string' && API_ORIGIN.endsWith('/api') ? API_ORIGIN : `${API_ORIGIN}/api`;
                const response = await fetch(`${API_BASE_URL}/stats`);
                if (response.ok) {
                    const data = await response.json();
                    setStats({
                        totalRestaurants: data.totalRestaurants || 300000,
                        cities: data.cities || 800,
                        orders: data.totalOrders || 3000000000
                    });
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };

        fetchStats();
    }, []);

    return (
        <section className="relative py-24 overflow-hidden bg-background">
            {/* Background SVG Curve */}
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
                <svg
                    className="absolute top-0 left-0 w-full h-full text-pink-300 dark:text-pink-800"
                    fill="none"
                    viewBox="0 0 1000 600"
                    preserveAspectRatio="none"
                >
                    <path
                        d="M0,0 C200,100 0,300 200,400 C400,500 600,300 800,400 C1000,500 1000,600 1000,600 L1000,0 L0,0 Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                        vectorEffect="non-scaling-stroke"
                        className="hidden md:block"
                    />
                    <path
                        d="M0,0 C300,50 100,250 300,300 C500,350 700,250 900,300 C1000,325 1000,400 1000,400"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                        strokeDasharray="5,5"
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>
            </div>

            <div className="container mx-auto px-4 relative z-10 flex flex-col items-center">
                {/* Floating Images Container - Positioned to the far edges */}
                <div className="absolute inset-0 pointer-events-none hidden lg:block overflow-visible w-full max-w-[1400px] mx-auto px-4">
                    {/* Top Left - Leaf/Tomato */}
                    <motion.img
                        src={zomato5}
                        alt="Food item"
                        className="absolute top-0 left-0 w-16 h-auto opacity-80"
                        variants={floatingAnimation}
                        initial="initial"
                        animate="animate"
                    />

                    {/* Middle Left - Burger */}
                    <motion.img
                        src={zomato1}
                        alt="Burger"
                        className="absolute top-1/3 left-[2%] -translate-y-1/2 w-48 h-auto drop-shadow-xl z-0"
                        variants={floatingAnimationDelayed}
                        initial="initial"
                        animate="animate"
                    />

                    {/* Bottom Left - Tomato Slice */}
                    <motion.img
                        src={zomato4}
                        alt="Tomato"
                        className="absolute bottom-20 left-[10%] w-16 h-auto rotate-12"
                        variants={floatingAnimation}
                        initial="initial"
                        animate="animate"
                    />

                    {/* Top Right - Momos */}
                    <motion.img
                        src={zomto2}
                        alt="Momos"
                        className="absolute top-10 right-[2%] w-40 h-auto drop-shadow-lg rotate-[-12deg] z-0"
                        variants={floatingAnimation}
                        initial="initial"
                        animate="animate"
                    />

                    {/* Middle Right - Tomato/Leaf */}
                    <motion.img
                        src={zomato4}
                        alt="Garnish"
                        className="absolute top-1/2 right-[12%] w-12 h-auto"
                        variants={floatingAnimationDelayed}
                        initial="initial"
                        animate="animate"
                    />

                    {/* Bottom Right - Pizza */}
                    <motion.img
                        src={zomato3}
                        alt="Pizza"
                        className="absolute bottom-10 right-[2%] w-56 h-auto drop-shadow-xl rotate-12 z-0"
                        variants={floatingAnimationDelayed}
                        initial="initial"
                        animate="animate"
                    />
                </div>

                {/* Central Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-2xl mx-auto mb-16 pt-10"
                >
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                        Better food for <br />
                        <span className="text-primary">more people</span>
                    </h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        For over a decade, we've enabled our customers to discover new tastes,
                        delivered right to their doorstep.
                    </p>
                </motion.div>

                {/* Stats Card */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-card/80 backdrop-blur-md border border-border shadow-2xl rounded-3xl p-8 md:p-12 w-full max-w-4xl relative z-20"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 divide-y md:divide-y-0 md:divide-x divide-border">
                        {/* Stat 1 */}
                        <div className="flex flex-col items-center justify-center text-center p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-3xl md:text-4xl font-bold text-foreground">{stats.totalRestaurants.toLocaleString()}+</h3>
                                <Store className="w-8 h-8 text-primary" strokeWidth={1.5} />
                            </div>
                            <p className="text-muted-foreground font-medium">restaurants</p>
                        </div>

                        {/* Stat 2 */}
                        <div className="flex flex-col items-center justify-center text-center p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-3xl md:text-4xl font-bold text-foreground">{stats.cities.toLocaleString()}+</h3>
                                <MapPin className="w-8 h-8 text-primary" strokeWidth={1.5} />
                            </div>
                            <p className="text-muted-foreground font-medium">cities</p>
                        </div>

                        {/* Stat 3 */}
                        <div className="flex flex-col items-center justify-center text-center p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-3xl md:text-4xl font-bold text-foreground">{stats.orders.toLocaleString()}+</h3>
                                <ShoppingBag className="w-8 h-8 text-primary" strokeWidth={1.5} />
                            </div>
                            <p className="text-muted-foreground font-medium">orders delivered</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
