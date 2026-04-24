import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchUnapprovedRestaurants, approveRestaurant } from "../lib/adminApi";
import { useToast } from "@/hooks/use-toast";

const AdminRestaurantApprovals = () => {
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["admin-unapproved-restaurants"],
    queryFn: fetchUnapprovedRestaurants,
    staleTime: 30000,
  });
  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: approveRestaurant,
    onSuccess: () => {
      toast({ title: "Restaurant approved" });
      refetch();
    },
    onError: (err: any) => {
      toast({ title: "Approval failed", description: err?.message || "Unable to approve", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Pending Restaurant Approvals</h1>
        <p className="text-sm text-muted-foreground mb-2">Approve new restaurants to make them visible to users and owners.</p>
      </div>
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle>Unapproved Restaurants <Badge variant="secondary">{data?.length || 0}</Badge></CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isFetching && <p className="text-sm text-muted-foreground">Loading...</p>}
          {!isFetching && (!data || data.length === 0) && <p className="text-sm text-muted-foreground">No pending approvals.</p>}
          <div className="grid grid-cols-1 gap-3">
            {data?.map((restaurant) => (
              <div key={restaurant._id} className="border border-border rounded-lg p-3 bg-background/60 flex items-center gap-4">
                <img src={restaurant.image} alt={restaurant.name} className="w-20 h-20 object-cover rounded-lg border" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{restaurant.name}</p>
                  <p className="text-xs text-muted-foreground">{restaurant.cuisine || "Cuisine not set"}</p>
                  <p className="text-xs text-muted-foreground">{restaurant.address}</p>
                  <p className="text-xs text-muted-foreground">Owner: {typeof restaurant.owner === 'object' ? restaurant.owner?.name : ''}</p>
                </div>
                <Button
                  variant="success"
                  disabled={mutation.isLoading}
                  onClick={() => mutation.mutate(restaurant._id)}
                >
                  Approve
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRestaurantApprovals;
