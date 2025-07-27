import { storage } from "../storage";
import { Coupon } from "@shared/schema";

export class CouponService {
  async validateCoupon(code: string, orderAmount: number) {
    const coupon = await storage.getCouponByCode(code);
    
    if (!coupon) {
      return { valid: false, message: "Invalid coupon code" };
    }

    if (!coupon.isActive) {
      return { valid: false, message: "Coupon is inactive" };
    }

    if (coupon.expiryDate < new Date()) {
      return { valid: false, message: "Coupon has expired" };
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, message: "Coupon usage limit reached" };
    }

    if (orderAmount < parseFloat(coupon.minOrderAmount)) {
      return { 
        valid: false, 
        message: `Minimum order amount of ₹${coupon.minOrderAmount} required` 
      };
    }

    const discountAmount = this.calculateDiscount(coupon, orderAmount);
    
    return {
      valid: true,
      coupon,
      discountAmount,
      finalAmount: orderAmount - discountAmount
    };
  }

  calculateDiscount(coupon: Coupon, orderAmount: number): number {
    switch (coupon.type) {
      case 'fixed_amount':
        return Math.min(parseFloat(coupon.discountValue), orderAmount);
      
      case 'percentage':
        return (orderAmount * parseFloat(coupon.discountValue)) / 100;
      
      case 'free_booking':
        return orderAmount; // 100% discount
      
      case 'conditional':
        // For conditional discounts, the discount value is applied if min order is met
        if (orderAmount >= parseFloat(coupon.minOrderAmount)) {
          return parseFloat(coupon.discountValue);
        }
        return 0;
      
      default:
        return 0;
    }
  }

  async applyCoupon(couponId: string, orderAmount: number) {
    const coupon = await storage.getCoupon(couponId);
    if (!coupon) {
      throw new Error("Coupon not found");
    }

    const validation = await this.validateCoupon(coupon.code, orderAmount);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    // Increment usage count
    await storage.updateCouponUsage(coupon.id, coupon.usedCount + 1);

    return {
      discountAmount: validation.discountAmount,
      finalAmount: validation.finalAmount
    };
  }

  async getCouponStats(couponId: string) {
    const coupon = await storage.getCoupon(couponId);
    if (!coupon) {
      throw new Error("Coupon not found");
    }

    return {
      code: coupon.code,
      type: coupon.type,
      usedCount: coupon.usedCount,
      usageLimit: coupon.usageLimit,
      remainingUses: coupon.usageLimit - coupon.usedCount,
      isActive: coupon.isActive,
      expiryDate: coupon.expiryDate
    };
  }
}

export const couponService = new CouponService();
