import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAdminAuth } from '../../admin/AdminAuthContext';
import { Save, Loader2, IndianRupee } from 'lucide-react';

const Settings = () => {
    const [commissionRate, setCommissionRate] = useState<string>('15');
    const [taxRate, setTaxRate] = useState<string>('5');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { token } = useAdminAuth();
    const { toast } = useToast();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        fetchSettings();
    }, [token]);

    const fetchSettings = async () => {
        try {
            const response = await fetch(`${API_URL}/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCommissionRate(data.commissionRate.toString());
                if (data.taxRate !== undefined) {
                    setTaxRate(data.taxRate.toString());
                }
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast({
                title: "Error",
                description: "Failed to load settings",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const commRate = parseFloat(commissionRate);
            const tRate = parseFloat(taxRate);
            if (isNaN(commRate) || commRate < 0 || commRate > 100) {
                toast({
                    title: "Invalid Input",
                    description: "Commission rate must be between 0 and 100",
                    variant: "destructive"
                });
                return;
            }
            if (isNaN(tRate) || tRate < 0 || tRate > 100) {
                toast({
                    title: "Invalid Input",
                    description: "Tax rate must be between 0 and 100",
                    variant: "destructive"
                });
                return;
            }

            const response = await fetch(`${API_URL}/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ commissionRate: commRate, taxRate: tRate })
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Settings updated successfully",
                });
            } else {
                throw new Error('Failed to update');
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            toast({
                title: "Error",
                description: "Failed to update settings",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>

            <div className="grid gap-6 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IndianRupee className="w-5 h-5" />
                            Commission Configuration
                        </CardTitle>
                        <CardDescription>
                            Set the percentage markup added to menu items. This determines the Admin's earning.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="commission">Commission Rate (%)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="commission"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={commissionRate}
                                    onChange={(e) => setCommissionRate(e.target.value)}
                                    className="max-w-[200px]"
                                />
                                <span className="text-muted-foreground">%</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                Example: If Base Price is 100 and Rate is 15%, Customer Price will be 115.
                            </p>
                        </div>

                        <div className="grid w-full items-center gap-1.5 pt-4 border-t">
                            <Label htmlFor="tax">Tax Rate (%)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="tax"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={taxRate}
                                    onChange={(e) => setTaxRate(e.target.value)}
                                    className="max-w-[200px]"
                                />
                                <span className="text-muted-foreground">%</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                Example: Rate is 5%, it will be applied on the final total of the user's order.
                            </p>
                        </div>

                        <Button onClick={handleSave} disabled={saving} className="mt-4">
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Settings;
