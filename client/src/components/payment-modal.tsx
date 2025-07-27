import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Smartphone, Wallet, Lock, X, CheckCircle } from "lucide-react";

interface PaymentModalProps {
  bookingDetails: {
    court: string;
    date: string;
    time: string;
    totalAmount: number;
    discountAmount: number;
    couponCode?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ bookingDetails, onClose, onSuccess }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, this would integrate with payment gateway
      toast({
        title: "Payment Successful!",
        description: `₹${bookingDetails.totalAmount.toFixed(0)} paid successfully via ${getPaymentMethodName()}`,
      });
      
      onSuccess();
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Please try again or use a different payment method",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentMethodName = () => {
    switch (paymentMethod) {
      case "upi": return "UPI";
      case "card": return "Card";
      case "wallet": return "Wallet";
      default: return "Payment Method";
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "upi": return <Smartphone className="h-5 w-5 text-sporty-blue" />;
      case "card": return <CreditCard className="h-5 w-5 text-sporty-blue" />;
      case "wallet": return <Wallet className="h-5 w-5 text-sporty-blue" />;
      default: return <CreditCard className="h-5 w-5 text-sporty-blue" />;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center">
              <CreditCard className="h-6 w-6 mr-2 text-sporty-blue" />
              Complete Payment
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Complete your booking payment securely
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Summary */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-dark-gray">{bookingDetails.court}</span>
                  <Badge className="bg-fresh-green">Confirmed</Badge>
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(bookingDetails.date).toLocaleDateString()} | {bookingDetails.time}
                </div>
                {bookingDetails.couponCode && (
                  <div className="text-sm text-fresh-green font-medium">
                    Coupon Applied: {bookingDetails.couponCode} (-₹{bookingDetails.discountAmount})
                  </div>
                )}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total Amount:</span>
                    <span className="text-lg">₹{bookingDetails.totalAmount.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <div>
            <h3 className="font-semibold text-dark-gray mb-3">Select Payment Method</h3>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="space-y-3">
                <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-sporty-blue cursor-pointer">
                  <RadioGroupItem value="upi" id="upi" />
                  <Label htmlFor="upi" className="ml-3 flex items-center flex-1 cursor-pointer">
                    <Smartphone className="h-5 w-5 text-sporty-blue mr-3" />
                    <div>
                      <p className="font-medium">UPI Payment</p>
                      <p className="text-xs text-gray-500">Pay using any UPI app</p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-sporty-blue cursor-pointer">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="ml-3 flex items-center flex-1 cursor-pointer">
                    <CreditCard className="h-5 w-5 text-sporty-blue mr-3" />
                    <div>
                      <p className="font-medium">Credit/Debit Card</p>
                      <p className="text-xs text-gray-500">Visa, Mastercard, RuPay</p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-sporty-blue cursor-pointer">
                  <RadioGroupItem value="wallet" id="wallet" />
                  <Label htmlFor="wallet" className="ml-3 flex items-center flex-1 cursor-pointer">
                    <Wallet className="h-5 w-5 text-sporty-blue mr-3" />
                    <div>
                      <p className="font-medium">Digital Wallet</p>
                      <p className="text-xs text-gray-500">Paytm, PhonePe, Amazon Pay</p>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Payment Actions */}
          <div className="space-y-3">
            <Button
              className="w-full btn-primary"
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing Payment...
                </div>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Pay ₹{bookingDetails.totalAmount.toFixed(0)} Securely
                </>
              )}
            </Button>

            <div className="flex items-center justify-center text-xs text-gray-500">
              <Lock className="h-3 w-3 mr-1" />
              Your payment is secured with 256-bit SSL encryption
            </div>
          </div>

          {/* Payment Features */}
          <div className="bg-blue-50 rounded-lg p-3">
            <h4 className="font-medium text-dark-gray mb-2 flex items-center">
              <CheckCircle className="h-4 w-4 text-fresh-green mr-2" />
              What happens next?
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Instant booking confirmation</li>
              <li>• Push notification with booking details</li>
              <li>• Email receipt and booking reminder</li>
              <li>• QR code for court entry</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
