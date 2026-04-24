import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Star, User, Building2, Bike, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchAdminReviews } from "../lib/adminApi";

const formatDate = (date: string | Date) => new Date(date).toLocaleString();

const AdminReviews = () => {
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: fetchAdminReviews,
    staleTime: 60000,
  });

  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!data) return [];
    if (!term) return data;
    return data.filter((item) => {
      const fields = [
        item?.restaurant?.name,
        item?.user?.name,
        item?.deliveryBoy?.user?.name,
        item?.comment,
        item?.deliveryComment,
      ].filter(Boolean) as string[];
      return fields.some((f) => f.toLowerCase().includes(term));
    });
  }, [data, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">Read-only view</p>
          <h1 className="text-xl font-semibold text-foreground">User Reviews</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative w-full max-w-md">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
              <Input
                placeholder="Search by restaurant, user, delivery partner, or text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge variant="secondary">{filtered.length} reviews</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
          {isFetching && <p className="text-sm text-muted-foreground">Loading reviews...</p>}
          {!isFetching && filtered.length === 0 && <p className="text-sm text-muted-foreground">No reviews found.</p>}

          {filtered.map((review) => (
            <div key={review._id} className="border border-border rounded-lg p-3 bg-background/60">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-semibold">{review.rating}/5</span>
                  {review.deliveryRating && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Bike className="h-3 w-3" /> {review.deliveryRating}/5 delivery
                    </span>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">{formatDate(review.createdAt)}</Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="text-foreground font-medium">{review?.restaurant?.name || "Restaurant"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span>{review?.user?.name || "User"}</span>
                </div>
                {review?.deliveryBoy?.user?.name && (
                  <div className="flex items-center gap-2">
                    <Bike className="h-4 w-4 text-primary" />
                    <span>{review.deliveryBoy.user.name}</span>
                  </div>
                )}
              </div>

              {review.comment && (
                <p className="mt-2 text-sm text-foreground leading-relaxed">{review.comment}</p>
              )}
              {review.deliveryComment && (
                <p className="mt-2 text-sm text-foreground leading-relaxed">Delivery: {review.deliveryComment}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReviews;
