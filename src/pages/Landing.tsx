import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User, Store, Bike, Star, Clock, MapPin,
  ChevronRight, ChevronDown, Smartphone, Shield, Zap,
  UtensilsCrossed, TrendingUp, Users, Play, Pause
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/auth/AuthModal';
import { UserRole } from '@/types/auth';
import { Link } from 'react-router-dom';
import heroVideo from '@/assets/hero-food.mp4';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { StatsSection } from '@/components/home/StatsSection';
import { ConnectSidePanel } from '@/components/home/ConnectSidePanel';
import { useEffect } from 'react';


// Import food category images
import logoImage from '@/assets/logo.webp';
import pizzaImage from '@/assets/pizza ai bg.png';
import loginFaceImage from '@/assets/loginface.webp';
import cookImage from '@/assets/cook1.avif';
import deliveryImage from '@/assets/pngtree-food-delivery-by-scooters-free-download-png-image_13741129-removebg-preview.png';

// ... (existing imports)

// ... inside component ...
<Link to="/" className="flex items-center gap-2">
  <img src={logoImage} alt="QuickEats" className="w-12 h-12 object-contain" />
  <span className="text-xl font-bold text-foreground">
    Quick<span className="text-primary">Eats</span>
  </span>
</Link>
import burgerImage from '@/assets/burger.png';
import chineseImage from '@/assets/chinese.png';
import mexicanImage from '@/assets/mexican.png';
import sushiImage from '@/assets/sushi.png';
import veganImage from '@/assets/vegan.png';
import icecreamImage from '@/assets/icecream.png';
import drinksImage from '@/assets/drinks.png';

const roles = [
  {
    id: 'user' as UserRole,
    title: 'Order Food',
    description: 'Browse restaurants and get food delivered to your door',
    icon: User,
    image: loginFaceImage,
    color: 'bg-blue-500',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    id: 'owner' as UserRole,
    title: 'Partner with Us',
    description: 'Grow your restaurant with online orders',
    icon: Store,
    image: cookImage,
    color: 'bg-primary',
    gradient: 'from-primary to-accent',
  },
  {
    id: 'delivery' as UserRole,
    title: 'Become a Rider',
    description: 'Earn money delivering food on your schedule',
    icon: Bike,
    image: deliveryImage,
    color: 'bg-green-500',
    gradient: 'from-green-500 to-emerald-600',
  },
];

const stats = [
  { icon: Star, value: '4.9', label: 'App Rating', color: 'text-yellow-500' },
  { icon: Clock, value: '25min', label: 'Avg Delivery', color: 'text-blue-500' },
  { icon: MapPin, value: '500+', label: 'Cities', color: 'text-green-500' },
  { icon: Users, value: '50K+', label: 'Happy Customers', color: 'text-primary' },
];

const featureTemplate = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Get your food delivered in under 25 minutes',
  },
  {
    icon: Shield,
    title: 'Safe & Secure',
    description: 'Contactless delivery with safety protocols',
  },
  {
    icon: Smartphone,
    title: 'Live Tracking',
    description: 'Track your order in real-time on the map',
  },
  {
    icon: UtensilsCrossed,
    title: 'RESTAURANTS_COUNT',
    description: 'From local favorites to popular chains',
  },
];

const foodCategories = [
  { image: pizzaImage, name: 'Pizza' },
  { image: burgerImage, name: 'Burgers' },
  { image: chineseImage, name: 'Asian' },
  { image: mexicanImage, name: 'Mexican' },
  { image: sushiImage, name: 'Sushi' },
  { image: veganImage, name: 'Healthy' },
  { image: icecreamImage, name: 'Desserts' },
  { image: drinksImage, name: 'Coffee' },
];

