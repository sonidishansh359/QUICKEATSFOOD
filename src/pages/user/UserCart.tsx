import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  MapPin,
  CreditCard,
  Wallet,
  Banknote,
  ChevronRight,
  ShoppingBag,
  Home,
  Building,
  Target,
  Navigation,
  X,
  Loader2,
  AlertCircle,
  Clock,
  Check,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserData } from '@/contexts/UserDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type PaymentMethod = 'online' | 'cod';

const paymentMethods = [
  { id: 'online' as PaymentMethod, name: 'Pay Online', icon: CreditCard, description: 'Pay securely with Razorpay' },
  { id: 'cod' as PaymentMethod, name: 'Cash on Delivery', icon: Banknote, description: 'Pay when delivered' },
];

// Sample saved addresses (same as dashboard)
const savedAddresses = [];

// Safe JSON parse so malformed localStorage does not break the view
const safeParse = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Failed to parse stored address data:', error);
    return null;
  }
};

const fallbackAddress = {
  id: 'no-address',
  type: 'home',
  name: 'Add delivery address',
  address: 'Add a delivery address to continue',
  isDefault: true,
  isPlaceholder: true
};

// Get icon for address type
const getAddressIcon = (type) => {
  switch (type) {
    case 'home': return <Home className="w-5 h-5" />;
    case 'work': return <Building className="w-5 h-5" />;
    case 'current': return <Target className="w-5 h-5" />;
    default: return <MapPin className="w-5 h-5" />;
  }
};

