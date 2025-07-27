import {
  appAdmins, organizations, users, orgAdmins, staff, userOrganizationMap,
  groups, userGroupMap, sections, facilities, courts, slotRestrictions,
  slots, coupons, bookings, payments, appAdminPermissions, deviceTokens,
  type InsertAppAdmin, type InsertOrganization, type InsertUser,
  type InsertOrgAdmin, type InsertStaff, type InsertUserOrganizationMap,
  type InsertGroup, type InsertUserGroupMap, type InsertSection,
  type InsertFacility, type InsertCourt, type InsertSlotRestriction,
  type InsertSlot, type InsertCoupon, type InsertBooking, type InsertPayment,
  type InsertAppAdminPermission, type InsertDeviceToken,
  type AppAdmin, type Organization, type User, type OrgAdmin, type Staff,
  type UserOrganizationMap, type Group, type UserGroupMap, type Section,
  type Facility, type Court, type SlotRestriction, type Slot, type Coupon,
  type Booking, type Payment, type AppAdminPermission, type DeviceToken
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, gte, lte, inArray, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserFcmToken(userId: string, fcmToken: string): Promise<void>;
  updateUserLocation(userId: string, location: { city: string; latitude: string; longitude: string }): Promise<void>;

  // App Admin management
  getAppAdmin(id: string): Promise<AppAdmin | undefined>;
  getAppAdminByEmail(email: string): Promise<AppAdmin | undefined>;
  getAppAdmins(): Promise<AppAdmin[]>;
  createAppAdmin(admin: InsertAppAdmin): Promise<AppAdmin>;

  // App Admin Permissions
  getAppAdminPermissions(adminId: string): Promise<AppAdminPermission | undefined>;
  createAppAdminPermissions(permissions: InsertAppAdminPermission): Promise<AppAdminPermission>;
  updateAppAdminPermissions(adminId: string, permissions: Partial<InsertAppAdminPermission>): Promise<void>;

  // Device Token management
  getUserDeviceTokens(userId: string): Promise<DeviceToken[]>;
  createDeviceToken(token: InsertDeviceToken): Promise<DeviceToken>;
  updateDeviceToken(tokenId: string, updates: Partial<InsertDeviceToken>): Promise<void>;
  deactivateDeviceToken(tokenId: string): Promise<void>;
  cleanupInactiveTokens(): Promise<void>;

  // Organization management
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizations(): Promise<Organization[]>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, updates: Partial<InsertOrganization>): Promise<Organization | undefined>;

  // Role management
  getUserRoles(userId: string): Promise<{ role: string; orgId?: string; orgName?: string }[]>;
  createOrgAdmin(orgAdmin: InsertOrgAdmin): Promise<OrgAdmin>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  createUserOrganizationMap(mapping: InsertUserOrganizationMap): Promise<UserOrganizationMap>;

  // Group management
  getGroupsByOrg(orgId: string): Promise<Group[]>;
  createGroup(group: InsertGroup): Promise<Group>;
  addUserToGroup(mapping: InsertUserGroupMap): Promise<UserGroupMap>;
  getUserGroups(userId: string): Promise<Group[]>;

  // Facility and Court management
  getFacilitiesByOrg(orgId: string): Promise<Facility[]>;
  getFacility(id: string): Promise<Facility | undefined>;
  createFacility(facility: InsertFacility): Promise<Facility>;
  getCourtsByFacility(facilityId: string): Promise<Court[]>;
  getCourt(id: string): Promise<Court | undefined>;
  createCourt(court: InsertCourt): Promise<Court>;

  // Slot Restrictions
  getSlotRestriction(id: string): Promise<SlotRestriction | undefined>;
  getSlotRestrictions(): Promise<SlotRestriction[]>;
  createSlotRestriction(restriction: InsertSlotRestriction): Promise<SlotRestriction>;

  // Slot management
  getSlot(id: string): Promise<Slot | undefined>;
  getSlotsByDate(courtId: string, date: string): Promise<Slot[]>;
  getAvailableSlots(courtId: string, date: string): Promise<Slot[]>;
  createSlot(slot: InsertSlot): Promise<Slot>;
  updateSlot(id: string, updates: Partial<InsertSlot>): Promise<Slot | undefined>;

  // Coupon management
  getCoupon(id: string): Promise<Coupon | undefined>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  getCoupons(): Promise<Coupon[]>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  updateCouponUsage(id: string, usedCount: number): Promise<void>;

  // Booking management
  getBooking(id: string): Promise<Booking | undefined>;
  getUserBookings(userId: string): Promise<Booking[]>;
  getBookingsBySlot(slotId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: string, status: 'booked' | 'cancelled' | 'completed'): Promise<void>;
  getUserBookingsForDate(userId: string, date: string): Promise<Booking[]>;

  // Payment management
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentByBooking(bookingId: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: string, status: 'pending' | 'paid' | 'failed', transactionId?: string): Promise<void>;

  // Search and Discovery
  performAdvancedSearch(params: {
    query?: string;
    city?: string;
    sport?: string;
    date?: string;
    timeSlot?: string;
    maxDistance?: number;
    priceRange?: string;
    userId: string;
  }): Promise<any[]>;
  findNearbyCourts(latitude: number, longitude: number, radius: number): Promise<any[]>;
  filterCourts(params: {
    tags?: string[];
    city?: string;
    availableOnly?: boolean;
  }): Promise<Court[]>;
}

