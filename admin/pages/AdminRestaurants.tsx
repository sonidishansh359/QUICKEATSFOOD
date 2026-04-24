import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Building2, MapPin, Phone, ShieldAlert, RefreshCw, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchAdminRestaurants, fetchUnapprovedRestaurants, approveRestaurant, deleteAdminRestaurant, hardDeleteAdminRestaurant, requestVerification, AdminRestaurant } from "../lib/adminApi";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useLocation } from "react-router-dom";

const AdminRestaurants = () => {
  const location = useLocation();
  const isApprovalsPage = location.pathname.includes('approvals');
  const [activeTab, setActiveTab] = useState<'approved' | 'pending'>(isApprovalsPage ? 'pending' : 'approved');
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const [reviewRestaurant, setReviewRestaurant] = useState<AdminRestaurant | null>(null);

  // Fetch Approved Restaurants
  const {
    data: approvedData,
    isFetching: isFetchingApproved,
    refetch: refetchApproved
  } = useQuery({
    queryKey: ["admin-restaurants"],
    queryFn: fetchAdminRestaurants,
    staleTime: 60000,
  });

  // Fetch Pending Restaurants
  const {
    data: pendingData,
    isFetching: isFetchingPending,
    refetch: refetchPending
  } = useQuery({
    queryKey: ["admin-unapproved-restaurants"],
    queryFn: fetchUnapprovedRestaurants,
    staleTime: 10000, // Shorter stale time for pending
    refetchInterval: 30000, // Auto-refresh pending list
  });

  const displayData = activeTab === 'approved' ? approvedData : pendingData;
  const isFetching = activeTab === 'approved' ? isFetchingApproved : isFetchingPending;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!displayData) return [];
    if (!term) return displayData;
    return displayData.filter((item) =>
      [item.name, item.address, item.cuisine]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(term))
    );
  }, [displayData, search]);

  const handleApprove = async (id: string) => {
    try {
      await approveRestaurant(id);
      toast({ title: "Restaurant Approved", description: "It is now visible to users." });
      setReviewRestaurant(null);
      refetchPending();
      refetchApproved();
    } catch (err: any) {
      toast({ title: "Approval Failed", description: err?.message, variant: "destructive" });
    }
  };

  const handleRequestVerification = async (id: string) => {
    try {
      await requestVerification(id, "Please upload your Aadhar card for verification.");
      toast({ title: "Verification Requested", description: "Owner has been notified." });
      refetchPending();
    } catch (err: any) {
      toast({ title: "Request Failed", description: err?.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = window.confirm("Permanently delete this restaurant? Menu items will be removed. Orders remain for history.");
    if (!confirm) return;
    try {
      await hardDeleteAdminRestaurant(id);
      toast({ title: "Deleted permanently", description: "Restaurant removed from database" });
      if (activeTab === 'approved') refetchApproved();
      else refetchPending();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err?.message || "Unable to delete", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Restaurants</h1>
          <p className="text-muted-foreground">Manage approvals and restaurant listings.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'pending' ? 'default' : 'outline'}
            onClick={() => setActiveTab('pending')}
            className="gap-2"
          >
            <Clock className="w-4 h-4" />
            Pending
            {pendingData && pendingData.length > 0 && (
              <Badge variant="secondary" className="ml-1 px-1 h-5 min-w-5 flex items-center justify-center bg-white/20 text-white">
                {pendingData.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === 'approved' ? 'default' : 'outline'}
            onClick={() => setActiveTab('approved')}
            className="gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Approved
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { refetchApproved(); refetchPending(); }} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative w-full max-w-md">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
              <Input
                placeholder="Search by name, cuisine, or address"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {activeTab === 'pending' && (
                <Badge variant="destructive" className="animate-pulse">
                  Action Required: {filtered.length}
                </Badge>
              )}
              <Badge variant="secondary">{filtered.length} records</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isFetching && <div className="py-8 text-center text-muted-foreground">Loading restaurants...</div>}

          {!isFetching && filtered.length === 0 && (
            <div className="py-12 text-center border-2 border-dashed rounded-lg bg-muted/50">
              <p className="text-lg font-medium text-muted-foreground">
                {activeTab === 'pending' ? "No pending approvals" : "No restaurants found"}
              </p>
              {activeTab === 'pending' && <p className="text-sm text-muted-foreground mt-1">Great job! All restaurants are processed.</p>}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {filtered.map((restaurant) => (
              <div key={restaurant._id} className="group relative border border-border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {/* Image */}
                  <div className="w-full sm:w-32 h-32 sm:h-24 shrink-0 rounded-md overflow-hidden bg-muted relative">
                    {restaurant.image ? (
                      <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                        <Building2 className="w-8 h-8 opacity-20" />
                      </div>
                    )}
                    {activeTab === 'pending' && <div className="absolute inset-0 bg-black/20" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg leading-none mb-1">{restaurant.name}</h3>
                        <p className="text-sm text-muted-foreground">{restaurant.cuisine || "Cuisine not set"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeTab === 'approved' && (
                          <Badge variant={restaurant.isOpen ? "secondary" : "destructive"}>
                            {restaurant.isOpen ? "Open Now" : "Closed"}
                          </Badge>
                        )}
                        {activeTab === 'pending' && (
                          <>
                            <Badge variant="outline" className="border-orange-500 text-orange-500">
                              Pending Approval
                            </Badge>
                            {restaurant.verification?.status === 'requested' && (
                              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">Aadhar Requested</Badge>
                            )}
                            {restaurant.verification?.status === 'submitted' && (
                              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0">Doc Submitted</Badge>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{restaurant.address || "No address"}</span>
                      {restaurant.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{restaurant.phone}</span>}
                    </div>

                    {restaurant.owner && (
                      <div className="text-xs text-muted-foreground/80 mt-1">
                        Owner: {(typeof restaurant.owner === 'object' && restaurant.owner.name) ? restaurant.owner.name : 'Unknown'}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col items-center gap-2 sm:ml-4 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                    {activeTab === 'pending' && (
                      <>
                        {restaurant.verification?.status === 'submitted' ? (
                          <Button onClick={() => setReviewRestaurant(restaurant)} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white shadow-sm">
                            <ShieldAlert className="w-4 h-4 mr-2" />
                            Review Doc
                          </Button>
                        ) : restaurant.verification?.status === 'requested' ? (
                          <Button disabled className="w-full sm:w-auto bg-slate-100 text-slate-400">
                            <Clock className="w-4 h-4 mr-2" />
                            Waiting
                          </Button>
                        ) : (
                          <Button onClick={() => handleRequestVerification(restaurant._id)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                            <ShieldAlert className="w-4 h-4 mr-2" />
                            Request Aadhar
                          </Button>
                        )}

                        {/* Can always force approve if needed, or hide if strict */}
                        {!restaurant.verification?.aadharRequested && (
                          <Button onClick={() => handleApprove(restaurant._id)} variant="outline" className="w-full sm:w-auto">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Quick Approve
                          </Button>
                        )}
                      </>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(restaurant._id)}
                      className="w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {activeTab === 'pending' ? 'Reject' : 'Delete'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Verification Review Modal */}
      <Dialog open={!!reviewRestaurant} onOpenChange={(open) => !open && setReviewRestaurant(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review Verification Document</DialogTitle>
            <DialogDescription>
              Review the Aadhar card submission for {reviewRestaurant?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {reviewRestaurant?.verification?.aadharImage ? (
              <div className="rounded-lg overflow-hidden border border-border bg-slate-50">
                <img
                  src={reviewRestaurant.verification.aadharImage}
                  alt="Aadhar Document"
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground bg-slate-100 rounded-lg">
                No document image found.
              </div>
            )}

            {reviewRestaurant?.verification?.ownerResponse && (
              <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase">Owner Response</span>
                <p className="text-sm mt-1">{reviewRestaurant.verification.ownerResponse}</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setReviewRestaurant(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleRequestVerification(reviewRestaurant!._id)}>
              Register Issue (Re-request)
            </Button>
            <Button onClick={() => handleApprove(reviewRestaurant!._id)} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Verify & Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRestaurants;
