import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { User, Phone, Mail, Car, Bike, CircleDot, Save, Camera, Star, Calendar, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeliveryLayout } from '@/components/delivery/DeliveryLayout';
import { useDeliveryData, type DeliveryProfile as DeliveryProfileType } from '@/contexts/DeliveryDataContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const vehicleTypes = [
  { value: 'bike', label: 'Bicycle', icon: Bike },
  { value: 'scooter', label: 'Scooter/Motorcycle', icon: CircleDot },
  { value: 'car', label: 'Car', icon: Car },
];

export default function DeliveryProfile() {
  const { profile, updateProfile, earnings } = useDeliveryData();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: profile.name,
    phone: profile.phone,
    email: profile.email,
    vehicleType: profile.vehicleType,
    vehicleNumber: profile.vehicleNumber,
  });

  const [isEditing, setIsEditing] = useState(false);

  // Sync formData when profile updates from backend
  useEffect(() => {
    setFormData({
      name: profile.name,
      phone: profile.phone,
      email: profile.email,
      vehicleType: profile.vehicleType,
      vehicleNumber: profile.vehicleNumber,
    });
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData as Partial<DeliveryProfileType>);
    setIsEditing(false);
    toast({
      title: 'Profile Updated',
      description: 'Your profile has been updated successfully.',
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <DeliveryLayout>
      <Helmet>
        <title>Profile | QuickEats Delivery</title>
      </Helmet>

      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center text-4xl font-bold text-primary-foreground">
                  {profile.name.charAt(0)}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center sm:text-left flex-1">
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className="text-muted-foreground">{profile.email}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3">
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{profile.rating}</span>
                    <span className="text-muted-foreground">rating</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Package className="w-4 h-4 text-primary" />
                    <span className="font-medium">{profile.totalDeliveries}</span>
                    <span className="text-muted-foreground">deliveries</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Joined {new Date(profile.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant={isEditing ? 'outline' : 'default'}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="text-2xl font-bold text-green-500">₹{earnings.thisMonth.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="text-2xl font-bold">98%</p>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">On-Time Delivery</p>
              <p className="text-2xl font-bold">95%</p>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="pl-10"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="pl-10"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="pl-10"
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="font-medium mb-4">Vehicle Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleType">Vehicle Type</Label>
                    <Select
                      value={formData.vehicleType}
                      onValueChange={(value) => handleChange('vehicleType', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="w-4 h-4" />
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                    <Input
                      id="vehicleNumber"
                      value={formData.vehicleNumber}
                      onChange={(e) => handleChange('vehicleNumber', e.target.value)}
                      placeholder="XX-1234"
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end gap-3 pt-4"
                >
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </motion.div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Availability Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Availability Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div>
                  <p className="font-medium">Current Status</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.isOnline ? 'You are receiving orders' : 'You are not receiving orders'}
                  </p>
                </div>
                <div className={cn(
                  "px-4 py-2 rounded-full font-medium",
                  profile.isOnline 
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {profile.isOnline ? 'Online' : 'Offline'}
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Toggle your online status from the sidebar to start or stop receiving orders.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DeliveryLayout>
  );
}