import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import session from "express-session";
import { insertUserSchema, insertOrganizationSchema, insertFacilitySchema, insertCourtSchema, insertSlotSchema, insertCouponSchema, insertBookingSchema, insertSlotRestrictionSchema } from "@shared/schema";
import { authService } from "./services/auth";
import { bookingService } from "./services/booking";
import { couponService } from "./services/coupon";
import { firebaseService } from "./services/firebase";

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    currentRole?: string;
    currentOrgId?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'sports-booking-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Role-based access middleware
  const requireRole = (allowedRoles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!allowedRoles.includes(req.session.currentRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      next();
    };
  };

  // Auth routes
  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        passwordHash,
        password: undefined
      });

      // Auto-add to gender-based group if organization context provided
      if (req.body.orgId && userData.gender && userData.gender !== 'prefer_not_to_say') {
        const genderGroups = await storage.getGroupsByOrg(req.body.orgId);
        const genderGroup = genderGroups.find(g => 
          g.name.toLowerCase().includes(userData.gender?.toLowerCase() || '')
        );
        
        if (genderGroup) {
          await storage.addUserToGroup({
            userId: user.id,
            groupId: genderGroup.id
          });
        }
      }

      res.json({ message: "User registered successfully", userId: user.id });
    } catch (error) {
      res.status(400).json({ message: "Registration failed", error: error.message });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const roles = await storage.getUserRoles(user.id);
      
      req.session.userId = user.id;
      req.session.currentRole = roles[0]?.role || 'user';
      req.session.currentOrgId = roles[0]?.orgId;

      res.json({ 
        message: "Login successful", 
        user: { id: user.id, username: user.username, fullName: user.fullName, email: user.email },
        roles,
        currentRole: req.session.currentRole
      });
    } catch (error) {
      res.status(400).json({ message: "Login failed", error: error.message });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.post("/api/switch-role", requireAuth, async (req, res) => {
    try {
      const { role, orgId } = req.body;
      const roles = await storage.getUserRoles(req.session.userId!);
      
      const hasRole = roles.some(r => r.role === role && (!orgId || r.orgId === orgId));
      if (!hasRole) {
        return res.status(403).json({ message: "Role not available" });
      }

      req.session.currentRole = role;
      req.session.currentOrgId = orgId;
      
      res.json({ message: "Role switched successfully", currentRole: role, currentOrgId: orgId });
    } catch (error) {
      res.status(400).json({ message: "Role switch failed", error: error.message });
    }
  });

  app.get("/api/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      const roles = await storage.getUserRoles(req.session.userId!);
      
      res.json({ 
        user: { id: user!.id, username: user!.username, fullName: user!.fullName, email: user!.email },
        roles,
        currentRole: req.session.currentRole,
        currentOrgId: req.session.currentOrgId
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user info" });
    }
  });

  // Organization routes
  app.get("/api/organizations", requireAuth, async (req, res) => {
    try {
      const organizations = await storage.getOrganizations();
      res.json(organizations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  app.post("/api/organizations", requireAuth, requireRole(['app_admin']), async (req, res) => {
    try {
      const orgData = insertOrganizationSchema.parse(req.body);
      const organization = await storage.createOrganization(orgData);
      res.json(organization);
    } catch (error) {
      res.status(400).json({ message: "Failed to create organization", error: error.message });
    }
  });

  // Facility routes
  app.get("/api/organizations/:orgId/facilities", requireAuth, async (req, res) => {
    try {
      const facilities = await storage.getFacilitiesByOrg(req.params.orgId);
      res.json(facilities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch facilities" });
    }
  });

  app.post("/api/facilities", requireAuth, requireRole(['app_admin', 'org_admin', 'staff']), async (req, res) => {
    try {
      const facilityData = insertFacilitySchema.parse(req.body);
      const facility = await storage.createFacility(facilityData);
      res.json(facility);
    } catch (error) {
      res.status(400).json({ message: "Failed to create facility", error: error.message });
    }
  });

  // Court routes
  app.get("/api/facilities/:facilityId/courts", requireAuth, async (req, res) => {
    try {
      const courts = await storage.getCourtsByFacility(req.params.facilityId);
      res.json(courts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch courts" });
    }
  });

  app.post("/api/courts", requireAuth, requireRole(['app_admin', 'org_admin', 'staff']), async (req, res) => {
    try {
      const courtData = insertCourtSchema.parse(req.body);
      const court = await storage.createCourt(courtData);
      res.json(court);
    } catch (error) {
      res.status(400).json({ message: "Failed to create court", error: error.message });
    }
  });

  // Slot Restriction routes
  app.get("/api/slot-restrictions", requireAuth, async (req, res) => {
    try {
      const restrictions = await storage.getSlotRestrictions();
      res.json(restrictions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch slot restrictions" });
    }
  });

  app.post("/api/slot-restrictions", requireAuth, requireRole(['app_admin', 'org_admin', 'staff']), async (req, res) => {
    try {
      const restrictionData = insertSlotRestrictionSchema.parse(req.body);
      const restriction = await storage.createSlotRestriction(restrictionData);
      res.json(restriction);
    } catch (error) {
      res.status(400).json({ message: "Failed to create slot restriction", error: error.message });
    }
  });

  // Slot routes
  app.get("/api/courts/:courtId/slots", requireAuth, async (req, res) => {
    try {
      const { date } = req.query;
      const slots = date 
        ? await storage.getSlotsByDate(req.params.courtId, date as string)
        : await storage.getAvailableSlots(req.params.courtId, new Date().toISOString().split('T')[0]);
      res.json(slots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch slots" });
    }
  });

  app.post("/api/slots", requireAuth, requireRole(['app_admin', 'org_admin', 'staff']), async (req, res) => {
    try {
      const slotData = insertSlotSchema.parse(req.body);
      const slot = await storage.createSlot(slotData);
      res.json(slot);
    } catch (error) {
      res.status(400).json({ message: "Failed to create slot", error: error.message });
    }
  });

  // Coupon routes
  app.get("/api/coupons", requireAuth, requireRole(['app_admin', 'org_admin']), async (req, res) => {
    try {
      const coupons = await storage.getCoupons();
      res.json(coupons);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coupons" });
    }
  });

  app.post("/api/coupons", requireAuth, requireRole(['app_admin', 'org_admin']), async (req, res) => {
    try {
      const couponData = insertCouponSchema.parse(req.body);
      const coupon = await storage.createCoupon({
        ...couponData,
        code: couponData.code.toUpperCase()
      });
      res.json(coupon);
    } catch (error) {
      res.status(400).json({ message: "Failed to create coupon", error: error.message });
    }
  });

  app.post("/api/coupons/validate", requireAuth, async (req, res) => {
    try {
      const { code, amount } = req.body;
      const result = await couponService.validateCoupon(code, parseFloat(amount));
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Coupon validation failed", error: error.message });
    }
  });

  // Booking routes
  app.get("/api/bookings", requireAuth, async (req, res) => {
    try {
      const bookings = await storage.getUserBookings(req.session.userId!);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post("/api/bookings", requireAuth, async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      
      // Validate booking eligibility
      const eligibility = await bookingService.checkBookingEligibility(
        req.session.userId!,
        bookingData.slotId,
        bookingData.isFullCourt || false
      );

      if (!eligibility.eligible) {
        return res.status(400).json({ message: eligibility.reason });
      }

      // Create booking
      const booking = await storage.createBooking({
        ...bookingData,
        userId: req.session.userId!
      });

      // Apply coupon if provided
      let discountAmount = 0;
      if (bookingData.couponId) {
        const coupon = await storage.getCoupon(bookingData.couponId);
        if (coupon) {
          discountAmount = await couponService.calculateDiscount(coupon, parseFloat(req.body.originalAmount));
          await storage.updateCouponUsage(coupon.id, coupon.usedCount + 1);
        }
      }

      // Create payment record
      const originalAmount = parseFloat(req.body.originalAmount);
      const payment = await storage.createPayment({
        bookingId: booking.id,
        originalAmount: originalAmount.toString(),
        discountAmount: discountAmount.toString(),
        finalAmount: (originalAmount - discountAmount).toString(),
        status: 'pending'
      });

      // Send push notification
      const user = await storage.getUser(req.session.userId!);
      if (user?.fcmToken) {
        await firebaseService.sendNotification(user.fcmToken, {
          title: "Booking Confirmed",
          body: `Your court booking has been confirmed.`,
          data: {
            bookingId: booking.id,
            type: 'booking_confirmed'
          }
        });
      }

      res.json({ booking, payment });
    } catch (error) {
      res.status(400).json({ message: "Booking failed", error: error.message });
    }
  });

  // Groups routes
  app.get("/api/organizations/:orgId/groups", requireAuth, async (req, res) => {
    try {
      const groups = await storage.getGroupsByOrg(req.params.orgId);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.get("/api/user/groups", requireAuth, async (req, res) => {
    try {
      const groups = await storage.getUserGroups(req.session.userId!);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user groups" });
    }
  });

  // Firebase token update
  app.post("/api/fcm-token", requireAuth, async (req, res) => {
    try {
      const { token } = req.body;
      await storage.updateUserFcmToken(req.session.userId!, token);
      res.json({ message: "FCM token updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update FCM token" });
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", requireAuth, requireRole(['app_admin', 'org_admin']), async (req, res) => {
    try {
      const organizations = await storage.getOrganizations();
      // Basic metrics - in real app would calculate from actual data
      const metrics = {
        totalOrgs: organizations.length,
        activeBookings: 156, // Placeholder
        revenue: 245680, // Placeholder
        activeUsers: 1234 // Placeholder
      };
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
