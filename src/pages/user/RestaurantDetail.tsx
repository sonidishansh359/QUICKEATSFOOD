import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  Clock,
  MapPin,
  Phone,
  Plus,
  Minus,
  ShoppingCart,
  Leaf,
  Utensils,
  Menu as MenuIcon,
  X,
  Check,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserData } from '@/contexts/UserDataContext';
import { useToast } from '@/hooks/use-toast';
import { getRestaurantStatus } from '@/utils/restaurantStatus';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getRestaurantById, addToCart, updateCartQuantity, cart } = useUserData();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Zomato style toggle states
  const [vegMode, setVegMode] = useState(false);
  const [nonVegMode, setNonVegMode] = useState(false);
  const [localMenuItems, setLocalMenuItems] = useState<any[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Computed Mode
  const dietaryMode = (vegMode && nonVegMode) || (!vegMode && !nonVegMode) ? 'All' : (vegMode ? 'Veg' : 'NonVeg');

  useEffect(() => {
    // Reset category filter if it no longer exists after dietary filter applies
    setSelectedCategory('All');
  }, [dietaryMode]);

  useEffect(() => {
    if (!id) return;
    const fetchMenu = async () => {
      setIsLoadingMenu(true);
      try {
        const query = dietaryMode !== 'All' ? `?dietaryType=${dietaryMode}` : '';
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/menu/restaurant/${id}${query}`);
        if (res.ok) {
          const data = await res.json();
          setLocalMenuItems(data);
        }
      } catch (error) {
        console.error("Failed to fetch menu", error);
      } finally {
        setIsLoadingMenu(false);
      }
    };
    fetchMenu();
  }, [id, dietaryMode]);


  const restaurant = getRestaurantById(id || '');

  const status = restaurant ? getRestaurantStatus(
    restaurant.openTime || '',
    restaurant.closeTime || '',
    30,
    undefined,
    restaurant.openingPeriod,
    restaurant.closingPeriod
  ) : 'CLOSED';
  const isOpen = status === 'OPEN' || status === 'CLOSING_SOON';

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Restaurant not found</h2>
          <Button onClick={() => navigate('/user/restaurants')}>Browse Restaurants</Button>
        </div>
      </div>
    );
  }

  const categories = ['All', ...new Set(localMenuItems.map(item => item.category))];
  const filteredItems = selectedCategory === 'All'
    ? localMenuItems
    : localMenuItems.filter(item => item.category === selectedCategory);

  const getCartQuantity = (itemId: string) => {
    const cartItem = cart.find(c => c.menuItemId === itemId);
    return cartItem?.quantity || 0;
  };

  const handleAddToCart = (item: any) => {
    if (!isOpen) {
      toast({
        title: "Restaurant Closed",
        description: "This restaurant is currently closed.",
        variant: "destructive",
      });
      return;
    }
    addToCart(item, restaurant.id, restaurant.name);
    toast({
      title: 'Added to cart',
      description: `${item.name} added to your cart`,
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-success/10 text-success';
      case 'CLOSING_SOON': return 'bg-destructive/10 text-destructive';
      case 'OPENING_SOON': return 'bg-yellow-500/10 text-yellow-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'OPEN': return 'Open';
      case 'CLOSING_SOON': return 'Closing Soon';
      case 'OPENING_SOON': return 'Opening Soon';
      default: return 'Closed';
    }
  };

  return (
    <div className="pb-24 lg:pb-8">
      {/* Header Image */}
      <div className="relative h-48 lg:h-64">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Restaurant Info */}
      <div className="px-4 lg:px-8 -mt-16 relative z-10 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">{restaurant.name}</h1>
              <p className="text-muted-foreground">{restaurant.cuisine}</p>
            </div>
            <span className={cn(
              'px-3 py-1 text-sm font-medium rounded-full',
              getStatusColor(status)
            )}>
              {getStatusText(status)}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-sm mb-4">
            <span className="flex items-center gap-1 text-foreground">
              <Star className="w-4 h-4 text-warning fill-warning" />
              {restaurant.rating} Rating
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              {restaurant.deliveryTime}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Phone className="w-4 h-4" />
              {restaurant.phone}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            {restaurant.address}
          </div>

          <p className="text-muted-foreground mt-4 text-sm">{restaurant.description}</p>
        </motion.div>

        {/* Dietary Toggle (Zomato Style) */}
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={() => setVegMode(!vegMode)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-medium",
              vegMode ? "bg-green-50 border-green-200 text-green-700 shadow-sm" : "bg-white border-border text-foreground hover:bg-muted"
            )}
          >
            <span className="w-4 h-4 rounded-sm border-2 border-green-600 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
            </span>
            Veg
          </button>

          <button
            onClick={() => setNonVegMode(!nonVegMode)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-medium",
              nonVegMode ? "bg-red-50 border-red-200 text-red-700 shadow-sm" : "bg-white border-border text-foreground hover:bg-muted"
            )}
          >
            <span className="w-4 h-4 rounded-sm border-2 border-red-600 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            </span>
            Non-Veg
          </button>
        </div>

        {/* Category Tabs */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Items */}
        <div className="mt-6 space-y-4">
          {isLoadingMenu ? (
            <div className="flex justify-center p-8">
              <span className="text-muted-foreground animate-pulse text-lg font-medium">Loading Menu...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl border-dashed bg-muted/20">
              <Utensils className="w-10 h-10 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-foreground mb-1">No items found</h3>
              <p className="text-muted-foreground">Try adjusting your dietary preferences or category.</p>
            </div>
          ) : (
            filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'bg-card border border-border rounded-xl p-4 flex gap-4 relative group',
                  !item.isAvailable && 'opacity-50'
                )}
              >
                {/* Share Button Placeholder */}
                <button
                  onClick={async () => {
                    const shareUrl = window.location.href;
                    const shareTitle = `${item.name} from ${restaurant.name}`;
                    const shareText = `Check out this amazing ${item.name} for just ₹${item.price.toFixed(2)} at ${restaurant.name}!`;

                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: shareTitle,
                          text: shareText,
                          url: shareUrl,
                        });
                      } catch (error) {
                        console.error('Error sharing:', error);
                      }
                    } else {
                      // Fallback: Copy to clipboard
                      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                      toast({
                        title: "Link Copied!",
                        description: "Item details copied to clipboard to share.",
                      });
                    }
                  }}
                  className="absolute top-4 right-4 p-2.5 rounded-full bg-secondary text-secondary-foreground transition-all duration-300 hover:bg-primary hover:text-primary-foreground shadow-sm hover:scale-105 active:scale-95 z-10"
                  aria-label={`Share ${item.name}`}
                  title="Share Item"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <div className="relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 rounded-xl object-cover"
                  />
                  {item.dietaryType === 'Veg' ? (
                    <span className="absolute top-1 left-1 w-5 h-5 bg-white border border-green-200 rounded flex items-center justify-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-600" />
                    </span>
                  ) : (
                    <span className="absolute top-1 left-1 w-5 h-5 bg-white border border-red-200 rounded flex items-center justify-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between pr-10">
                    <div>
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 pr-2">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-foreground">₹{item.price.toFixed(2)}</span>
                    {item.isAvailable ? (
                      getCartQuantity(item.id) > 0 ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const current = getCartQuantity(item.id);
                              if (current > 0) {
                                updateCartQuantity(item.id, current - 1);
                              }
                            }}
                            className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{getCartQuantity(item.id)}</span>
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(item)}
                          className="gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </Button>
                      )
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-md uppercase tracking-wide">
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-20 lg:bottom-8 left-4 right-4 lg:left-auto lg:right-8 lg:w-80 z-50"
        >
          <Button
            onClick={() => {
              if (!isOpen) {
                toast({
                  title: "Restaurant Closed",
                  description: "This restaurant is currently closed. You cannot place orders.",
                  variant: "destructive"
                });
                return;
              }
              navigate('/user/cart');
            }}
            className={cn(
              "w-full h-14 gap-3 shadow-xl",
              !isOpen && "opacity-75 cursor-not-allowed bg-gray-500 hover:bg-gray-600"
            )}
            size="lg"
            disabled={!isOpen}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span>{cartCount} items</span>
            </div>
            <span className="ml-auto font-bold">
              {isOpen ? `₹${cartTotal.toFixed(2)}` : 'Closed'}
            </span>
          </Button>
        </motion.div>
      )}

      {/* Floating Menu Button & Popover */}
      {localMenuItems.length > 0 && (
        <div
          className={cn(
            "fixed right-6 z-50 flex flex-col items-end gap-4 pointer-events-none",
            cartCount > 0 ? "bottom-[140px] lg:bottom-28" : "bottom-8 lg:bottom-10"
          )}
        >
          {/* Menu Popover */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.8, y: 10, filter: 'blur(10px)' }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                className="bg-card/95 backdrop-blur-3xl rounded-3xl shadow-2xl shadow-primary/20 overflow-hidden border border-border w-72 sm:w-80 origin-bottom-right pointer-events-auto"
              >
                {/* Header Gradient Layout */}
                <div className="bg-primary/5 p-6 pb-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[40px] -mr-16 -mt-16" />
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2.5 bg-primary/10 backdrop-blur-md rounded-2xl text-primary shadow-inner">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <span className="text-2xl font-black text-foreground tracking-tight">
                      Menu
                    </span>
                  </div>
                </div>

                {/* Category List */}
                <div className="p-3 pt-0 max-h-[50vh] overflow-y-auto scrollbar-hide space-y-1.5 relative z-10">
                  {categories.map((category, index) => {
                    const count = category === 'All'
                      ? localMenuItems.length
                      : localMenuItems.filter(i => i.category === category).length;

                    const isSelected = selectedCategory === category;

                    return (
                      <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 + 0.05 }}
                        key={category}
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsMenuOpen(false);
                          // Scroll to the top of the menu items section smoothly
                          window.scrollTo({ top: 400, behavior: 'smooth' });
                        }}
                        className={cn(
                          "w-full flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 relative group overflow-hidden border",
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-primary"
                            : "bg-transparent hover:bg-muted border-transparent text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-4 relative z-10 w-full">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm",
                            isSelected
                              ? "bg-white/20 text-white scale-110"
                              : "bg-secondary text-primary group-hover:bg-primary/20"
                          )}>
                            {category === 'All' ? <Utensils className="w-4 h-4" /> : <Leaf className="w-4 h-4" />}
                          </div>

                          <div className="flex-1 text-left">
                            <span className={cn(
                              "block text-base font-extrabold tracking-tight transition-transform duration-300",
                              !isSelected && "group-hover:translate-x-1"
                            )}>
                              {category}
                            </span>
                            <span className={cn(
                              "text-[11px] font-bold uppercase tracking-wider",
                              isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                            )}>
                              {count} item{count !== 1 && 's'}
                            </span>
                          </div>

                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="bg-white/20 text-white rounded-full p-1"
                            >
                              <Check className="w-4 h-4" />
                            </motion.div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              size="lg"
              className={cn(
                "rounded-full shadow-2xl h-[60px] pl-5 pr-6 gap-3 transition-colors border",
                isMenuOpen
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border shadow-black/10"
                  : "bg-primary text-primary-foreground hover:bg-primary/95 shadow-primary/40 border-primary/20"
              )}
            >
              <motion.div
                initial={false}
                animate={{ rotate: isMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
              </motion.div>
              <span className="font-bold text-sm uppercase tracking-[0.2em] mt-0.5">
                {isMenuOpen ? 'Close' : 'Menu'}
              </span>
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
