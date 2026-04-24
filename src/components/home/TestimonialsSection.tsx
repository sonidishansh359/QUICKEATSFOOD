import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { useState, useEffect } from 'react';

// Define interface for Review data
interface Review {
    _id: string;
    user: {
        name: string;
        profilePicture?: string;
    };
    restaurant: {
        name: string;
    };
    comment: string;
    rating: number;
}

export function TestimonialsSection() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [testimonials, setTestimonials] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                const API_ORIGIN = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
                const API_BASE_URL = typeof API_ORIGIN === 'string' && API_ORIGIN.endsWith('/api') ? API_ORIGIN : `${API_ORIGIN}/api`;

                const response = await fetch(`${API_BASE_URL}/reviews/testimonials`);
                if (response.ok) {
                    const data = await response.json();
                    setTestimonials(data);
                }
            } catch (error) {
                console.error('Error fetching testimonials:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTestimonials();
    }, []);

    useEffect(() => {
        if (testimonials.length > 0) {
            const interval = setInterval(() => {
                setActiveIndex((current) => (current + 1) % testimonials.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [testimonials]);

    if (loading || testimonials.length === 0) {
        return null; // Don't show section if no reviews or loading
    }

    return (
        <section className="py-20 bg-secondary/30 overflow-hidden">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
                        <Quote className="w-4 h-4" />
                        Social Proof
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        What Our <span className="text-primary">Customers</span> Say
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Don't just take our word for it. Here's what our community thinks about quick and delicious delivery.
                    </p>
                </motion.div>

                <div className="relative max-w-4xl mx-auto">
                    {/* Carousel for Desktop/Tablet */}
                    <div className="hidden md:block relative h-64">
                        {testimonials.map((item, index) => (
                            <motion.div
                                key={item._id}
                                initial={{ opacity: 0, x: 100 }}
                                animate={{
                                    opacity: activeIndex === index ? 1 : 0,
                                    x: activeIndex === index ? 0 : (index < activeIndex ? -100 : 100),
                                    scale: activeIndex === index ? 1 : 0.9
                                }}
                                transition={{ duration: 0.5 }}
                                className="absolute inset-0"
                                style={{ pointerEvents: activeIndex === index ? 'auto' : 'none' }}
                            >
                                <div className="bg-card rounded-2xl p-8 border border-border shadow-lg flex flex-col md:flex-row items-center gap-8 h-full">
                                    <div className="flex-shrink-0">
                                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20 bg-muted flex items-center justify-center">
                                            {item.user.profilePicture ? (
                                                <img src={item.user.profilePicture} alt={item.user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-2xl font-bold text-muted-foreground">{item.user.name.charAt(0)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-grow text-center md:text-left">
                                        <div className="flex justify-center md:justify-start mb-2">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-5 h-5 ${i < item.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                            ))}
                                        </div>
                                        <p className="text-lg text-foreground italic mb-4">"{item.comment}"</p>
                                        <div>
                                            <h4 className="font-bold text-foreground">{item.user.name}</h4>
                                            <p className="text-sm text-muted-foreground">Order from {item.restaurant?.name}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Just a Stack for Mobile */}
                    <div className="md:hidden space-y-6">
                        {testimonials.map((item) => (
                            <div key={item._id} className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 bg-muted flex items-center justify-center">
                                        {item.user.profilePicture ? (
                                            <img src={item.user.profilePicture} alt={item.user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-lg font-bold text-muted-foreground">{item.user.name.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground text-sm">{item.user.name}</h4>
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-3 h-3 ${i < item.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-foreground italic">"{item.comment}"</p>
                                <p className="text-xs text-muted-foreground mt-2 text-right">- Order from {item.restaurant?.name}</p>
                            </div>
                        ))}
                    </div>

                    {/* Dots Indicator */}
                    <div className="hidden md:flex justify-center mt-8 gap-2">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all ${activeIndex === index ? 'bg-primary w-6' : 'bg-primary/30'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
