import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Copy, Zap, Plus, Eye, EyeOff, Tag, Percent, Calendar, ShoppingBag } from 'lucide-react';
import { useOwnerData } from '@/contexts/OwnerDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PromoCode {
  _id: string;
  code: string;
  discountPercentage: number;
  description?: string;
  isActive: boolean;
  usageCount: number;
  usageLimit?: number;
  minOrderAmount: number;
  expiryDate?: string;
  createdAt: string;
  restaurant: { name: string; _id: string };
}

// Ensure API base URL consistently includes the '/api' prefix
const API_BASE_URL = (() => {
  const base = import.meta.env.VITE_API_URL as string | undefined;
  if (!base) return 'http://localhost:5000/api';
  return base.endsWith('/api') ? base : `${base}/api`;
})();

export default function PromoCodes() {
  const { restaurant } = useOwnerData();
  const { token } = useAuth();
  const { toast } = useToast();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountPercentage: 10,
    minOrderAmount: 0,
    expiryDate: ''
  });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch promo codes
  useEffect(() => {
    if (restaurant && token) {
      fetchPromoCodes();
    }
  }, [restaurant, token]);

  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/promo-codes/owner/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPromoCodes(data);
      }
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load promo codes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!formData.code.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a promo code',
        variant: 'destructive'
      });
      return;
    }

    if (formData.discountPercentage < 0 || formData.discountPercentage > 100) {
      toast({
        title: 'Error',
        description: 'Discount must be between 0 and 100%',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/promo-codes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          restaurantId: restaurant?.id,
          code: formData.code.toUpperCase(),
          description: formData.description,
          discountPercentage: formData.discountPercentage,
          minOrderAmount: formData.minOrderAmount,
          expiryDate: formData.expiryDate || null
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Promo code "${formData.code.toUpperCase()}" created successfully!`
        });

        // Reset form
        setFormData({
          code: '',
          description: '',
          discountPercentage: 10,
          minOrderAmount: 0,
          expiryDate: ''
        });
        setIsDialogOpen(false);

        // Refresh list
        fetchPromoCodes();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to create promo code',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error creating promo code:', error);
      toast({
        title: 'Error',
        description: 'Failed to create promo code',
        variant: 'destructive'
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: 'Copied',
      description: `Promo code "${code}" copied to clipboard`
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteCode = async (codeId: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/promo-codes/${codeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Promo code deleted'
        });
        fetchPromoCodes();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete promo code',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error deleting promo code:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete promo code',
        variant: 'destructive'
      });
    }
  };

  const handleToggleStatus = async (codeId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/promo-codes/${codeId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Promo code status updated'
        });
        fetchPromoCodes();
      }
    } catch (error) {
      console.error('Error toggling promo code status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive'
      });
    }
  };

  if (!restaurant) {
    return (
      <div className="p-10 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full border-dashed border-2">
          <CardContent className="p-8 text-center bg-slate-50/50">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-600 font-medium text-lg">Select a restaurant first</p>
            <p className="text-slate-400 text-sm mt-1">Choose a restaurant to manage promo codes</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const activeCount = promoCodes.filter(p => {
    if (!p.isActive) return false;
    if (p.expiryDate && new Date(p.expiryDate) < new Date()) return false;
    return true;
  }).length;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-10 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            Promo Codes
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
              {activeCount} Active
            </span>
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Boost sales with targeted discount campaigns for <span className="font-semibold text-slate-700">{restaurant?.name}</span></p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95">
              <Plus className="w-5 h-5 mr-2" />
              Create Code
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] border-0 shadow-2xl">
            <DialogHeader className="pb-4 border-b border-slate-100">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-600">
                <Tag className="w-6 h-6" />
              </div>
              <DialogTitle className="text-2xl font-bold">New Coupon</DialogTitle>
              <DialogDescription>
                Create a new discount code to engage your customers.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-semibold text-slate-700">Promo Code</Label>
                <div className="relative">
                  <Input
                    id="code"
                    placeholder="SUMMER50"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="pl-10 h-12 text-lg font-mono uppercase tracking-wider border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                  />
                  <Tag className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                </div>
                <p className="text-xs text-slate-400">Customers will use this code at checkout.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount" className="text-sm font-semibold text-slate-700">Discount</Label>
                  <div className="relative">
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discountPercentage}
                      onChange={(e) => setFormData({ ...formData, discountPercentage: parseInt(e.target.value) })}
                      className="pl-10 h-11 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                    />
                    <Percent className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minOrder" className="text-sm font-semibold text-slate-700">Min Order (₹)</Label>
                  <div className="relative">
                    <Input
                      id="minOrder"
                      type="number"
                      min="0"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({ ...formData, minOrderAmount: parseInt(e.target.value) })}
                      className="pl-10 h-11 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                    />
                    <ShoppingBag className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-slate-700">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g., Get 10% off on all orders above ₹500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="h-11 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry" className="text-sm font-semibold text-slate-700">Expiry Date (Optional)</Label>
                <div className="relative">
                  <Input
                    id="expiry"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="pl-10 h-11 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <Button onClick={handleGenerateCode} className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-lg shadow-lg shadow-orange-500/20 mt-4">
                Generate Coupon
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-white rounded-xl shadow-sm animate-pulse border border-slate-100"></div>
          ))}
        </div>
      ) : promoCodes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-sm text-center max-w-2xl mx-auto"
        >
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
            <Zap className="w-10 h-10 text-orange-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800">No active coupons</h3>
          <p className="text-slate-500 mt-2 mb-8 max-w-md mx-auto">Create your first promo code to attract more customers and boost your sales volume.</p>
          <Button onClick={() => setIsDialogOpen(true)} size="lg" className="bg-slate-900 text-white hover:bg-slate-800">
            <Plus className="w-5 h-5 mr-2" />
            Create First Coupon
          </Button>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {promoCodes.map((promoCode) => {
              const isExpired = promoCode.expiryDate ? new Date(promoCode.expiryDate) < new Date() : false;
              const isTrulyActive = promoCode.isActive && !isExpired;

              return (
                <motion.div variants={item} layout key={promoCode._id}>
                  <Card className={cn(
                    "relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group",
                    isTrulyActive ? "bg-white" : "bg-slate-50 opacity-75"
                  )}>
                    {/* Visual Ticket Stub Effect */}
                    <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-b from-orange-400 to-red-500" />

                    {/* Status Indicator */}
                    <div className="absolute top-4 right-4">
                      <Badge variant={isTrulyActive ? 'default' : 'secondary'} className={cn(
                        isTrulyActive ? "bg-green-100 text-green-700 hover:bg-green-200" : isExpired ? "bg-red-100 text-red-700" : "bg-slate-200 text-slate-600"
                      )}>
                        {isExpired ? 'Expired' : promoCode.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <CardContent className="p-6 pl-8">
                      <div className="mb-4">
                        <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">Coupon Code</p>
                        <h3 className={cn(
                          "text-3xl font-black font-mono tracking-wide selection:bg-orange-100",
                          isTrulyActive ? "text-slate-900" : "text-slate-400 line-through"
                        )}>
                          {promoCode.code}
                        </h3>
                      </div>

                      <div className="flex items-center gap-4 mb-6">
                        <div className="flex flex-col">
                          <span className="text-4xl font-bold text-slate-800">{promoCode.discountPercentage}%</span>
                          <span className="text-xs font-bold text-slate-400 uppercase">Discount</span>
                        </div>
                        <div className="h-10 w-px bg-slate-200" />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-700">₹{promoCode.minOrderAmount}</span>
                          <span className="text-xs text-slate-400">Min Order</span>
                        </div>
                      </div>

                      {promoCode.description && (
                        <p className="text-sm text-slate-500 mb-4 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {promoCode.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-400 mb-6 font-medium">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          Used {promoCode.usageCount} times
                        </span>
                        {promoCode.expiryDate && (
                          <span className="flex items-center gap-1 bg-red-50 text-red-500 px-2 py-0.5 rounded-full">
                            <Calendar className="w-3 h-3" />
                            Exp: {new Date(promoCode.expiryDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-4 border-t border-slate-100 border-dashed">
                        <Button
                          variant="outline"
                          className={cn(
                            "flex-1 border-slate-200 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 transition-colors",
                            copiedCode === promoCode.code && "bg-green-50 border-green-200 text-green-600"
                          )}
                          onClick={() => handleCopyCode(promoCode.code)}
                        >
                          {copiedCode === promoCode.code ? (
                            <>Copied! <div className="ml-2 w-2 h-2 rounded-full bg-green-500" /></>
                          ) : (
                            <><Copy className="w-4 h-4 mr-2" /> Copy Code</>
                          )}
                        </Button>

                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => handleToggleStatus(promoCode._id)}
                            title={promoCode.isActive ? "Deactivate" : "Activate"}
                          >
                            {promoCode.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteCode(promoCode._id)}
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>

                    {/* Decorative Circles for Ticket Effect */}
                    <div className="absolute -left-3 top-1/2 -mt-3 w-6 h-6 rounded-full bg-slate-50" />
                    <div className="absolute -right-3 top-1/2 -mt-3 w-6 h-6 rounded-full bg-slate-50" />
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
