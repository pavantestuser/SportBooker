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
    rolling: true, // Reset session expiry on each request
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
    },
    name: 'sportbook.sid' // Custom session name
  }));

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    console.log('Auth check - Session:', {
      sessionId: req.sessionID,
      userId: req.session.userId,
      hasSession: !!req.session
    });

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

  // Route to make existing user an app admin
  app.post("/api/setup/user-to-admin", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Find the user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if this user is already an app admin
      const existingAdmins = await storage.getAppAdmins();
      const isAlreadyAdmin = existingAdmins.some(admin => admin.email === user.email);

      if (isAlreadyAdmin) {
        return res.status(400).json({ message: "User is already an app admin" });
      }

      // Create app admin record using user data
      const admin = await storage.createAppAdmin({
        name: user.fullName,
        email: user.email,
        passwordHash: user.passwordHash,
        phone: user.phone
      });

      res.json({
        message: "User promoted to app admin successfully",
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email
        }
      });
    } catch (error) {
      res.status(400).json({
        message: "Failed to promote user to app admin",
        error: error.message
      });
    }
  });

  // Setup route for creating first app admin (one-time use)
  app.post("/api/setup/app-admin", async (req, res) => {
    try {
      const { name, email, password, phone } = req.body;

      // Check if any app admin already exists
      const existingAdmins = await storage.getAppAdmins?.();
      if (existingAdmins && existingAdmins.length > 0) {
        return res.status(400).json({
          message: "Setup already completed. App admin exists."
        });
      }

      // Validate input
      if (!name || !email || !password) {
        return res.status(400).json({
          message: "Name, email, and password are required"
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create app admin
      const admin = await storage.createAppAdmin({
        name,
        email,
        passwordHash,
        phone
      });

      res.json({
        message: "App admin created successfully",
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email
        }
      });
    } catch (error) {
      res.status(400).json({
        message: "Failed to create app admin",
        error: error.message
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  });

  // Auth routes
  app.post("/api/register", async (req, res) => {
    try {
      // Extract password from request body before parsing with schema
      const { password, ...bodyWithoutPassword } = req.body;
      const userData = insertUserSchema.parse(bodyWithoutPassword);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password || userData.passwordHash, 10);

      const user = await storage.createUser({
        ...userData,
        passwordHash
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

      // Auto-login the user after registration
      const roles = await storage.getUserRoles(user.id);
      req.session.userId = user.id;
      req.session.currentRole = roles[0]?.role || 'user';
      req.session.currentOrgId = roles[0]?.orgId;

      // Save session and respond
      req.session.save((err) => {
        if (err) {
          console.error('Session save error after registration:', err);
          return res.json({ message: "User registered successfully but login failed", userId: user.id });
        }

        res.json({
          message: "User registered successfully",
          userId: user.id,
          user: { id: user.id, username: user.username, fullName: user.fullName, email: user.email },
          autoLogin: true
        });
      });
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

      // Explicitly save session
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: "Session save failed" });
        }

        res.json({
          message: "Login successful",
          user: { id: user.id, username: user.username, fullName: user.fullName, email: user.email },
          roles,
          currentRole: req.session.currentRole
        });
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

  // User location update
  app.post("/api/user/location", requireAuth, async (req, res) => {
    try {
      const { city, latitude, longitude } = req.body;
      await storage.updateUserLocation(req.session.userId!, {
        city,
        latitude: latitude.toString(),
        longitude: longitude.toString()
      });
      res.json({ message: "Location updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update location", error: error.message });
    }
  });

  // Notifications
  app.post("/api/notifications/send", requireAuth, requireRole(['app_admin', 'org_admin']), async (req, res) => {
    try {
      const { userIds, title, body, data } = req.body;

      const notifications = [];
      for (const userId of userIds) {
        const user = await storage.getUser(userId);
        if (user?.fcmToken) {
          await firebaseService.sendNotification(user.fcmToken, {
            title,
            body,
            data: data || {}
          });
          notifications.push({ userId, status: 'sent' });
        } else {
          notifications.push({ userId, status: 'no_token' });
        }
      }

      res.json({ message: "Notifications processed", results: notifications });
    } catch (error) {
      res.status(500).json({ message: "Failed to send notifications", error: error.message });
    }
  });

  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      // In a real app, this would fetch user's notification history from database
      const notifications = [
        {
          id: "1",
          title: "Booking Confirmed",
          body: "Your court booking for today at 6:00 PM is confirmed.",
          timestamp: new Date().toISOString(),
          read: false,
          type: "booking_confirmed"
        },
        {
          id: "2",
          title: "New Facility Available",
          body: "Check out the new tennis courts near your location!",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          type: "facility_update"
        }
      ];

      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Enhanced booking with restrictions
  app.post("/api/bookings/advanced", requireAuth, async (req, res) => {
    try {
      const { slotId, isFullCourt, consecutiveSlots } = req.body;

      const bookingRequest = {
        userId: req.session.userId!,
        slotId,
        isFullCourt: isFullCourt || false,
        consecutiveSlots: consecutiveSlots || [],
        requestedDate: new Date().toISOString().split('T')[0]
      };

      const { enhancedBookingService } = await import('./services/enhanced-booking');
      const booking = await enhancedBookingService.processAdvancedBooking(bookingRequest);

      res.json({ booking, message: "Advanced booking created successfully" });
    } catch (error) {
      res.status(400).json({ message: "Advanced booking failed", error: error.message });
    }
  });

  // Check booking eligibility
  app.post("/api/bookings/check-eligibility", requireAuth, async (req, res) => {
    try {
      const { slotId, isFullCourt, consecutiveSlots } = req.body;

      const bookingRequest = {
        userId: req.session.userId!,
        slotId,
        isFullCourt: isFullCourt || false,
        consecutiveSlots: consecutiveSlots || [],
        requestedDate: new Date().toISOString().split('T')[0]
      };

      const { enhancedBookingService } = await import('./services/enhanced-booking');
      const eligibility = await enhancedBookingService.checkAdvancedBookingEligibility(bookingRequest);

      res.json(eligibility);
    } catch (error) {
      res.status(500).json({ message: "Failed to check eligibility", error: error.message });
    }
  });

  // Search and Discovery
  app.post("/api/search", requireAuth, async (req, res) => {
    try {
      const { query, city, sport, date, timeSlot, maxDistance, priceRange } = req.body;

      // Perform fuzzy search across courts, facilities, and organizations
      const results = await storage.performAdvancedSearch({
        query,
        city,
        sport,
        date,
        timeSlot,
        maxDistance: maxDistance ? parseInt(maxDistance) : undefined,
        priceRange,
        userId: req.session.userId!
      });

      res.json({ results });
    } catch (error) {
      res.status(500).json({ message: "Search failed", error: error.message });
    }
  });

  app.get("/api/nearby", requireAuth, async (req, res) => {
    try {
      const { radius = 10 } = req.query;
      const user = await storage.getUser(req.session.userId!);

      if (!user?.latitude || !user?.longitude) {
        return res.status(400).json({ message: "User location not available" });
      }

      const results = await storage.findNearbyCourts(
        parseFloat(user.latitude),
        parseFloat(user.longitude),
        parseInt(radius as string)
      );

      res.json({ results });
    } catch (error) {
      res.status(500).json({ message: "Nearby search failed", error: error.message });
    }
  });

  app.get("/api/courts/filter", requireAuth, async (req, res) => {
    try {
      const { tags, city, availableOnly } = req.query;

      const courts = await storage.filterCourts({
        tags: tags ? (tags as string).split(',') : undefined,
        city: city as string,
        availableOnly: availableOnly === 'true'
      });

      res.json(courts);
    } catch (error) {
      res.status(500).json({ message: "Failed to filter courts" });
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
