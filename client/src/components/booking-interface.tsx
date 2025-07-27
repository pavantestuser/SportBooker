import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Clock, Users, MapPin, Tag, CreditCard, Check, AlertCircle } from "lucide-react";
import PaymentModal from "./payment-modal";

interface BookingInterfaceProps {
  court: any;
  selectedDate: string;
  onClose: () => void;
}

export default function BookingInterface({ court, selectedDate, onClose }: BookingInterfaceProps) {
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [bookingType, setBookingType] = useState<string>("single");
  const [couponCode, setCouponCode] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ['/api/courts', court.id, 'slots'],
    queryParams: { date: selectedDate },
  });

  const { data: userInfo } = useQuery({
    queryKey: ['/api/me'],
  });

  const validateCouponMutation = useMutation({
    mutationFn: async ({ code, amount }: { code: string; amount: number }) => {
      const response = await apiRequest("POST", "/api/coupons/validate", { code, amount });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.valid) {
        setAppliedCoupon(data);
        toast({
          title: "Coupon Applied!",
          description: `${data.coupon.code} applied! ₹${data.discountAmount} discount`,
        });
      } else {
        toast({
          title: "Invalid Coupon",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Validation Failed",
        description: error.message || "Failed to validate coupon",
        variant: "destructive",
      });
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/courts', court.id, 'slots'] });
      setShowPaymentModal(true);
      toast({
        title: "Booking Created!",
        description: "Your booking has been created. Complete payment to confirm.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast({
        title: "Enter Coupon Code",
        description: "Please enter a coupon code to apply",
        variant: "destructive",
      });
      return;
    }

    const selectedSlot = slots?.find((s: any) => s.id === selectedSlotId);
    if (!selectedSlot) {
      toast({
        title: "Select Slot",
        description: "Please select a slot before applying coupon",
        variant: "destructive",
      });
      return;
    }

    const amount = calculateTotalAmount();
    validateCouponMutation.mutate({ code: couponCode, amount });
  };

  const calculateSlotPrice = () => {
    const selectedSlot = slots?.find((s: any) => s.id === selectedSlotId);
    if (!selectedSlot) return 0;

    const basePrice = parseFloat(selectedSlot.price);
    
    switch (bookingType) {
      case "double":
        return basePrice * 2 * 0.95; // 5% discount for 2 hours
      case "full":
        return basePrice * 2.4; // Premium for full court
      default:
        return basePrice;
    }
  };

  const calculateTotalAmount = () => {
    const slotPrice = calculateSlotPrice();
    const platformFee = slotPrice * 0.05; // 5% platform fee
    return slotPrice + platformFee;
  };

  const calculateFinalAmount = () => {
    const totalAmount = calculateTotalAmount();
    const discountAmount = appliedCoupon?.discountAmount || 0;
    return Math.max(0, totalAmount - discountAmount);
  };

  const handleProceedToPayment = () => {
    if (!selectedSlotId) {
      toast({
        title: "Select Slot",
        description: "Please select a time slot to proceed",
        variant: "destructive",
      });
      return;
    }

    const bookingData = {
      slotId: selectedSlotId,
      isFullCourt: bookingType === "full",
      consecutiveSlots: bookingType === "double" ? [selectedSlotId] : [],
      couponId: appliedCoupon?.coupon?.id,
      originalAmount: calculateTotalAmount().toString(),
    };

    createBookingMutation.mutate(bookingData);
  };

  const selectedSlot = slots?.find((s: any) => s.id === selectedSlotId);

  if (slotsLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading slots...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sporty-blue"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Calendar className="h-6 w-6 mr-2 text-fresh-green" />
              Book Your Slot - {court.name}
            </DialogTitle>
            <DialogDescription>
              Select your preferred time slot and booking options
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Slots */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-dark-gray">Available Slots</h3>
              
              {slots && slots.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {slots.map((slot: any) => (
                    <div
                      key={slot.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedSlotId === slot.id
                          ? 'border-sporty-blue bg-blue-50'
                          : 'border-gray-200 hover:border-sporty-blue'
                      }`}
                      onClick={() => setSelectedSlotId(slot.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            selectedSlotId === slot.id ? 'bg-sporty-blue' : 'bg-fresh-green'
                          }`}></div>
                          <div>
                            <p className="font-medium text-dark-gray">
                              {slot.startTime} - {slot.endTime}
                            </p>
                            <p className="text-sm text-gray-600">₹{slot.price}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-fresh-green text-white">
                          Available
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No slots available for this date</p>
                </div>
              )}
            </div>

            {/* Booking Options */}
            <div className="space-y-6">
              {/* Court Info */}
              <Card className="card-light">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-sporty-blue" />
                    Court Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Court:</span>
                      <span className="font-medium">{court.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">
                        {new Date(selectedDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Players Required:</span>
                      <Badge variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {court.playersRequired}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Type Selection */}
              {selectedSlot && (
                <Card className="card-light">
                  <CardHeader>
                    <CardTitle className="text-lg">Booking Options</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={bookingType} onValueChange={setBookingType}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="single" id="single" />
                        <Label htmlFor="single" className="flex-1">
                          Single Slot (1 hour) - ₹{selectedSlot.price}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="double" id="double" />
                        <Label htmlFor="double" className="flex-1">
                          Extended (2 hours) - ₹{(parseFloat(selectedSlot.price) * 2 * 0.95).toFixed(0)}
                          <span className="text-fresh-green ml-2">(5% discount)</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="full" id="full" />
                        <Label htmlFor="full" className="flex-1">
                          Full Court Booking - ₹{(parseFloat(selectedSlot.price) * 2.4).toFixed(0)}
                          <Badge className="bg-vibrant-yellow text-dark-gray ml-2">Exclusive</Badge>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              {/* Coupon Application */}
              {selectedSlot && (
                <Card className="card-light">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Tag className="h-5 w-5 mr-2 text-vibrant-yellow" />
                      Apply Coupon Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1"
                      />
                      <Button 
                        className="btn-accent text-dark-gray"
                        onClick={handleApplyCoupon}
                        disabled={validateCouponMutation.isPending}
                      >
                        {validateCouponMutation.isPending ? "Validating..." : "Apply"}
                      </Button>
                    </div>

                    {appliedCoupon && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                        <Check className="h-4 w-4 text-fresh-green mr-2" />
                        <span className="text-sm text-fresh-green font-medium">
                          Coupon "{appliedCoupon.coupon.code}" applied! ₹{appliedCoupon.discountAmount} discount
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Price Breakdown */}
              {selectedSlot && (
                <Card className="card-light">
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Slot Price:</span>
                        <span>₹{calculateSlotPrice().toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Platform Fee (5%):</span>
                        <span>₹{(calculateSlotPrice() * 0.05).toFixed(0)}</span>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between text-sm text-fresh-green">
                          <span>Coupon Discount:</span>
                          <span>-₹{appliedCoupon.discountAmount}</span>
                        </div>
                      )}
                      <hr className="my-2" />
                      <div className="flex justify-between font-semibold">
                        <span>Total Amount:</span>
                        <span>₹{calculateFinalAmount().toFixed(0)}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full mt-4 btn-primary"
                      onClick={handleProceedToPayment}
                      disabled={!selectedSlotId || createBookingMutation.isPending}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {createBookingMutation.isPending ? "Creating Booking..." : "Proceed to Payment"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          bookingDetails={{
            court: court.name,
            date: selectedDate,
            time: selectedSlot ? `${selectedSlot.startTime} - ${selectedSlot.endTime}` : '',
            totalAmount: calculateFinalAmount(),
            discountAmount: appliedCoupon?.discountAmount || 0,
            couponCode: appliedCoupon?.coupon?.code,
          }}
          onClose={() => {
            setShowPaymentModal(false);
            onClose();
          }}
          onSuccess={() => {
            setShowPaymentModal(false);
            onClose();
            toast({
              title: "Payment Successful!",
              description: "Your booking has been confirmed. You'll receive a confirmation notification.",
            });
          }}
        />
      )}
    </>
  );
}
