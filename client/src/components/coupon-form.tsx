import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tag, Save, Percent, IndianRupee, Gift } from "lucide-react";

interface CouponFormProps {
  onSuccess?: () => void;
  editingCoupon?: any;
}

export default function CouponForm({ onSuccess, editingCoupon }: CouponFormProps) {
  const [formData, setFormData] = useState({
    code: editingCoupon?.code || "",
    type: editingCoupon?.type || "fixed_amount",
    discountValue: editingCoupon?.discountValue || "",
    minOrderAmount: editingCoupon?.minOrderAmount || "0",
    usageLimit: editingCoupon?.usageLimit || "100",
    expiryDate: editingCoupon?.expiryDate 
      ? new Date(editingCoupon.expiryDate).toISOString().split('T')[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    description: editingCoupon?.description || "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createCouponMutation = useMutation({
    mutationFn: async (couponData: any) => {
      const response = await apiRequest("POST", "/api/coupons", couponData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coupons'] });
      toast({
        title: "Coupon Created",
        description: "New coupon has been successfully created.",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create coupon",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.code || !formData.type || !formData.discountValue || !formData.expiryDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Format expiry date
    const expiryDate = new Date(formData.expiryDate + "T23:59:59.999Z");

    const couponData = {
      code: formData.code.toUpperCase(),
      type: formData.type,
      discountValue: formData.discountValue,
      minOrderAmount: formData.minOrderAmount || "0",
      usageLimit: parseInt(formData.usageLimit) || 1,
      expiryDate: expiryDate.toISOString(),
      isActive: true,
    };

    createCouponMutation.mutate(couponData);
  };

  const getCouponIcon = () => {
    switch (formData.type) {
      case 'percentage': return <Percent className="h-5 w-5 text-vibrant-yellow" />;
      case 'fixed_amount': return <IndianRupee className="h-5 w-5 text-fresh-green" />;
      case 'free_booking': return <Gift className="h-5 w-5 text-sporty-blue" />;
      default: return <Tag className="h-5 w-5 text-vibrant-yellow" />;
    }
  };

  const getDiscountLabel = () => {
    switch (formData.type) {
      case 'percentage': return 'Discount Percentage (%)';
      case 'fixed_amount': return 'Discount Amount (₹)';
      case 'free_booking': return 'Free Booking (100% discount)';
      case 'conditional': return 'Conditional Discount Amount (₹)';
      default: return 'Discount Value';
    }
  };

  const getPreviewText = () => {
    if (!formData.discountValue) return "Enter discount value";
    
    switch (formData.type) {
      case 'percentage': return `${formData.discountValue}% OFF`;
      case 'fixed_amount': return `₹${formData.discountValue} OFF`;
      case 'free_booking': return 'FREE BOOKING';
      case 'conditional': return `₹${formData.discountValue} OFF when you spend ₹${formData.minOrderAmount || 0}+`;
      default: return formData.discountValue;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Coupon Preview */}
      <div className="bg-gradient-to-r from-vibrant-yellow to-fresh-green p-6 rounded-lg text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getCouponIcon()}
            <div>
              <h3 className="text-xl font-bold">
                {formData.code || "COUPON_CODE"}
              </h3>
              <p className="text-sm opacity-90">
                {getPreviewText()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">Valid until</p>
            <p className="font-semibold">
              {formData.expiryDate ? new Date(formData.expiryDate).toLocaleDateString() : "Select date"}
            </p>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="code">Coupon Code *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
            placeholder="SPORTS50"
            className="font-mono"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Must be unique and memorable</p>
        </div>
        
        <div>
          <Label htmlFor="type">Discount Type *</Label>
          <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed_amount">Fixed Amount (₹)</SelectItem>
              <SelectItem value="percentage">Percentage (%)</SelectItem>
              <SelectItem value="free_booking">Free Booking (100%)</SelectItem>
              <SelectItem value="conditional">Conditional Discount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Discount Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="discountValue">{getDiscountLabel()} *</Label>
          <Input
            id="discountValue"
            type="number"
            value={formData.discountValue}
            onChange={(e) => handleInputChange("discountValue", e.target.value)}
            placeholder={formData.type === 'percentage' ? '20' : '500'}
            min="0"
            max={formData.type === 'percentage' ? '100' : undefined}
            step={formData.type === 'percentage' ? '1' : '0.01'}
            disabled={formData.type === 'free_booking'}
            required
          />
          {formData.type === 'free_booking' && (
            <p className="text-xs text-gray-500 mt-1">Free booking provides 100% discount</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="minOrderAmount">Minimum Order Amount (₹)</Label>
          <Input
            id="minOrderAmount"
            type="number"
            value={formData.minOrderAmount}
            onChange={(e) => handleInputChange("minOrderAmount", e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
          />
          <p className="text-xs text-gray-500 mt-1">Minimum cart value to apply coupon</p>
        </div>
      </div>

      {/* Usage and Expiry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="usageLimit">Usage Limit</Label>
          <Input
            id="usageLimit"
            type="number"
            value={formData.usageLimit}
            onChange={(e) => handleInputChange("usageLimit", e.target.value)}
            placeholder="100"
            min="1"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Total number of times this coupon can be used</p>
        </div>
        
        <div>
          <Label htmlFor="expiryDate">Expiry Date *</Label>
          <Input
            id="expiryDate"
            type="date"
            value={formData.expiryDate}
            onChange={(e) => handleInputChange("expiryDate", e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Special discount for sports enthusiasts..."
          rows={3}
        />
      </div>

      {/* Coupon Details Summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <h4 className="font-medium text-dark-gray">Coupon Summary:</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Code: <span className="font-mono font-semibold">{formData.code || "Not set"}</span></p>
          <p>• Discount: <span className="text-fresh-green font-semibold">{getPreviewText()}</span></p>
          <p>• Min Order: <span className="font-semibold">₹{formData.minOrderAmount || 0}</span></p>
          <p>• Usage Limit: <span className="font-semibold">{formData.usageLimit || 0} times</span></p>
          <p>• Valid Until: <span className="font-semibold">
            {formData.expiryDate ? new Date(formData.expiryDate).toLocaleDateString() : "Not set"}
          </span></p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="btn-secondary"
          disabled={createCouponMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          {createCouponMutation.isPending ? "Creating..." : "Create Coupon"}
        </Button>
      </div>
    </form>
  );
}
