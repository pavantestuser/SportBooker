import { storage } from "../storage";
import { firebaseService } from "./firebase";

interface BookingEligibilityResult {
  eligible: boolean;
  reason?: string;
  restrictions?: string[];
}

interface ExtendedBookingRequest {
  userId: string;
  slotId: string;
  isFullCourt?: boolean;
  consecutiveSlots?: string[];
  requestedDate: string;
}

export class EnhancedBookingService {
  
  async checkAdvancedBookingEligibility(request: ExtendedBookingRequest): Promise<BookingEligibilityResult> {
    const { userId, slotId, isFullCourt, consecutiveSlots, requestedDate } = request;
    
    try {
      // Get slot details with restrictions
      const slot = await storage.getSlot(slotId);
      if (!slot) {
        return { eligible: false, reason: "Slot not found" };
      }

      // Get user details
      const user = await storage.getUser(userId);
      if (!user) {
        return { eligible: false, reason: "User not found" };
      }

      // Get user groups
      const userGroups = await storage.getUserGroups(userId);
      const userGroupIds = userGroups.map(g => g.id);

      // Check slot restrictions if any
      if (slot.restrictionId) {
        const restrictions = await this.getSlotRestrictions(slotId);
        
        for (const restriction of restrictions) {
          // Check group-based restrictions
          if (restriction.restrictionType === 'group_only' && restriction.groupId) {
            if (!userGroupIds.includes(restriction.groupId)) {
              return { 
                eligible: false, 
                reason: "This slot is restricted to specific user groups" 
              };
            }
          }

          // Check one-per-day restrictions
          if (restriction.restrictionType === 'one_per_day') {
            const userBookingsToday = await storage.getUserBookingsForDate(userId, requestedDate);
            if (userBookingsToday.length > 0) {
              return { 
                eligible: false, 
                reason: "You can only book one slot per day for this court" 
              };
            }
          }

          // Check full court booking restrictions
          if (isFullCourt && restriction.restrictionType === 'full_court') {
            if (!restriction.isActive) {
              return { 
                eligible: false, 
                reason: "Full court booking is not allowed for this slot" 
              };
            }
          }

          // Check combinable slots restrictions
          if (consecutiveSlots && consecutiveSlots.length > 1) {
            if (restriction.restrictionType === 'combinable') {
              if (!restriction.isActive || consecutiveSlots.length > slot.maxCombinableSlots) {
                return { 
                  eligible: false, 
                  reason: `You can only combine up to ${slot.maxCombinableSlots} consecutive slots` 
                };
              }
            }
          }
        }
      }

      // Check basic slot availability
      const existingBookings = await storage.getBookingsBySlot(slotId);
      
      if (isFullCourt) {
        // If requesting full court, no other bookings should exist
        if (existingBookings.filter(b => b.status === 'booked').length > 0) {
          return { 
            eligible: false, 
            reason: "Court is already partially booked and cannot be reserved fully" 
          };
        }
      } else {
        // Check if max bookings exceeded
        const activeBookings = existingBookings.filter(b => b.status === 'booked').length;
        if (activeBookings >= slot.maxBookings) {
          return { 
            eligible: false, 
            reason: "This slot is fully booked" 
          };
        }

        // Check if someone has full court booking
        const hasFullCourtBooking = existingBookings.some(b => 
          b.status === 'booked' && b.isFullCourt
        );
        if (hasFullCourtBooking) {
          return { 
            eligible: false, 
            reason: "Court is reserved for full court booking" 
          };
        }
      }

      // Check organization access (public vs private)
      const court = await storage.getCourt(slot.courtId);
      if (court) {
        const facility = await storage.getFacility(court.facilityId);
        if (facility) {
          const organization = await storage.getOrganization(facility.orgId);
          if (organization && organization.type === 'private') {
            // Check if user has access to this private organization
            const userRoles = await storage.getUserRoles(userId);
            const hasOrgAccess = userRoles.some(role => role.orgId === organization.id);
            
            if (!hasOrgAccess) {
              return { 
                eligible: false, 
                reason: "You don't have access to this private organization" 
              };
            }
          }
        }
      }

      return { eligible: true };

    } catch (error) {
      return { 
        eligible: false, 
        reason: "Error checking booking eligibility: " + error.message 
      };
    }
  }