export default function UserCart() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token } = useAuth();
  const { cart, updateCartQuantity, removeFromCart, placeOrder } = useUserData();

  // Address state
  const [deliveryAddress, setDeliveryAddress] = useState(() => {
    // Try to get from localStorage first
    const parsed = safeParse(localStorage.getItem('currentAddress'));
    return parsed || savedAddresses[0] || fallbackAddress;
  });

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [userAddresses, setUserAddresses] = useState(() => {
    const parsed = safeParse(localStorage.getItem('userAddresses'));
    return parsed || savedAddresses;
  });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [addressName, setAddressName] = useState('');
  const [addressType, setAddressType] = useState('home');

  // Payment and order state
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('online');
  const [isProcessing, setIsProcessing] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [taxRate, setTaxRate] = useState(0);

  useEffect(() => {
    // Fetch settings to get tax rate
    const fetchSettings = async () => {
      try {
        const API_ORIGIN = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';
        const API_BASE_URL = API_ORIGIN.endsWith('/api') ? API_ORIGIN : `${API_ORIGIN}/api`;
        const response = await fetch(`${API_BASE_URL}/settings`);
        if (response.ok) {
          const data = await response.json();
          if (data.taxRate !== undefined) {
            setTaxRate(data.taxRate);
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [availablePromos, setAvailablePromos] = useState<any[]>([]);

  // Fetch available promo codes for the restaurant
  useEffect(() => {
    const fetchPromoCodes = async () => {
      if (cart.length === 0) return;
      const restaurantId = cart[0]?.restaurantId;
      if (!restaurantId) return;

      try {
        const API_ORIGIN = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';
        const API_BASE_URL = API_ORIGIN.endsWith('/api') ? API_ORIGIN : `${API_ORIGIN}/api`;
        const response = await fetch(`${API_BASE_URL}/promo-codes/restaurant/${restaurantId}`);
        if (response.ok) {
          const codes = await response.json();
          setAvailablePromos(codes);
        }
      } catch (error) {
        console.error('Error fetching promo codes:', error);
      }
    };
    fetchPromoCodes();
  }, [cart]);

  // Calculate cart totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal > 25 ? 0 : 3.99;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxAmount = (subtotalAfterDiscount * taxRate) / 100;
  const total = subtotalAfterDiscount + deliveryFee + taxAmount;

  // Get user's live location
  const getLiveLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);
    setLiveLocation(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Use OpenStreetMap Nominatim API for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );

          if (!response.ok) {
            throw new Error('Failed to fetch address');
          }

          const data = await response.json();

          let addressString = '';
          if (data.address) {
            const addr = data.address;
            if (addr.road) addressString += addr.road + ', ';
            if (addr.suburb) addressString += addr.suburb + ', ';
            if (addr.city || addr.town || addr.village) {
              addressString += (addr.city || addr.town || addr.village) + ', ';
            }
            if (addr.state) addressString += addr.state;

            // If we couldn't construct a detailed address, use display name
            if (addressString.trim().length < 5) {
              addressString = data.display_name.split(',')[0] + ', ' + (addr.city || addr.town || 'Current Location');
            }
          } else {
            addressString = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
          }

          const liveLocationObj = {
            id: 'live-location',
            type: 'current',
            name: 'Current Location',
            address: addressString,
            isDefault: false,
            coordinates: { latitude, longitude },
            isNew: true
          };

          setLiveLocation(liveLocationObj);
          setDeliveryAddress(liveLocationObj);
          setIsGettingLocation(false);
          setShowAddressModal(false);

          // Save to localStorage
          localStorage.setItem('currentAddress', JSON.stringify(liveLocationObj));

          // Save location to backend
          try {
            const storedAuth = localStorage.getItem('quickeats_auth');
            if (storedAuth) {
              const { token } = JSON.parse(storedAuth);
              const API_ORIGIN = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
              const API_BASE_URL = typeof API_ORIGIN === 'string' && API_ORIGIN.endsWith('/api') ? API_ORIGIN : `${API_ORIGIN}/api`;
              await fetch(`${API_BASE_URL}/locations/user`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  latitude,
                  longitude,
                  address: addressString
                })
              });
            }
          } catch (error) {
            console.error('Error saving location to backend:', error);
            // Don't show error to user as this is not critical
          }

          // Show success toast
          toast({
            title: 'Location Updated',
            description: 'Using your current location for delivery',
          });

        } catch (error) {
          console.error('Geocoding error:', error);
          setLocationError('Could not get address details for your location');
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Failed to get your location. ';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please enable location permissions in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
        }

        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Address management functions
  const handleAddressSelect = (address) => {
    setDeliveryAddress(address);
    setShowAddressModal(false);

    // Save to localStorage
    localStorage.setItem('currentAddress', JSON.stringify(address));

    toast({
      title: 'Address Updated',
      description: `Delivering to ${address.name}`,
    });
  };

  const handleSetDefault = (addressId) => {
    const updatedAddresses = userAddresses.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    }));
    setUserAddresses(updatedAddresses);

    // Save to localStorage
    localStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));

    if (deliveryAddress && deliveryAddress.id === addressId) {
      const updatedAddress = { ...deliveryAddress, isDefault: true };
      setDeliveryAddress(updatedAddress);
      localStorage.setItem('currentAddress', JSON.stringify(updatedAddress));
    }
  };

  const handleAddNewAddress = () => {
    if (!newAddress.trim() || !addressName.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    const newAddressObj = {
      id: Date.now(), // Use timestamp as unique ID
      type: addressType,
      name: addressName,
      address: newAddress,
      isDefault: false,
      isNew: true
    };

    const updatedAddresses = [...userAddresses, newAddressObj];
    setUserAddresses(updatedAddresses);
    setDeliveryAddress(newAddressObj);
    setNewAddress('');
    setAddressName('');
    setAddressType('home');
    setIsAddingNewAddress(false);
    setShowAddressModal(false);

    // Save to localStorage
    localStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));
    localStorage.setItem('currentAddress', JSON.stringify(newAddressObj));

    toast({
      title: 'Address Saved',
      description: `Added "${addressName}" to your saved addresses`,
    });
  };

  // Handle promo code validation
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    setIsValidatingPromo(true);
    setPromoError('');

    try {
      const restaurantId = cart[0]?.restaurantId;

      // Normalize API base URL to always include '/api'
      const API_BASE_URL = (() => {
        const base = (import.meta as any).env?.VITE_API_URL as string | undefined;
        if (!base) return 'http://localhost:5000/api';
        return base.endsWith('/api') ? base : `${base}/api`;
      })();

      const response = await fetch(`${API_BASE_URL}/promo-codes/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: promoCode.toUpperCase(),
          restaurantId,
          orderAmount: subtotal
        })
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setPromoError(data.message || 'Invalid promo code');
        setAppliedPromo(null);
        setDiscountAmount(0);
      } else {
        setAppliedPromo(data.promoCode);
        setDiscountAmount(data.promoCode.discountAmount);
        setPromoError('');
        toast({
          title: 'Promo Code Applied!',
          description: `You saved ₹${data.promoCode.discountAmount.toFixed(2)}`,
        });
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      setPromoError('Failed to validate promo code');
      setAppliedPromo(null);
      setDiscountAmount(0);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleApplyPromoForCode = async (codeToApply: string) => {
    if (!codeToApply.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    setIsValidatingPromo(true);
    setPromoError('');

    try {
      const restaurantId = cart[0]?.restaurantId;

      // Normalize API base URL to always include '/api'
      const API_BASE_URL = (() => {
        const base = (import.meta as any).env?.VITE_API_URL as string | undefined;
        if (!base) return 'http://localhost:5000/api';
        return base.endsWith('/api') ? base : `${base}/api`;
      })();

      const response = await fetch(`${API_BASE_URL}/promo-codes/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: codeToApply.toUpperCase(),
          restaurantId,
          orderAmount: subtotal
        })
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setPromoError(data.message || 'Invalid promo code');
        setAppliedPromo(null);
        setDiscountAmount(0);
      } else {
        setAppliedPromo(data.promoCode);
        setDiscountAmount(data.promoCode.discountAmount);
        setPromoCode(data.promoCode.code);
        setPromoError('');
        toast({
          title: 'Promo Code Applied!',
          description: `You saved ₹${data.promoCode.discountAmount.toFixed(2)}`,
        });
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      setPromoError('Failed to validate promo code');
      setAppliedPromo(null);
      setDiscountAmount(0);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setAppliedPromo(null);
    setDiscountAmount(0);
    setPromoError('');
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Add items to your cart first',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const API_ORIGIN = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
      const API_BASE_URL = typeof API_ORIGIN === 'string' && API_ORIGIN.endsWith('/api') ? API_ORIGIN : `${API_ORIGIN}/api`;

      if (selectedPayment === 'online') {
        // Create Razorpay order
        const response = await fetch(`${API_BASE_URL}/payments/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ amount: total, currency: 'INR' })
        });

        if (!response.ok) {
          throw new Error('Failed to create payment order');
        }

        const orderData = await response.json();

        const options = {
          key: 'rzp_test_S9BytsU7SUZ08R', // Enter the Key ID generated from the Dashboard
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'QuickEats',
          description: 'Food Order Payment',
          order_id: orderData.id,
          handler: async function (response: any) {
            try {
              // Verify payment on backend
              const verifyResponse = await fetch(`${API_BASE_URL}/payments/verify`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });

              if (!verifyResponse.ok) {
                throw new Error('Payment verification failed');
              }

              // Place order after successful payment
              const order = await placeOrder(
                deliveryAddress.address,
                selectedPayment,
                specialInstructions,
                appliedPromo?.id,
                subtotal,
                {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature
                },
                taxAmount
              );

              setIsProcessing(false);

              toast({
                title: 'Order placed successfully!',
                description: `Order successfully paid and placed.`,
              });

              navigate('/user/checkout-success', {
                state: {
                  order,
                  deliveryAddress: deliveryAddress.address,
                  estimatedDelivery: '15-25 minutes'
                }
              });
            } catch (error) {
              console.error('Payment verification or order placement failed:', error);
              setIsProcessing(false);
              toast({
                title: 'Order Failed',
                description: 'Payment successful but order placement failed. Please contact support.',
                variant: 'destructive',
              });
            }
          },
          prefill: {
            name: "User Name", // You can get this from user context if available
            email: "user@example.com",
            contact: "9999999999"
          },
          theme: {
            color: "#3399cc"
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
              toast({
                title: 'Payment Cancelled',
                description: 'You cancelled the payment process.',
                variant: 'destructive',
              });
            }
          }
        };

        const rzp1 = new (window as any).Razorpay(options);
        rzp1.open();
        rzp1.on('payment.failed', function (response: any) {
          setIsProcessing(false);
          toast({
            title: 'Payment Failed',
            description: response.error.description || 'Payment failed',
            variant: 'destructive',
          });
        });

      } else {
        // COD
        // Simulate processing for COD
        await new Promise(resolve => setTimeout(resolve, 1000));

        const order = await placeOrder(deliveryAddress.address, selectedPayment, specialInstructions, appliedPromo?.id, subtotal, undefined, taxAmount);

        setIsProcessing(false);

        toast({
          title: 'Order placed successfully!',
          description: `Order #${order.id.slice(-6)} is being prepared`,
        });

        navigate('/user/checkout-success', {
          state: {
            order,
            deliveryAddress: deliveryAddress.address,
            estimatedDelivery: '15-25 minutes'
          }
        });
      }
    } catch (error) {
      console.error('Order placement error:', error);
      setIsProcessing(false);
      toast({
        title: 'Order Failed',
        description: 'Failed to place order. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add some delicious food to get started</p>
          <Button onClick={() => navigate('/user/restaurants')}>
            Browse Restaurants
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-8">
      {/* Address Change Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col"
          >
            {/* Header - Fixed */}
            <div className="p-6 border-b border-border flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Select Delivery Address</h2>
                <button
                  onClick={() => {
                    setShowAddressModal(false);
                    setIsAddingNewAddress(false);
                    setNewAddress('');
                    setAddressName('');
                  }}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Live Location Section */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Current Location
                </h3>
                <div className="space-y-3">
                  {liveLocation ? (
                    <div
                      className={`group p-4 rounded-xl border transition-all duration-200 ${deliveryAddress.id === 'live-location'
                        ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10 shadow-sm'
                        : 'border-border hover:border-green-400 hover:bg-secondary hover:shadow-sm cursor-pointer'
                        }`}
                      onClick={() => handleAddressSelect(liveLocation)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2.5 rounded-lg transition-all ${deliveryAddress.id === 'live-location'
                            ? 'bg-green-500 text-white shadow-sm'
                            : 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400 group-hover:bg-green-500 group-hover:text-white'
                            }`}>
                            <Target className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground">
                                {liveLocation.name}
                              </span>
                              <span className="px-2 py-0.5 bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-medium rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                Live
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{liveLocation.address}</p>
                            <div className="flex items-center gap-1.5 mt-2">
                              <Clock className="w-3 h-3 text-green-600 dark:text-green-400" />
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                Updated just now
                              </span>
                            </div>
                          </div>
                        </div>
                        {deliveryAddress.id === 'live-location' && (
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 animate-in zoom-in">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={getLiveLocation}
                      disabled={isGettingLocation}
                      className={`w-full p-4 rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-3 ${isGettingLocation
                        ? 'border-border bg-secondary cursor-not-allowed'
                        : 'border-green-200 hover:border-green-300 hover:bg-secondary hover:border-solid'
                        }`}
                    >
                      {isGettingLocation ? (
                        <>
                          <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
                          <div className="text-center">
                            <p className="font-medium text-foreground">Getting your location...</p>
                            <p className="text-xs text-muted-foreground mt-1">Please wait</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                            <Navigation className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-foreground">Use Current Location</p>
                            <p className="text-xs text-muted-foreground mt-1">Tap to detect your live location</p>
                          </div>
                        </>
                      )}
                    </button>
                  )}

                  {locationError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700 dark:text-red-400">{locationError}</p>
                      </div>
                      <button
                        onClick={() => setLocationError(null)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium mt-2"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Saved Addresses */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Saved Addresses
                </h3>
                <div className="space-y-3">
                  {userAddresses.map((address) => (
                    <div
                      key={address.id}
                      className={`group p-4 rounded-xl border transition-all duration-200 ${deliveryAddress.id === address.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/50 hover:bg-secondary hover:shadow-sm cursor-pointer'
                        }`}
                      onClick={() => handleAddressSelect(address)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2.5 rounded-lg transition-colors ${deliveryAddress.id === address.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                            }`}>
                            {getAddressIcon(address.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground">{address.name}</span>
                              {address.isDefault && (
                                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                                  Default
                                </span>
                              )}
                              {address.isNew && (
                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{address.address}</p>
                          </div>
                        </div>
                        {deliveryAddress.id === address.id && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 animate-in zoom-in">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>

                      {!address.isDefault && (
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetDefault(address.id);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Set as Default
                          </button>
                          {address.coordinates && (
                            <>
                              <span className="text-muted-foreground/50">•</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const { latitude, longitude } = address.coordinates;
                                  window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
                                }}
                                className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium flex items-center gap-1.5 transition-colors"
                              >
                                <MapPin className="w-3.5 h-3.5" />
                                View on Map
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      {address.isDefault && address.coordinates && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const { latitude, longitude } = address.coordinates;
                              window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
                            }}
                            className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            View on Map
                          </button>
                        </div>
                      )}
                    </div>
                  ))}              </div>
              </div>

              {/* Add New Address Section */}
              <div>
                {isAddingNewAddress ? (
                  <div className="space-y-4 border-t border-border pt-6">
                    <h3 className="font-medium text-foreground">Add New Address</h3>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Address Name
                        </label>
                        <input
                          type="text"
                          value={addressName}
                          onChange={(e) => setAddressName(e.target.value)}
                          placeholder="e.g., Home, Office, Gym"
                          className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Address Type
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {['home', 'work', 'other'].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setAddressType(type)}
                              className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-colors ${addressType === type
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border hover:border-primary/50'
                                }`}
                            >
                              <div className="text-muted-foreground">{getAddressIcon(type)}</div>
                              <span className="text-xs font-medium capitalize">{type}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-medium text-foreground">
                            Full Address
                          </label>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!navigator.geolocation) {
                                toast({
                                  title: 'Location not supported',
                                  description: 'Your browser does not support geolocation',
                                  variant: 'destructive',
                                });
                                return;
                              }

                              navigator.geolocation.getCurrentPosition(
                                async (position) => {
                                  const { latitude, longitude } = position.coords;
                                  try {
                                    const response = await fetch(
                                      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
                                    );
                                    const data = await response.json();
                                    if (data.display_name) {
                                      setNewAddress(data.display_name);
                                      toast({
                                        title: 'Location detected',
                                        description: 'Address auto-filled from current location',
                                      });
                                    }
                                  } catch (error) {
                                    toast({
                                      title: 'Error',
                                      description: 'Could not get address from location',
                                      variant: 'destructive',
                                    });
                                  }
                                },
                                () => {
                                  toast({
                                    title: 'Permission denied',
                                    description: 'Please enable location permissions',
                                    variant: 'destructive',
                                  });
                                }
                              );
                            }}
                            className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                          >
                            <Target className="w-3 h-3" />
                            Use GPS
                          </button>
                        </div>
                        <textarea
                          value={newAddress}
                          onChange={(e) => setNewAddress(e.target.value)}
                          placeholder="Enter your full address including street, city, and zip code"
                          rows={3}
                          className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleAddNewAddress}
                        disabled={!newAddress.trim() || !addressName.trim()}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${!newAddress.trim() || !addressName.trim()
                          ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                          : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                          }`}
                      >
                        Save Address
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNewAddress(false);
                          setNewAddress('');
                          setAddressName('');
                          setAddressType('home');
                        }}
                        className="flex-1 py-2 px-4 border border-border rounded-lg font-medium text-foreground hover:bg-secondary transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingNewAddress(true)}
                    className="w-full py-4 bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 text-primary border-2 border-dashed border-primary/30 hover:border-primary/50 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 group"
                  >
                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Add New Address</span>
                  </button>
                )}
              </div>
            </div>

            {/* Footer - Fixed */}
            {!isAddingNewAddress && (
              <div className="p-6 border-t border-border flex-shrink-0">
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Deliver to {deliveryAddress.name}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-16 bg-card/95 backdrop-blur-md border-b border-border z-30">
        <div className="px-4 lg:px-8 py-4 flex items-center gap-4 max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Your Cart</h1>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto">
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Cart Items & Delivery */}
          <div className="lg:col-span-3 space-y-6">
            {/* Cart Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-foreground">
                  {cart[0]?.restaurantName || 'Your Items'}
                </h2>
              </div>
              <div className="divide-y divide-border">
                {cart.map(item => (
                  <div key={item.menuItemId} className="p-4 flex gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">₹{item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => removeFromCart(item.menuItemId)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQuantity(item.menuItemId, item.quantity - 1)}
                          className="w-7 h-7 rounded bg-secondary flex items-center justify-center hover:bg-secondary/80"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.menuItemId, item.quantity + 1)}
                          className="w-7 h-7 rounded bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Delivery Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-foreground">Delivery Address</h2>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="text-sm text-primary font-medium"
                >
                  Change
                </button>
              </div>
              <div className={`flex items-start gap-3 p-3 rounded-lg ${deliveryAddress.type === 'current'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200'
                : 'bg-secondary'
                }`}>
                <div className={`p-2 rounded-lg ${deliveryAddress.type === 'current'
                  ? 'bg-green-100 text-green-600 dark:bg-green-900'
                  : 'bg-primary/10 text-primary'
                  }`}>
                  {getAddressIcon(deliveryAddress.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-foreground">{deliveryAddress.name}</p>
                    {deliveryAddress.isDefault && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Default
                      </span>
                    )}
                    {deliveryAddress.type === 'current' && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full animate-pulse">
                        📍 Live
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{deliveryAddress.address}</p>

                  {/* Delivery Time Estimate */}
                  <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Estimated delivery:</span>
                    <span className="font-medium text-foreground">30-40 minutes</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Payment Method */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <h2 className="font-semibold text-foreground mb-4">Payment Method</h2>
              <div className="space-y-3">
                {paymentMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={cn(
                      'w-full flex items-center gap-4 p-3 rounded-xl border transition-colors',
                      selectedPayment === method.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-secondary/50'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      selectedPayment === method.id ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                    )}>
                      <method.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-foreground">{method.name}</p>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2',
                      selectedPayment === method.id
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    )}>
                      {selectedPayment === method.id && (
                        <div className="w-full h-full rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Special Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h2 className="font-semibold text-foreground mb-4">Special Instructions</h2>
              <p className="text-sm text-muted-foreground mb-3">
                Add any special requests for your order (e.g., "Make it spicy", "No onions")
              </p>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Enter your instructions here..."
                className="w-full min-h-[100px] px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {specialInstructions.length}/200 characters
              </p>
            </motion.div>

            {/* Promo Code */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.27 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Promo Code
              </h2>

              {appliedPromo ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-mono font-bold text-green-700 dark:text-green-400">{appliedPromo.code}</p>
                      <p className="text-sm text-green-600 dark:text-green-500">{appliedPromo.discountPercentage}% discount applied</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemovePromo}
                      className="text-green-600 hover:text-green-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    You save ₹{appliedPromo.discountAmount.toFixed(2)}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        setPromoError('');
                      }}
                      className="uppercase"
                      disabled={isValidatingPromo}
                    />
                    <Button
                      onClick={handleApplyPromo}
                      disabled={isValidatingPromo || !promoCode.trim()}
                      variant="outline"
                      className="px-6"
                    >
                      {isValidatingPromo ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Apply'
                      )}
                    </Button>
                  </div>
                  {promoError && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {promoError}
                    </p>
                  )}
                  {availablePromos.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Available Offers</h3>
                      <div className="space-y-3">
                        {availablePromos.map(promo => (
                          <div key={promo._id || promo.id} className="border border-green-200 bg-green-50/30 rounded-lg p-3 relative overflow-hidden flex justify-between items-center group">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                            <div className="flex-1 pl-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded text-sm tracking-wider border border-green-200 border-dashed">
                                  {promo.code}
                                </span>
                              </div>
                              <p className="text-sm text-foreground flex items-center gap-1">
                                <span className="font-semibold">{promo.discountPercentage}% OFF</span>
                              </p>
                              {promo.minOrderAmount > 0 && (
                                <p className="text-xs text-muted-foreground mt-0.5">On orders above ₹{promo.minOrderAmount.toFixed(0)}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-100 shrink-0 ml-3"
                              onClick={() => {
                                setPromoCode(promo.code);
                                // The apply process will start immediately after setting the code
                                // by hooking into the next render or by calling validation directly.
                                // Let's call validation directly but wait for state to update
                                setTimeout(() => handleApplyPromoForCode(promo.code), 0);
                              }}
                            >
                              Apply
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="bg-card border border-border rounded-xl p-6 sticky top-36">
              <h2 className="font-semibold text-foreground mb-4">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span className="text-foreground">₹{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-500">
                    <span className="text-muted-foreground">Discount {appliedPromo && `(${appliedPromo.code})`}</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span className={deliveryFee === 0 ? 'text-green-600 dark:text-green-500' : 'text-foreground'}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
                  </span>
                </div>
                {taxRate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                    <span className="text-foreground">₹{taxAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="h-px bg-border my-4" />
                <div className="flex justify-between text-base font-semibold">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">₹{total.toFixed(2)}</span>
                </div>
              </div>

              {subtotal < 25 && (
                <div className="mt-4 p-3 bg-secondary rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    Add <span className="font-bold text-primary">₹{(25 - subtotal).toFixed(2)}</span> more for free delivery
                  </p>
                </div>
              )}

              <Button
                className="w-full mt-6 h-12"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Place Order • ₹${total.toFixed(2)}`
                )}
              </Button>

              {/* Order Protection */}
              <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  ✓ Your order is protected with secure payment
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ✓ Delivery to: {deliveryAddress.address.split(',')[0]}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
