import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tag, Plus, Percent, IndianRupee, Calendar, Users, TrendingUp } from "lucide-react";
import CouponForm from "@/components/coupon-form";

export default function Coupons() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['/api/coupons'],
  });

  const { data: userInfo } = useQuery({
    queryKey: ['/api/me'],
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (couponId: string) => {
      const response = await apiRequest("DELETE", `/api/coupons/${couponId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coupons'] });
      toast({
        title: "Coupon Deleted",
        description: "Coupon has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete coupon",
        variant: "destructive",
      });
    },
  });

  const filteredCoupons = coupons?.filter((coupon: any) => {
    if (filterType === "all") return true;
    if (filterType === "active") return coupon.isActive && new Date(coupon.expiryDate) > new Date();
    if (filterType === "expired") return new Date(coupon.expiryDate) <= new Date();
    return coupon.type === filterType;
  }) || [];

  const canManageCoupons = ['app_admin', 'org_admin'].includes(userInfo?.currentRole || '');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-dark-gray">Coupons & Discounts</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-dark-gray">Coupons & Discounts</h1>
          <p className="text-gray-600 mt-1">Manage promotional coupons and discount codes</p>
        </div>
        {canManageCoupons && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-accent text-dark-gray">
                <Plus className="h-4 w-4 mr-2" />
                Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-vibrant-yellow" />
                  Create New Coupon
                </DialogTitle>
              </DialogHeader>
              <CouponForm onSuccess={() => setIsCreateDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-light">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Coupons</p>
                <p className="text-2xl font-bold text-dark-gray">{coupons?.length || 0}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Tag className="h-6 w-6 text-vibrant-yellow" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <TrendingUp className="h-4 w-4 text-fresh-green mr-1" />
              <span className="text-fresh-green text-sm font-medium">+5</span>
              <span className="text-gray-600 text-sm ml-1">this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-light">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Coupons</p>
                <p className="text-2xl font-bold text-dark-gray">
                  {filteredCoupons.filter((c: any) => c.isActive && new Date(c.expiryDate) > new Date()).length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-fresh-green" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-light">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Usage</p>
                <p className="text-2xl font-bold text-dark-gray">
                  {coupons?.reduce((sum: number, c: any) => sum + c.usedCount, 0) || 0}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-sporty-blue" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-light">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Savings Given</p>
                <p className="text-2xl font-bold text-dark-gray">₹12,450</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <IndianRupee className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterType === "all" ? "default" : "outline"}
          onClick={() => setFilterType("all")}
          className={filterType === "all" ? "btn-primary" : ""}
        >
          All Coupons
        </Button>
        <Button
          variant={filterType === "active" ? "default" : "outline"}
          onClick={() => setFilterType("active")}
          className={filterType === "active" ? "btn-secondary" : ""}
        >
          Active
        </Button>
        <Button
          variant={filterType === "expired" ? "default" : "outline"}
          onClick={() => setFilterType("expired")}
          className={filterType === "expired" ? "bg-red-500 text-white hover:bg-red-600" : ""}
        >
          Expired
        </Button>
        <Button
          variant={filterType === "fixed_amount" ? "default" : "outline"}
          onClick={() => setFilterType("fixed_amount")}
          className={filterType === "fixed_amount" ? "btn-accent text-dark-gray" : ""}
        >
          Fixed Amount
        </Button>
        <Button
          variant={filterType === "percentage" ? "default" : "outline"}
          onClick={() => setFilterType("percentage")}
        >
          Percentage
        </Button>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCoupons.map((coupon: any) => (
          <CouponCard
            key={coupon.id}
            coupon={coupon}
            onDelete={() => deleteCouponMutation.mutate(coupon.id)}
            canManage={canManageCoupons}
          />
        ))}
      </div>

      {filteredCoupons.length === 0 && (
        <Card className="card-light">
          <CardContent className="text-center py-12">
            <Tag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-dark-gray mb-2">No Coupons Found</h3>
            <p className="text-gray-600 mb-4">
              {filterType === "all" 
                ? "No coupons have been created yet."
                : `No ${filterType} coupons found.`
              }
            </p>
            {canManageCoupons && (
              <Button className="btn-accent text-dark-gray" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Coupon
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CouponCard({ coupon, onDelete, canManage }: { 
  coupon: any; 
  onDelete: () => void;
  canManage: boolean;
}) {
  const isExpired = new Date(coupon.expiryDate) <= new Date();
  const isExhausted = coupon.usedCount >= coupon.usageLimit;
  const isActive = coupon.isActive && !isExpired && !isExhausted;

  const getTypeIcon = () => {
    switch (coupon.type) {
      case 'percentage': return <Percent className="h-4 w-4" />;
      case 'fixed_amount': return <IndianRupee className="h-4 w-4" />;
      case 'free_booking': return <Tag className="h-4 w-4" />;
      default: return <Tag className="h-4 w-4" />;
    }
  };

  const getDiscountText = () => {
    switch (coupon.type) {
      case 'percentage': return `${coupon.discountValue}% OFF`;
      case 'fixed_amount': return `₹${coupon.discountValue} OFF`;
      case 'free_booking': return 'FREE BOOKING';
      case 'conditional': return `₹${coupon.discountValue} OFF`;
      default: return 'DISCOUNT';
    }
  };

  return (
    <Card className={`card-light border-l-4 ${
      isActive ? 'border-l-fresh-green' : 
      isExpired ? 'border-l-red-500' : 'border-l-gray-300'
    }`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-full ${
              isActive ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {getTypeIcon()}
            </div>
            <div>
              <CardTitle className="text-lg font-bold">{coupon.code}</CardTitle>
              <CardDescription className="text-vibrant-yellow font-semibold">
                {getDiscountText()}
              </CardDescription>
            </div>
          </div>
          <Badge variant={isActive ? 'default' : 'secondary'} 
                 className={isActive ? 'bg-fresh-green' : ''}>
            {isActive ? 'Active' : isExpired ? 'Expired' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Usage:</span>
            <span className="font-medium">
              {coupon.usedCount} / {coupon.usageLimit}
            </span>
          </div>
          
          {coupon.minOrderAmount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Min Order:</span>
              <span className="font-medium">₹{coupon.minOrderAmount}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Expires:</span>
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1 text-gray-400" />
              <span className="font-medium">
                {new Date(coupon.expiryDate).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          {/* Usage Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Usage Progress</span>
              <span>{Math.round((coupon.usedCount / coupon.usageLimit) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-sporty-blue h-2 rounded-full"
                style={{ width: `${Math.min((coupon.usedCount / coupon.usageLimit) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
          
          {canManage && (
            <div className="flex space-x-2 pt-2">
              <Button size="sm" variant="outline" className="flex-1">
                Edit
              </Button>
              <Button size="sm" variant="destructive" onClick={onDelete}>
                Delete
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
