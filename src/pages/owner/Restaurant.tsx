import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useOwnerData } from '@/contexts/OwnerDataContext';
import { useAutoLocation } from '@/hooks/useAutoLocation';
import { Restaurant } from '@/types/auth';
import { Plus, Edit, MapPin, Clock, Phone, Upload, X, Store, Utensils, Star, CheckCircle2, ShieldAlert } from 'lucide-react';
import { getRestaurantStatus } from '@/utils/restaurantStatus';
import { cn } from '@/lib/utils';
import BurgerImg from '@/assets/burger.png';
import IceCreamImg from '@/assets/icecream.png';
import ChineseImg from '@/assets/chinese.png';
import DrinksImg from '@/assets/drinks.png';

const RestaurantPage: React.FC = () => {
  const { restaurants, updateRestaurant, toggleRestaurantOpen, addRestaurant } = useOwnerData();
  const { location } = useAutoLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    cuisine: string;
    address: string;
    phone: string;
    openingTime: string;
    openingPeriod: 'AM' | 'PM';
    closingTime: string;
    closingPeriod: 'AM' | 'PM';
  }>({
    name: '',
    description: '',
    cuisine: '',
    address: '',
    phone: '',
    openingTime: '10:00',
    openingPeriod: 'AM',
    closingTime: '10:00',
    closingPeriod: 'PM',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Auto-fill address when dialog opens and live location is available
  useEffect(() => {
    if (isAddDialogOpen && location?.address && !editingRestaurant && !formData.address) {
      setFormData(prev => ({
        ...prev,
        address: location.address || ''
      }));
    }
  }, [isAddDialogOpen, location?.address, editingRestaurant]);

  const categories = [
    'Pizza', 'Burgers', 'Sushi', 'Indian', 'Chinese', 'Mexican', 'Italian',
    'Desserts', 'Coffee', 'Healthy', 'Breakfast', 'Gujarati',
    'Punjabi', 'South Indian', 'Kathiyawadi'
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedHour = h % 12 || 12;
    return `${formattedHour}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  const getTimeParts = (timeStr: string) => {
    if (!timeStr) return { hour: '12', minute: '00' };
    const [h, m] = timeStr.split(':');
    return { hour: h || '12', minute: m || '00' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.address || !formData.cuisine || !formData.phone) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate image is required
    if (!selectedImage && !editingRestaurant) {
      alert('Restaurant image is required');
      return;
    }

    if (editingRestaurant) {
      // Update existing restaurant using context
      await updateRestaurant({
        id: editingRestaurant.id,
        name: formData.name,
        description: formData.description,
        cuisine: formData.cuisine,
        address: formData.address,
        phone: formData.phone,
        // Using formatted time range for display purposes if needed, strictly 24h for fields
        openingTime: formData.openingTime,
        openingPeriod: formData.openingPeriod,
        closingTime: formData.closingTime,
        closingPeriod: formData.closingPeriod,
      });
      setEditingRestaurant(null);
    } else {
      // Add new restaurant using context
      // Use imagePreview (Base64) if available, otherwise use existing image
      const imageToUse = imagePreview || '';

      // Include location coordinates from owner's live location
      const restaurantData: any = {
        name: formData.name,
        description: formData.description,
        cuisine: formData.cuisine,
        address: formData.address,
        phone: formData.phone,
        image: imageToUse,
        rating: 0,
        deliveryTime: '30-45 min', // Default duration instead of opening hours
        minOrder: 10, // Default
        openingTime: formData.openingTime,
        openingPeriod: formData.openingPeriod,
        closingTime: formData.closingTime,
        closingPeriod: formData.closingPeriod,
      };

      // Add location coordinates if available
      if (location?.latitude !== undefined && location?.longitude !== undefined) {
        restaurantData.latitude = location.latitude;
        restaurantData.longitude = location.longitude;
        console.log(`✅ Sending restaurant with location: [${location.longitude}, ${location.latitude}]`);
      } else {
        console.warn('⚠️ No location available - restaurant will be created without coordinates');
      }

      await addRestaurant(restaurantData);
    }

    setFormData({
      name: '',
      description: '',
      cuisine: '',
      address: '',
      phone: '',
      openingTime: '10:00',
      openingPeriod: 'AM',
      closingTime: '10:00',
      closingPeriod: 'PM',
    });
    setSelectedImage(null);
    setImagePreview(null);
    setIsAddDialogOpen(false);
  };

  const handleEdit = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setFormData({
      name: restaurant.name,
      description: restaurant.description || '',
      cuisine: restaurant.cuisine || '',
      address: restaurant.address || '',
      phone: restaurant.phone || '',
      openingTime: restaurant.openingTime || '',
      openingPeriod: (restaurant.openingPeriod as 'AM' | 'PM') || 'AM',
      closingTime: restaurant.closingTime || '',
      closingPeriod: (restaurant.closingPeriod as 'AM' | 'PM') || 'PM',
    });
    setIsAddDialogOpen(true);
  };



  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-10 space-y-8 relative overflow-hidden">
      {/* Floating Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.img
          src={BurgerImg}
          alt="Floating Burger"
          initial={{ opacity: 0, x: -100, y: 100, rotate: -20 }}
          animate={{
            opacity: 0.1,
            x: [0, 50, 0],
            y: [0, -30, 0],
            rotate: [-20, 0, -20]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-10 w-32 h-32 object-contain"
        />
        <motion.img
          src={IceCreamImg}
          alt="Floating Ice Cream"
          initial={{ opacity: 0, x: 100, y: -100, rotate: 15 }}
          animate={{
            opacity: 0.08,
            x: [0, -40, 0],
            y: [0, 50, 0],
            rotate: [15, 30, 15]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute top-40 right-20 w-24 h-24 object-contain"
        />
        <motion.img
          src={ChineseImg}
          alt="Floating Chinese Food"
          initial={{ opacity: 0, y: 100, rotate: -10 }}
          animate={{
            opacity: 0.08,
            y: [0, -60, 0],
            rotate: [-10, 10, -10]
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
          className="absolute bottom-20 left-1/4 w-40 h-40 object-contain"
        />
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            Restaurant Management
            <Badge variant="secondary" className="text-sm font-medium px-3 py-1 bg-white border border-slate-200 shadow-sm text-slate-600">
              {restaurants.length} Outlets
            </Badge>
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Manage your restaurant locations and details.</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingRestaurant(null)} className="h-12 px-8 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg shadow-orange-500/20 rounded-xl transition-all hover:scale-[1.02]">
              <Plus className="w-5 h-5 mr-2" />
              Add Restaurant
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[95vw] md:max-w-[600px] p-0 border-0 shadow-2xl overflow-hidden bg-white/95 backdrop-blur-xl">
            <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 to-red-600" />
            <DialogHeader className="p-6 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Store className="w-5 h-5 text-orange-600" />
                </div>
                <DialogTitle className="text-2xl font-bold text-slate-800">
                  {editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
                </DialogTitle>
              </div>
              <DialogDescription className="text-slate-500 text-base">
                {editingRestaurant ? 'Update your restaurant details below.' : 'Expand your business by adding a new location.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-6 overflow-y-auto max-h-[75vh]">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 font-semibold">Restaurant Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="h-11 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                  placeholder="e.g. Greenary Hotel"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-700 font-semibold">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="h-11 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                  placeholder="Brief description of your restaurant"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Restaurant Image</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-lg shadow-sm border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-2">
                          <Upload className="w-8 h-8 mx-auto text-slate-300 mb-1 group-hover:text-orange-400 transition-colors" />
                          <span className="text-xs text-slate-400 font-medium">No Image</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-3 w-full text-center sm:text-left">
                      <div>
                        <h4 className="font-medium text-slate-700">Upload Photo</h4>
                        <p className="text-xs text-slate-500 mt-1">Accepts JPG, PNG. Max 5MB.</p>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <Label
                          htmlFor="image"
                          className="cursor-pointer inline-flex items-center justify-center h-9 px-4 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-900 transition-colors"
                        >
                          Choose File
                        </Label>
                        {imagePreview && (
                          <Button type="button" variant="outline" size="sm" onClick={removeImage} className="h-9 px-3 text-red-600 border-red-200 hover:bg-red-50">
                            Remove
                          </Button>
                        )}
                        <Input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          required={!editingRestaurant && !imagePreview}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="cuisine" className="text-slate-700 font-semibold">Cuisine</Label>
                  <Select value={formData.cuisine} onValueChange={(value) => setFormData(prev => ({ ...prev, cuisine: value }))}>
                    <SelectTrigger className="h-11 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20">
                      <SelectValue placeholder="Select cuisine" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-700 font-semibold">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="h-11 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                    placeholder="+91 ...."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-slate-700 font-semibold">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="h-11 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Opening Time</Label>
                  <div className="flex gap-2">
                    {/* Hour Selector */}
                    <Select
                      value={getTimeParts(formData.openingTime).hour}
                      onValueChange={(val) => {
                        const { minute } = getTimeParts(formData.openingTime);
                        setFormData(prev => ({ ...prev, openingTime: `${val}:${minute}` }));
                      }}
                    >
                      <SelectTrigger className="flex-1 h-11 border-slate-200 focus:border-orange-500">
                        <SelectValue placeholder="HH" />
                      </SelectTrigger>
                      <SelectContent>
                        {hours.map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <span className="flex items-center text-slate-400 font-bold">:</span>

                    {/* Minute Selector */}
                    <Select
                      value={getTimeParts(formData.openingTime).minute}
                      onValueChange={(val) => {
                        const { hour } = getTimeParts(formData.openingTime);
                        setFormData(prev => ({ ...prev, openingTime: `${hour}:${val}` }));
                      }}
                    >
                      <SelectTrigger className="flex-1 h-11 border-slate-200 focus:border-orange-500">
                        <SelectValue placeholder="MM" />
                      </SelectTrigger>
                      <SelectContent>
                        {minutes.map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* AM/PM Selector */}
                    <Select
                      value={formData.openingPeriod || 'AM'}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, openingPeriod: value as 'AM' | 'PM' }))}
                    >
                      <SelectTrigger className="w-[80px] h-11 border-slate-200 focus:border-orange-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Closing Time</Label>
                  <div className="flex gap-2">
                    {/* Hour Selector */}
                    <Select
                      value={getTimeParts(formData.closingTime).hour}
                      onValueChange={(val) => {
                        const { minute } = getTimeParts(formData.closingTime);
                        setFormData(prev => ({ ...prev, closingTime: `${val}:${minute}` }));
                      }}
                    >
                      <SelectTrigger className="flex-1 h-11 border-slate-200 focus:border-orange-500">
                        <SelectValue placeholder="HH" />
                      </SelectTrigger>
                      <SelectContent>
                        {hours.map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <span className="flex items-center text-slate-400 font-bold">:</span>

                    {/* Minute Selector */}
                    <Select
                      value={getTimeParts(formData.closingTime).minute}
                      onValueChange={(val) => {
                        const { hour } = getTimeParts(formData.closingTime);
                        setFormData(prev => ({ ...prev, closingTime: `${hour}:${val}` }));
                      }}
                    >
                      <SelectTrigger className="flex-1 h-11 border-slate-200 focus:border-orange-500">
                        <SelectValue placeholder="MM" />
                      </SelectTrigger>
                      <SelectContent>
                        {minutes.map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* AM/PM Selector */}
                    <Select
                      value={formData.closingPeriod || 'PM'}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, closingPeriod: value as 'AM' | 'PM' }))}
                    >
                      <SelectTrigger className="w-[80px] h-11 border-slate-200 focus:border-orange-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Restaurant Status toggle removed: open/close is now managed by time only */}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="h-11 border-slate-200 text-slate-600 hover:bg-slate-50">
                  Cancel
                </Button>
                <Button type="submit" className="h-11 px-6 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-md">
                  {editingRestaurant ? 'Update Details' : 'Add Restaurant'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {restaurants.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center p-16 bg-white/60 backdrop-blur-sm rounded-2xl border border-dashed border-slate-300 text-center max-w-lg mx-auto mt-10"
        >
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
            <Store className="w-10 h-10 text-orange-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800">No Restaurants Yet</h3>
          <p className="text-slate-500 mt-2 mb-6">
            Add your first restaurant to start managing your menu and orders.
          </p>
          <Button onClick={() => { setIsAddDialogOpen(true); setEditingRestaurant(null); }} className="bg-orange-600 hover:bg-orange-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Add First Outlet
          </Button>
        </motion.div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10"
        >
          {restaurants.map((restaurant) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              layout
              key={restaurant.id}
            >
              {restaurant.verification?.status === 'requested' && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-100 rounded-full">
                      <ShieldAlert className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900">Verification Required</h4>
                      <p className="text-sm text-red-700 mt-1 mb-3">
                        Admin has requested documents: "{restaurant.verification.adminMessage}"
                      </p>
                      <VerifyUploadDialog restaurant={restaurant} />
                    </div>
                  </div>
                </div>
              )}

              <Card className="group border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-white overflow-hidden h-full flex flex-col hover:-translate-y-1">
                <div className="relative w-full h-52 overflow-hidden bg-slate-100">
                  {restaurant.image ? (
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Store className="w-12 h-12" />
                    </div>
                  )}

                  <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                    {/* Pending Approval Badge */}
                    {restaurant.approved === false && (
                      <Badge variant="destructive" className="shadow-sm font-medium border-0 bg-orange-500 hover:bg-orange-600 animate-pulse">
                        Pending Approval
                      </Badge>
                    )}

                    {restaurant.verification?.status === 'submitted' && (
                      <Badge className="bg-purple-500 text-white border-0">Verification Submitted</Badge>
                    )}

                    {(() => {
                      const status = getRestaurantStatus(
                        restaurant.openingTime || '',
                        restaurant.closingTime || '',
                        30,
                        undefined,
                        restaurant.openingPeriod,
                        restaurant.closingPeriod
                      );

                      const statusConfig = {
                        'OPEN': { color: 'bg-emerald-500 hover:bg-emerald-600', label: 'Open Now' },
                        'CLOSED': { color: 'bg-slate-500', label: 'Closed' },
                        'OPENING_SOON': { color: 'bg-amber-500 hover:bg-amber-600', label: 'Opening Soon' },
                        'CLOSING_SOON': { color: 'bg-rose-500 hover:bg-rose-600', label: 'Closing Soon' }
                      };

                      const config = statusConfig[status];

                      return (
                        <Badge variant="secondary" className={cn("shadow-sm font-medium text-white border-0", config.color)}>
                          {config.label}
                        </Badge>
                      );
                    })()}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold line-clamp-1 shadow-sm">{restaurant.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-100 mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="line-clamp-1">{restaurant.address}</span>
                    </div>
                  </div>
                </div>

                <CardContent className="p-5 flex-1 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Utensils className="w-4 h-4 text-orange-500" />
                      <span className="truncate">{restaurant.cuisine || 'Cuisine N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="truncate">{restaurant.rating || 'New'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="truncate">
                        {restaurant.openingTime} {restaurant.openingPeriod} - {restaurant.closingTime} {restaurant.closingPeriod}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 text-green-500" />
                      <span className="truncate">{restaurant.phone}</span>
                    </div>
                  </div>

                  {restaurant.description && (
                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {restaurant.description}
                    </p>
                  )}

                  <div className="flex gap-3 mt-auto pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-slate-200 hover:bg-slate-50 text-slate-700"
                      onClick={() => handleEdit(restaurant)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Details
                    </Button>
                    {/* Open/Close button removed: status is now time-based only */}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// Sub-component for Verification Dialog to clean up main component
const VerifyUploadDialog = ({ restaurant }: { restaurant: Restaurant }) => {
  const { submitVerification } = useOwnerData();
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!preview) return alert("Please upload an image");
    setIsSubmitting(true);
    await submitVerification(restaurant.id, preview, response);
    setIsSubmitting(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive" className="w-full">
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verification Upload</DialogTitle>
          <DialogDescription>
            Please upload your Aadhar Card or requested document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!preview ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center bg-slate-50">
              <Input type="file" accept="image/*" className="hidden" id={`verify-${restaurant.id}`} onChange={handleImage} />
              <Label htmlFor={`verify-${restaurant.id}`} className="cursor-pointer flex flex-col items-center">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm font-medium text-slate-600">Click to Upload Image</span>
              </Label>
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden border">
              <img src={preview} alt="Document" className="w-full h-48 object-contain bg-black/5" />
              <Button size="icon" variant="destructive" className="absolute top-2 right-2 h-6 w-6 rounded-full" onClick={() => { setPreview(null); setImage(null); }}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label>Additional Note (Optional)</Label>
            <Input value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Any details for admin..." />
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={!preview || isSubmitting} className="w-full">
          {isSubmitting ? "Submitting..." : "Submit Verification"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};


export default RestaurantPage;
