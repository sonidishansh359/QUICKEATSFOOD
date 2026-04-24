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
import { MenuItem, Restaurant } from '@/types/auth';
import { Plus, Edit, Trash2, IndianRupee, ChefHat, Upload, X, Search, Filter, Utensils, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import BurgerImg from '@/assets/burger.png';
import IceCreamImg from '@/assets/icecream.png';
import ChineseImg from '@/assets/chinese.png';
import DrinksImg from '@/assets/drinks.png';

const MenuPage: React.FC = () => {
  const { restaurants, menuItems, addMenuItem, updateMenuItem, deleteMenuItem, toggleItemAvailability, isRestaurantLoading } = useOwnerData();
  const { location } = useAutoLocation();
  const restaurant = restaurants.length > 0 ? restaurants[0] : null;
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    dietaryType: 'Veg',
    isAvailable: true,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Auto-set category or other fields when dialog opens (for consistency)
  useEffect(() => {
    if (isAddDialogOpen && !editingItem) {
      // Reset form but keep defaults
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        image: '',
        dietaryType: 'Veg',
        isAvailable: true,
      });
    }
  }, [isAddDialogOpen, editingItem]);

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

  const categories = [
    'Appetizers', 'Main Course', 'Desserts', 'Beverages', 'Snacks', 'Soups', 'Salads', 'Other'
  ];

  const filteredMenuItems = restaurant
    ? menuItems.filter(item => {
      const matchesRestaurant = item.restaurantId === restaurant.id;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesRestaurant && matchesSearch && matchesCategory;
    })
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!restaurant?.id) {
      console.error('handleSubmit: Restaurant not loaded or invalid');
      return;
    }

    // Validate required fields
    if (!formData.name || !formData.price || !formData.category) {
      alert('Please fill in all required fields (Name, Price, Category)');
      return;
    }

    // Validate image is required for new items
    if (!selectedImage && !editingItem && !imagePreview) {
      alert('Menu item image is required');
      return;
    }

    console.log('handleSubmit: Submitting menu item for restaurantId:', restaurant.id);

    const itemData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      image: imagePreview || formData.image, // Use Base64 imagePreview
      dietaryType: formData.dietaryType,
      isAvailable: formData.isAvailable,
    };
    if (editingItem) {
      await updateMenuItem(editingItem.id, itemData);
      setEditingItem(null);
    } else {
      await addMenuItem({
        ...itemData,
        restaurantId: restaurant.id,
      });
    }

    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      image: '',
      dietaryType: 'Veg',
      isAvailable: true,
    });
    setSelectedImage(null);
    setImagePreview(null);
    setIsAddDialogOpen(false);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: (item.originalPrice || item.price).toString(),
      category: item.category,
      image: item.image || '',
      dietaryType: item.dietaryType || 'Veg',
      isAvailable: item.isAvailable,
    });
    setImagePreview(item.image || null);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      await deleteMenuItem(itemId);
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    // Optimistic UI update could be handled here if needed, but for now rely on context refresh
    await toggleItemAvailability(item.id);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full border-dashed border-2">
          <CardContent className="p-8 text-center bg-slate-50/50">
            <ChefHat className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Restaurant Selected</h3>
            <p className="text-slate-500 mb-6">Please select a restaurant from the dashboard first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            Menu Management
            <Badge variant="secondary" className="text-sm font-medium px-3 py-1 bg-white border border-slate-200 shadow-sm text-slate-600">
              {menuItems.filter(i => i.restaurantId === restaurant.id).length} Items
            </Badge>
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Curate and manage your dishes for <span className="font-semibold text-slate-700">{restaurant.name}</span></p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingItem(null)} className="h-12 px-8 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg shadow-orange-500/20 rounded-xl transition-all hover:scale-[1.02]">
              <Plus className="w-5 h-5 mr-2" />
              Add New Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[95vw] md:max-w-[600px] p-0 border-0 shadow-2xl overflow-hidden bg-white/95 backdrop-blur-xl">
            <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 to-red-600" />
            <DialogHeader className="p-6 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  {editingItem ? <Edit className="w-5 h-5 text-orange-600" /> : <Utensils className="w-5 h-5 text-orange-600" />}
                </div>
                <DialogTitle className="text-2xl font-bold text-slate-800">
                  {editingItem ? 'Edit Menu Item' : 'Add New Dish'}
                </DialogTitle>
              </div>
              <DialogDescription className="text-slate-500 text-base">
                {editingItem ? 'Update the details below to modify this item.' : 'Create a mouth-watering new addition to your menu.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-6 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700 font-semibold">Dish Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="h-11 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                    placeholder="e.g. Butter Chicken"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-slate-700 font-semibold">Price (₹)</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="pl-9 h-11 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-700 font-semibold">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="h-11 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                  placeholder="Describe the ingredients, taste, etc."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Dish Image</Label>
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
                          required={!editingItem && !imagePreview}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-slate-700 font-semibold">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="h-11 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dietaryType" className="text-slate-700 font-semibold">Dietary Type</Label>
                  <Select value={formData.dietaryType} onValueChange={(value) => setFormData(prev => ({ ...prev, dietaryType: value as 'Veg' | 'NonVeg' }))}>
                    <SelectTrigger className="h-11 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Veg">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500" /> Vegetarian
                        </div>
                      </SelectItem>
                      <SelectItem value="NonVeg">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500" /> Non-Vegetarian
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="space-y-0.5">
                  <Label htmlFor="isAvailable" className="text-base font-semibold text-slate-800">Available for Ordering</Label>
                  <p className="text-xs text-slate-500">Turn off to mark as out of stock</p>
                </div>
                <Switch
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAvailable: checked }))}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="h-11 border-slate-200 text-slate-600 hover:bg-slate-50">
                  Cancel
                </Button>
                <Button type="submit" disabled={isRestaurantLoading} className="h-11 px-6 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-md">
                  {editingItem ? 'Save Changes' : 'Create Item'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Bar */}
      <div className="relative z-10 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search menu items..."
            className="pl-10 h-12 bg-white border-slate-200 shadow-sm rounded-xl focus:border-orange-500 focus:ring-orange-500/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-[200px]">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-12 bg-white border-slate-200 shadow-sm rounded-xl">
              <div className="flex items-center gap-2 text-slate-600">
                <Filter className="w-4 h-4" />
                <SelectValue placeholder="All Categories" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredMenuItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center p-16 bg-white/60 backdrop-blur-sm rounded-2xl border border-dashed border-slate-300 text-center max-w-lg mx-auto mt-10"
        >
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
            <ChefHat className="w-10 h-10 text-orange-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800">
            {searchQuery || selectedCategory !== 'all' ? 'No items matched' : 'Your Menu is Empty'}
          </h3>
          <p className="text-slate-500 mt-2 mb-6">
            {searchQuery || selectedCategory !== 'all' ? 'Try adjusting your search or filters.' : 'Start building your menu to attract hungry customers.'}
          </p>
          {!searchQuery && selectedCategory === 'all' && (
            <Button onClick={() => { setIsAddDialogOpen(true); setEditingItem(null); }} className="bg-orange-600 hover:bg-orange-700 text-white">
              <Plus className="w-4 h-4 mr-2" /> Add First Item
            </Button>
          )}
        </motion.div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 relative z-10"
        >
          {filteredMenuItems.map((item) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              layout
              key={item.id}
            >
              <Card className="group border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-white overflow-hidden h-full flex flex-col hover:-translate-y-1">
                <div className="relative w-full h-48 overflow-hidden bg-slate-100">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Utensils className="w-12 h-12" />
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className={cn("shadow-sm backdrop-blur-md bg-white/90 text-slate-800 hover:bg-white", item.dietaryType === 'Veg' ? "text-green-700 border-green-200" : "text-red-700 border-red-200")}>
                      <span className={cn("w-2 h-2 rounded-full mr-1.5", item.dietaryType === 'Veg' ? "bg-green-500" : "bg-red-500")} />
                      {item.dietaryType === 'Veg' ? 'VEG' : 'NON-VEG'}
                    </Badge>
                  </div>

                  <div className="absolute top-3 right-3">
                    <Badge variant={item.isAvailable ? 'default' : 'secondary'} className={cn("shadow-sm", item.isAvailable ? "bg-emerald-500 hover:bg-emerald-600" : "bg-slate-500")}>
                      {item.isAvailable ? 'In Stock' : 'Unavailable'}
                    </Badge>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                    <div className="flex gap-2 w-full">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 bg-white/90 hover:bg-white text-slate-900 border-0 shadow-lg font-medium"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-9 px-0 shadow-lg"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-slate-800 line-clamp-1 group-hover:text-orange-600 transition-colors">{item.name}</h3>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs font-normal text-slate-500 border-slate-200 bg-slate-50">
                      {item.category}
                    </Badge>
                  </div>

                  {item.description && (
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">{item.description}</p>
                  )}

                  <div className="mt-auto pt-4 border-t border-slate-100 border-dashed flex items-center justify-between">
                    <div className="flex items-center text-slate-900 font-bold text-xl">
                      <IndianRupee className="w-4 h-4 mr-0.5" />
                      {(item.originalPrice || item.price).toFixed(2)}
                    </div>

                    <div className="flex items-center gap-2">
                      <Label htmlFor={`avail-${item.id}`} className="text-xs font-medium text-slate-400 cursor-pointer">
                        {item.isAvailable ? 'Active' : 'Hidden'}
                      </Label>
                      <Switch
                        id={`avail-${item.id}`}
                        checked={item.isAvailable}
                        onCheckedChange={() => handleToggleAvailability(item)}
                        className="scale-75 origin-right"
                      />
                    </div>
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

export default MenuPage;
