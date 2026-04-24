import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminTracking = () => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <p className="text-sm text-muted-foreground">Admin view</p>
                    <h1 className="text-xl font-semibold text-foreground">Active Delivery Tracking</h1>
                </div>
            </div>

            <Card className="border-border">
                <CardHeader className="pb-3">
                    <CardTitle>Live Map Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This module is currently being configured. Administrative tracking and dispatch features will be available in an upcoming update.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminTracking;