export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserFcmToken(userId: string, fcmToken: string): Promise<void> {
    await db.update(users).set({ fcmToken }).where(eq(users.id, userId));
  }

  async updateUserLocation(userId: string, location: { city: string; latitude: string; longitude: string }): Promise<void> {
    await db.update(users).set({
      city: location.city,
      latitude: location.latitude,
      longitude: location.longitude
    }).where(eq(users.id, userId));
  }

  // App Admin management
  async getAppAdmin(id: string): Promise<AppAdmin | undefined> {
    const [admin] = await db.select().from(appAdmins).where(eq(appAdmins.id, id));
    return admin || undefined;
  }

  async getAppAdminByEmail(email: string): Promise<AppAdmin | undefined> {
    const [admin] = await db.select().from(appAdmins).where(eq(appAdmins.email, email));
    return admin || undefined;
  }

  async getAppAdmins(): Promise<AppAdmin[]> {
    return await db.select().from(appAdmins);
  }

  async createAppAdmin(insertAdmin: InsertAppAdmin): Promise<AppAdmin> {
    const [admin] = await db.insert(appAdmins).values(insertAdmin).returning();
    return admin;
  }

  // Organization management
  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org || undefined;
  }

  async getOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).where(eq(organizations.isActive, true)).orderBy(asc(organizations.name));
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const [org] = await db.insert(organizations).values(insertOrg).returning();
    return org;
  }

  async updateOrganization(id: string, updates: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const [org] = await db.update(organizations).set(updates).where(eq(organizations.id, id)).returning();
    return org || undefined;
  }

  // Role management
  async getUserRoles(userId: string): Promise<{ role: string; orgId?: string; orgName?: string }[]> {
    const roles: { role: string; orgId?: string; orgName?: string }[] = [];

    // Check if user is app admin
    const [admin] = await db.select().from(appAdmins).where(eq(appAdmins.email, 
      (await db.select({ email: users.email }).from(users).where(eq(users.id, userId)))[0]?.email || ''
    ));
    if (admin) {
      roles.push({ role: 'app_admin' });
    }

    // Check org admin roles
    const orgAdminRoles = await db.select({
      orgId: orgAdmins.orgId,
      orgName: organizations.name
    }).from(orgAdmins)
      .innerJoin(organizations, eq(orgAdmins.orgId, organizations.id))
      .where(and(eq(orgAdmins.userId, userId), eq(orgAdmins.isActive, true)));
    
    for (const role of orgAdminRoles) {
      roles.push({ role: 'org_admin', orgId: role.orgId, orgName: role.orgName });
    }

    // Check staff roles
    const staffRoles = await db.select({
      orgId: staff.orgId,
      orgName: organizations.name
    }).from(staff)
      .innerJoin(organizations, eq(staff.orgId, organizations.id))
      .where(and(eq(staff.userId, userId), eq(staff.isActive, true)));
    
    for (const role of staffRoles) {
      roles.push({ role: 'staff', orgId: role.orgId, orgName: role.orgName });
    }

    // Always add user role
    roles.push({ role: 'user' });

    return roles;
  }

  async createOrgAdmin(insertOrgAdmin: InsertOrgAdmin): Promise<OrgAdmin> {
    const [admin] = await db.insert(orgAdmins).values(insertOrgAdmin).returning();
    return admin;
  }

  async createStaff(insertStaff: InsertStaff): Promise<Staff> {
    const [staffMember] = await db.insert(staff).values(insertStaff).returning();
    return staffMember;
  }

  async createUserOrganizationMap(mapping: InsertUserOrganizationMap): Promise<UserOrganizationMap> {
    const [map] = await db.insert(userOrganizationMap).values(mapping).returning();
    return map;
  }

  // Group management
  async getGroupsByOrg(orgId: string): Promise<Group[]> {
    return await db.select().from(groups).where(eq(groups.orgId, orgId)).orderBy(asc(groups.name));
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const [group] = await db.insert(groups).values(insertGroup).returning();
    return group;
  }

  async addUserToGroup(mapping: InsertUserGroupMap): Promise<UserGroupMap> {
    const [map] = await db.insert(userGroupMap).values(mapping).returning();
    return map;
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    return await db.select({
      id: groups.id,
      orgId: groups.orgId,
      name: groups.name,
      description: groups.description,
      createdAt: groups.createdAt
    }).from(userGroupMap)
      .innerJoin(groups, eq(userGroupMap.groupId, groups.id))
      .where(eq(userGroupMap.userId, userId));
  }

  // Facility and Court management
  async getFacilitiesByOrg(orgId: string): Promise<Facility[]> {
    return await db.select().from(facilities).where(eq(facilities.orgId, orgId)).orderBy(asc(facilities.name));
  }

  async getFacility(id: string): Promise<Facility | undefined> {
    const [facility] = await db.select().from(facilities).where(eq(facilities.id, id));
    return facility || undefined;
  }

  async createFacility(insertFacility: InsertFacility): Promise<Facility> {
    const [facility] = await db.insert(facilities).values(insertFacility).returning();
    return facility;
  }

  async getCourtsByFacility(facilityId: string): Promise<Court[]> {
    return await db.select().from(courts).where(eq(courts.facilityId, facilityId)).orderBy(asc(courts.name));
  }

  async getCourt(id: string): Promise<Court | undefined> {
    const [court] = await db.select().from(courts).where(eq(courts.id, id));
    return court || undefined;
  }

  async createCourt(insertCourt: InsertCourt): Promise<Court> {
    const [court] = await db.insert(courts).values(insertCourt).returning();
    return court;
  }

  // Slot Restrictions
  async getSlotRestriction(id: string): Promise<SlotRestriction | undefined> {
    const [restriction] = await db.select().from(slotRestrictions).where(eq(slotRestrictions.id, id));
    return restriction || undefined;
  }

  async getSlotRestrictions(): Promise<SlotRestriction[]> {
    return await db.select().from(slotRestrictions).orderBy(asc(slotRestrictions.name));
  }

  async createSlotRestriction(insertRestriction: InsertSlotRestriction): Promise<SlotRestriction> {
    const [restriction] = await db.insert(slotRestrictions).values(insertRestriction).returning();
    return restriction;
  }

  // Slot management
  async getSlot(id: string): Promise<Slot | undefined> {
    const [slot] = await db.select().from(slots).where(eq(slots.id, id));
    return slot || undefined;
  }

  async getSlotsByDate(courtId: string, date: string): Promise<Slot[]> {
    return await db.select().from(slots)
      .where(and(eq(slots.courtId, courtId), eq(slots.date, date)))
      .orderBy(asc(slots.startTime));
  }

  async getAvailableSlots(courtId: string, date: string): Promise<Slot[]> {
    const allSlots = await this.getSlotsByDate(courtId, date);
    const availableSlots = [];
    
    for (const slot of allSlots) {
      const bookingCount = await db.select({ count: slots.id })
        .from(bookings)
        .where(and(eq(bookings.slotId, slot.id), eq(bookings.status, 'booked')));
      
      if (bookingCount.length < slot.maxBookings) {
        availableSlots.push(slot);
      }
    }
    
    return availableSlots;
  }

  async createSlot(insertSlot: InsertSlot): Promise<Slot> {
    const [slot] = await db.insert(slots).values(insertSlot).returning();
    return slot;
  }

  async updateSlot(id: string, updates: Partial<InsertSlot>): Promise<Slot | undefined> {
    const [slot] = await db.update(slots).set(updates).where(eq(slots.id, id)).returning();
    return slot || undefined;
  }

  // Coupon management
  async getCoupon(id: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.id, id));
    return coupon || undefined;
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code.toUpperCase()));
    return coupon || undefined;
  }

  async getCoupons(): Promise<Coupon[]> {
    return await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  }

  async createCoupon(insertCoupon: InsertCoupon): Promise<Coupon> {
    const [coupon] = await db.insert(coupons).values(insertCoupon).returning();
    return coupon;
  }

  async updateCouponUsage(id: string, usedCount: number): Promise<void> {
    await db.update(coupons).set({ usedCount }).where(eq(coupons.id, id));
  }

  // Booking management
  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    return await db.select().from(bookings)
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt));
  }

  async getBookingsBySlot(slotId: string): Promise<Booking[]> {
    return await db.select().from(bookings)
      .where(and(eq(bookings.slotId, slotId), eq(bookings.status, 'booked')));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(insertBooking).returning();
    return booking;
  }

  async updateBookingStatus(id: string, status: 'booked' | 'cancelled' | 'completed'): Promise<void> {
    await db.update(bookings).set({ status }).where(eq(bookings.id, id));
  }

  async getUserBookingsForDate(userId: string, date: string): Promise<Booking[]> {
    return await db.select().from(bookings)
      .innerJoin(slots, eq(bookings.slotId, slots.id))
      .where(and(
        eq(bookings.userId, userId),
        eq(slots.date, date),
        eq(bookings.status, 'booked')
      ));
  }

  // Payment management
  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentByBooking(bookingId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.bookingId, bookingId));
    return payment || undefined;
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(insertPayment).returning();
    return payment;
  }

  async updatePaymentStatus(id: string, status: 'pending' | 'paid' | 'failed', transactionId?: string): Promise<void> {
    await db.update(payments).set({
      status,
      ...(transactionId && { transactionId })
    }).where(eq(payments.id, id));
  }

  // Search and Discovery implementations
  async performAdvancedSearch(params: {
    query?: string;
    city?: string;
    sport?: string;
    date?: string;
    timeSlot?: string;
    maxDistance?: number;
    priceRange?: string;
    userId: string;
  }): Promise<any[]> {
    const results: any[] = [];

    // Search organizations
    if (params.query || params.city) {
      const orgQuery = db.select().from(organizations);
      const orgs = await orgQuery;

      orgs.forEach(org => {
        if (this.matchesSearch(org.name, params.query) ||
            this.matchesSearch(org.city, params.city)) {
          results.push({
            id: org.id,
            type: 'organization',
            name: org.name,
            description: `${org.type} organization`,
            city: org.city,
            tags: org.tags || []
          });
        }
      });
    }

    // Search facilities
    const facilityQuery = db.select().from(facilities);
    const facilitiesData = await facilityQuery;

    facilitiesData.forEach(facility => {
      if (this.matchesSearch(facility.name, params.query) ||
          this.matchesSearch(facility.city, params.city)) {
        results.push({
          id: facility.id,
          type: 'facility',
          name: facility.name,
          description: facility.description || 'Sports facility',
          city: facility.city,
          tags: facility.tags || []
        });
      }
    });

    // Search courts
    const courtQuery = db.select({
      id: courts.id,
      name: courts.name,
      facilityId: courts.facilityId,
      tags: courts.tags,
      facilityName: facilities.name,
      facilityCity: facilities.city
    }).from(courts).leftJoin(facilities, eq(courts.facilityId, facilities.id));

    const courtsData = await courtQuery;

    courtsData.forEach(court => {
      if (this.matchesSearch(court.name, params.query) ||
          this.matchesSearch(court.facilityCity, params.city) ||
          this.matchesSport(court.tags, params.sport)) {
        results.push({
          id: court.id,
          type: 'court',
          name: court.name,
          description: `Court at ${court.facilityName}`,
          city: court.facilityCity,
          tags: court.tags || []
        });
      }
    });

    return results;
  }

  async findNearbyCourts(latitude: number, longitude: number, radius: number): Promise<any[]> {
    // Simple distance calculation - in production, use spatial indexing
    const facilitiesData = await db.select().from(facilities);
    const nearbyCourts: any[] = [];

    for (const facility of facilitiesData) {
      if (facility.latitude && facility.longitude) {
        const distance = this.calculateDistance(
          latitude, longitude,
          parseFloat(facility.latitude), parseFloat(facility.longitude)
        );

        if (distance <= radius) {
          const courtsInFacility = await db.select()
            .from(courts)
            .where(eq(courts.facilityId, facility.id));

          courtsInFacility.forEach(court => {
            nearbyCourts.push({
              id: court.id,
              type: 'court',
              name: court.name,
              description: `Court at ${facility.name}`,
              city: facility.city,
              distance,
              tags: court.tags || []
            });
          });
        }
      }
    }

    return nearbyCourts.sort((a, b) => a.distance - b.distance);
  }

  async filterCourts(params: {
    tags?: string[];
    city?: string;
    availableOnly?: boolean;
  }): Promise<Court[]> {
    let query = db.select().from(courts);

    if (params.city) {
      query = query.leftJoin(facilities, eq(courts.facilityId, facilities.id));
    }

    const courtsData = await query;

    return courtsData.filter(court => {
      if (params.tags && court.tags) {
        const courtTags = court.tags || [];
        const hasMatchingTag = params.tags.some(tag =>
          courtTags.some(courtTag =>
            courtTag.toLowerCase().includes(tag.toLowerCase())
          )
        );
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  }

  // Helper methods
  private matchesSearch(text: string | null, searchTerm?: string): boolean {
    if (!searchTerm) return true;
    if (!text) return false;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  }

  private matchesSport(tags: string[] | null, sport?: string): boolean {
    if (!sport) return true;
    if (!tags) return false;
    return tags.some(tag => tag.toLowerCase().includes(sport.toLowerCase()));
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    return d;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}

export const storage = new DatabaseStorage();
