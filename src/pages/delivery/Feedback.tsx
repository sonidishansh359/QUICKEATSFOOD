import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Star, TrendingUp, MessageSquare, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeliveryLayout } from '@/components/delivery/DeliveryLayout';
import { useDeliveryData } from '@/contexts/DeliveryDataContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Review {
  _id: string;
  user: {
    name: string;
  };
  deliveryRating: number;
  deliveryComment: string;
  createdAt: string;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export default function DeliveryFeedback() {
  const { profile } = useDeliveryData();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check both auth storage keys
        const storageKeys = ['quickeats_auth', 'foodswift_auth'];
        let token = null;

        for (const key of storageKeys) {
          const storedAuth = localStorage.getItem('quickeats_auth');
          if (storedAuth) {
            try {
              token = JSON.parse(storedAuth).token;
              if (token) break;
            } catch (e) {
              console.error(`Failed to parse ${key}:`, e);
            }
          }
        }

        if (!token) {
          setError('Please login to view feedback');
          return;
        }

        // Fetch delivery boy reviews using the /reviews/my-reviews endpoint
        const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const API_BASE_URL = typeof API_ORIGIN === 'string' && API_ORIGIN.endsWith('/api') ? API_ORIGIN : `${API_ORIGIN}/api`;
        const response = await fetch(`${API_BASE_URL}/delivery-boys/reviews/my-reviews`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }

        const data = await response.json();
        setReviews(data.reviews || []);
        setStats(data.stats || null);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
        setError('Failed to load feedback. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'w-4 h-4',
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <DeliveryLayout>
      <Helmet>
        <title>My Feedback | QuickEats Delivery</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Feedback & Ratings</h1>
          <p className="text-muted-foreground mt-1">See what customers think about your deliveries</p>
        </div>

        {/* Rating Summary Card */}
        {stats && stats.totalReviews > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Average Rating */}
                  <div className="text-center">
                    <div className="flex justify-center mb-3">
                      <div className="relative w-20 h-20">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 opacity-20"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl font-bold text-yellow-600">
                            {stats.averageRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                    <div className="flex justify-center mt-2">
                      {renderStars(Math.round(stats.averageRating))}
                    </div>
                  </div>

                  {/* Total Reviews */}
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-3">
                        <MessageSquare className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-foreground">{stats.totalReviews}</p>
                      <p className="text-sm text-muted-foreground">Total Ratings</p>
                    </div>
                  </div>

                  {/* Rating Distribution */}
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground w-8">
                          {rating}★
                        </span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 transition-all"
                            style={{
                              width: `${stats.totalReviews > 0
                                ? (stats.ratingDistribution[rating as 1 | 2 | 3 | 4 | 5] / stats.totalReviews) * 100
                                : 0
                                }%`
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground w-8 text-right">
                          {stats.ratingDistribution[rating as 1 | 2 | 3 | 4 | 5]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <div className="inline-block animate-spin">
                  <Star className="w-8 h-8 text-yellow-400" />
                </div>
                <p className="text-muted-foreground mt-3">Loading your feedback...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews List */}
        {!loading && reviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Customer Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews.map((review, index) => (
                  <motion.div
                    key={review._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{review.user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                        {review.deliveryRating}★
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      {renderStars(review.deliveryRating)}
                    </div>

                    {review.deliveryComment && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-foreground">{review.deliveryComment}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && reviews.length === 0 && !error && (
          <Card>
            <CardContent className="p-12 text-center">
              <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Feedback Yet
              </h3>
              <p className="text-muted-foreground">
                As you complete more deliveries, customers will start leaving feedback here.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tips Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Tips to Maintain High Ratings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-900">
            <p>✓ Deliver orders on time</p>
            <p>✓ Handle food with care to avoid damage</p>
            <p>✓ Be polite and professional with customers</p>
            <p>✓ Maintain proper temperature of food items</p>
            <p>✓ Contact customers if there are any delays</p>
          </CardContent>
        </Card>
      </div>
    </DeliveryLayout>
  );
}