export default function Landing() {
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    role: UserRole;
    mode: 'login' | 'signup';
  }>({
    isOpen: false,
    role: 'user',
    mode: 'login',
  });



  const [features, setFeatures] = useState(featureTemplate);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Fetch real stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const API_ORIGIN = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
        const API_BASE_URL = typeof API_ORIGIN === 'string' && API_ORIGIN.endsWith('/api') ? API_ORIGIN : `${API_ORIGIN}/api`;
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (response.ok) {
          const data = await response.json();


          // Update features with real restaurant count
          setFeatures(prev => prev.map(feature =>
            feature.title === 'RESTAURANTS_COUNT'
              ? { ...feature, title: `${data.totalRestaurants}+ Restaurants` }
              : feature
          ));
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Keep default stats if fetch fails
      }
    };

    fetchStats();
  }, []);

  const openAuth = (role: UserRole, mode: 'login' | 'signup' = 'login') => {
    setAuthModal({ isOpen: true, role, mode });
  };

  const closeAuth = () => {
    setAuthModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <>
      <Helmet>
        <title>QuickEats - Fast Food Delivery | Order Online</title>
        <meta name="description" content="Order food, manage your restaurant, or deliver happiness. Join QuickEats today - the fastest growing food delivery platform." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoImage} alt="QuickEats Logo" className="h-10 w-10 object-contain" />
              <span className="text-xl font-bold text-foreground">
                Quick<span className="text-primary">Eats</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => openAuth('owner', 'signup')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Partner with us
              </button>
              <button
                onClick={() => openAuth('delivery', 'signup')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Become a rider
              </button>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => openAuth('user', 'login')}
              >
                Log in
              </Button>
              <Button
                onClick={() => openAuth('user', 'signup')}
              >
                Sign up
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            >
              <source src={heroVideo} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/30" />
          </div>



          {/* Content */}
          <div className="container mx-auto px-4 relative z-10 py-12 lg:py-0">
            <div className="w-full max-w-4xl mx-auto text-center flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center"
              >
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-medium mb-6 shadow-lg"
                >
                  <Zap className="w-4 h-4 text-primary" />
                  Free delivery on your All order
                </motion.span>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-2xl">
                  Delicious Food,{' '}
                  <span className="text-white font-black italic tracking-wide drop-shadow-xl">
                    Delivered Fast
                  </span>
                </h1>

                <p className="text-xl text-white mb-8 max-w-lg drop-shadow-xl font-semibold">
                  Order from the best local restaurants with easy, on-demand delivery.
                  Fresh meals at your doorstep in minutes.
                </p>

                {/* Search / CTA */}
                <div className="flex flex-col sm:flex-row gap-3 mb-10 justify-center">
                  <Button
                    size="lg"
                    className="h-14 px-8 text-base shadow-lg hover:shadow-primary/25"
                    onClick={() => openAuth('user', 'signup')}
                  >
                    Start Ordering
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-14 px-8 text-base bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/30 hover:text-white shadow-lg"
                    onClick={() => openAuth('user', 'login')}
                  >
                    Sign in to continue
                  </Button>
                </div>

                {/* Scroll Down Indicator */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 1, repeat: Infinity, repeatType: "reverse" }}
                  className="flex flex-col items-center gap-2 text-white mt-12"
                >
                  <ChevronDown className="w-8 h-8 animate-bounce drop-shadow-md" />
                </motion.div>
              </motion.div>




            </div>
          </div>
        </section >

        {/* Stats Section with Floating Foods */}
        < StatsSection />

        {/* Features Section */}
        < section className="py-20 bg-secondary/30" >
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Choose <span className="text-primary">QuickEats</span>?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We're not just another food delivery app. We're your gateway to the best dining experience.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl p-6 border border-border hover:border-primary/50 hover:shadow-lg transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section >






        {/* Role Selection Section */}
        < section className="py-20" >
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Join the QuickEats Family
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Whether you want to order food, grow your restaurant, or earn as a delivery partner - we've got you covered.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {roles.map((role, index) => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="relative group"
                >
                  <div className="relative group bg-card rounded-3xl p-8 border border-border/50 hover:border-primary/30 shadow-lg hover:shadow-2xl transition-all duration-500 h-full overflow-hidden">
                    {/* Decorative Gradient Blob */}
                    <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${role.gradient} opacity-5 group-hover:opacity-10 rounded-full blur-3xl transition-opacity duration-500`} />
                    <div className={`absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr ${role.gradient} opacity-5 group-hover:opacity-10 rounded-full blur-3xl transition-opacity duration-500`} />

                    <div className="relative z-10 flex flex-col items-center text-center h-full">
                      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-primary/25 group-hover:scale-110 transition-all duration-300 ${(role as any).image ? '' : `bg-gradient-to-br ${role.gradient}`}`}>
                        {(role as any).image ? (
                          <img src={(role as any).image} alt={role.title} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          <role.icon className="w-8 h-8 text-primary-foreground" />
                        )}
                      </div>

                      <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">{role.title}</h3>
                      <p className="text-muted-foreground text-sm mb-8 leading-relaxed max-w-xs">{role.description}</p>

                      <div className="flex gap-3 w-full mt-auto">
                        <Button
                          variant="outline"
                          className="flex-1 border-primary/20 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-300"
                          onClick={() => openAuth(role.id, 'login')}
                        >
                          Sign in
                        </Button>
                        <Button
                          className="flex-1 shadow-md hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
                          onClick={() => openAuth(role.id, 'signup')}
                        >
                          Sign up
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section >

        {/* App Download CTA */}
        < section className="py-20 bg-gradient-primary relative overflow-hidden" >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0tNC00aC0ydi0yaDJ2MnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
                Join thousands of customers enjoying delicious food delivered right to their doorstep.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-14 px-8 text-base gap-2"
                  onClick={() => openAuth('user', 'signup')}
                >
                  <Smartphone className="w-5 h-5" />
                  Get Started Now
                </Button>
              </div>
            </motion.div>
          </div>
        </section >

        {/* Feedback Section Removed */}

        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* Footer */}
        <footer className="py-12 bg-secondary/50 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <img src={logoImage} alt="QuickEats Logo" className="h-10 w-10 object-contain" />
                <span className="text-xl font-bold text-foreground">
                  Quick<span className="text-primary">Eats</span>
                </span>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <button
                  onClick={() => openAuth('owner', 'signup')}
                  className="hover:text-foreground transition-colors"
                >
                  Partner with us
                </button>
                <button
                  onClick={() => openAuth('delivery', 'signup')}
                  className="hover:text-foreground transition-colors"
                >
                  Become a rider
                </button>
                <a
                  href="https://wa.me/917862885851?text=Hello! I have a question about QuickEats."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors font-medium text-primary"
                >
                  Need Help?
                </a>
              </div>

              <p className="text-sm text-muted-foreground">
                © 2026 QuickEats. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div >

      {/* Auth Modal */}
      < AuthModal
        isOpen={authModal.isOpen}
        onClose={closeAuth}
        role={authModal.role}
        initialMode={authModal.mode}
      />

      <ConnectSidePanel />

    </>
  );
}