  async processAdvancedBooking(request: ExtendedBookingRequest): Promise<any> {
    // First check eligibility
    const eligibility = await this.checkAdvancedBookingEligibility(request);
    
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason);
    }

    // Create the main booking
    const booking = await storage.createBooking({
      slotId: request.slotId,
      userId: request.userId,
      status: 'booked',
      isFullCourt: request.isFullCourt || false,
      combinedSlots: request.consecutiveSlots || []
    });

    // If consecutive slots are requested, book them all
    if (request.consecutiveSlots && request.consecutiveSlots.length > 1) {
      for (const additionalSlotId of request.consecutiveSlots.slice(1)) {
        await storage.createBooking({
          slotId: additionalSlotId,
          userId: request.userId,
          status: 'booked',
          isFullCourt: false,
          combinedSlots: [booking.id] // Link to main booking
        });
      }
    }

    // Send push notification
    const user = await storage.getUser(request.userId);
    if (user?.fcmToken) {
      await this.sendBookingNotification(user.fcmToken, booking, 'confirmed');
    }

    return booking;
  }

  private async getSlotRestrictions(slotId: string): Promise<any[]> {
    // This would query the slot_restrictions table in a real implementation
    // For now, return empty array as the schema relationship needs to be implemented
    return [];
  }

  async sendBookingNotification(fcmToken: string, booking: any, type: 'confirmed' | 'reminder' | 'cancelled'): Promise<void> {
    const titles = {
      confirmed: "Booking Confirmed! 🎉",
      reminder: "Upcoming Booking Reminder ⏰",
      cancelled: "Booking Cancelled ❌"
    };

    const bodies = {
      confirmed: "Your court booking has been successfully confirmed.",
      reminder: "Your court booking is coming up soon. Don't forget!",
      cancelled: "Your court booking has been cancelled."
    };

    await firebaseService.sendNotification(fcmToken, {
      title: titles[type],
      body: bodies[type],
      data: {
        bookingId: booking.id,
        type: `booking_${type}`,
        slotId: booking.slotId
      }
    });
  }

  async findNearbyAvailableCourts(userLatitude: number, userLongitude: number, radius: number = 10): Promise<any[]> {
    const nearbyCourts = await storage.findNearbyCourts(userLatitude, userLongitude, radius);
    
    // Enhance with availability information
    const courtsWithAvailability = await Promise.all(
      nearbyCourts.map(async (court) => {
        const today = new Date().toISOString().split('T')[0];
        const availableSlots = await storage.getAvailableSlots(court.id, today);
        
        return {
          ...court,
          availableSlots: availableSlots.length,
          nextAvailableTime: availableSlots.length > 0 ? availableSlots[0].startTime : null
        };
      })
    );

    return courtsWithAvailability.filter(court => court.availableSlots > 0);
  }

  async validateCombinedSlotBooking(slotIds: string[]): Promise<boolean> {
    if (slotIds.length <= 1) return true;

    // Check if all slots are consecutive and from the same court
    const slots = await Promise.all(slotIds.map(id => storage.getSlot(id)));
    
    // Verify all slots belong to the same court
    const courtIds = [...new Set(slots.map(slot => slot?.courtId))];
    if (courtIds.length > 1) return false;

    // Sort slots by start time and check if they're consecutive
    const sortedSlots = slots.sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    );

    for (let i = 0; i < sortedSlots.length - 1; i++) {
      const current = sortedSlots[i];
      const next = sortedSlots[i + 1];
      
      if (current.endTime !== next.startTime) {
        return false; // Not consecutive
      }
    }

    return true;
  }
}

export const enhancedBookingService = new EnhancedBookingService();
