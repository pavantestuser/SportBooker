import { storage } from "../storage";

export class BookingService {
  async checkBookingEligibility(userId: string, slotId: string, isFullCourt: boolean = false) {
    const slot = await storage.getSlot(slotId);
    if (!slot) {
      return { eligible: false, reason: "Slot not found" };
    }

    // Get slot restriction details
    let restriction = null;
    if (slot.restrictionId) {
      restriction = await storage.getSlotRestriction(slot.restrictionId);
    }

    // Check if slot is already fully booked
    const existingBookings = await storage.getBookingsBySlot(slotId);
    if (!isFullCourt && existingBookings.length >= slot.maxBookings) {
      return { eligible: false, reason: "Slot is fully booked" };
    }

    // Check if someone has already booked the full court
    const fullCourtBooking = existingBookings.find(b => b.isFullCourt);
    if (fullCourtBooking) {
      return { eligible: false, reason: "Court is reserved for full court booking" };
    }

    // If requesting full court, check if any bookings exist
    if (isFullCourt && existingBookings.length > 0) {
      return { eligible: false, reason: "Cannot book full court - individual bookings exist" };
    }

    // Check restriction rules if they exist
    if (restriction) {
      // Check one per user per day restriction
      if (restriction.onePerUserPerDay) {
        const userBookingsToday = await storage.getUserBookingsForDate(userId, slot.date);
        if (userBookingsToday.length > 0) {
          return { eligible: false, reason: "You can only book one slot per day" };
        }
      }

      // Check full court allowance
      if (isFullCourt && !restriction.allowFullCourt) {
        return { eligible: false, reason: "Full court booking is not allowed for this slot" };
      }

      // Check group restrictions
      if (restriction.restrictedGroups && restriction.restrictedGroups.length > 0) {
        const userGroups = await storage.getUserGroups(userId);
        const userGroupNames = userGroups.map(g => g.name.toLowerCase());
        const hasAccess = restriction.restrictedGroups.some(groupName => 
          userGroupNames.includes(groupName.toLowerCase())
        );
        
        if (!hasAccess) {
          return { eligible: false, reason: "You don't have access to this restricted slot" };
        }
      }
    }

    return { eligible: true, reason: "" };
  }

  async getBookingDetails(bookingId: string) {
    const booking = await storage.getBooking(bookingId);
    if (!booking) return null;

    const slot = await storage.getSlot(booking.slotId);
    const user = await storage.getUser(booking.userId);
    const payment = await storage.getPaymentByBooking(booking.id);
    
    return {
      booking,
      slot,
      user,
      payment
    };
  }

  async cancelBooking(bookingId: string, userId: string) {
    const booking = await storage.getBooking(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.userId !== userId) {
      throw new Error("You can only cancel your own bookings");
    }

    if (booking.status === 'cancelled') {
      throw new Error("Booking is already cancelled");
    }

    await storage.updateBookingStatus(bookingId, 'cancelled');
    
    // Update payment status
    const payment = await storage.getPaymentByBooking(bookingId);
    if (payment && payment.status === 'paid') {
      // In real app, would initiate refund process
      await storage.updatePaymentStatus(payment.id, 'failed'); // Temporary status for refund
    }

    return { message: "Booking cancelled successfully" };
  }
}

export const bookingService = new BookingService();
