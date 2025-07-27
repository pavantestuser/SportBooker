import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userGenderEnum = pgEnum('user_gender', ['male', 'female', 'other', 'prefer_not_to_say']);
export const organizationTypeEnum = pgEnum('organization_type', ['public', 'private']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'staff', 'member']);
export const bookingStatusEnum = pgEnum('booking_status', ['booked', 'cancelled', 'completed']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed']);
export const couponTypeEnum = pgEnum('coupon_type', ['fixed_amount', 'percentage', 'free_booking', 'conditional']);

// App Admin table
export const appAdmins = pgTable("app_admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});



// Organizations table
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: organizationTypeEnum("type").notNull(),
  createdBy: varchar("created_by").references(() => appAdmins.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Users table (enhanced with gender)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone"),
  gender: userGenderEnum("gender"),
  publicUser: boolean("public_user").default(true),
  city: text("city"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  fcmToken: text("fcm_token"), // Deprecated - use deviceTokens table
  createdAt: timestamp("created_at").defaultNow(),
});



// Organization Admins
export const orgAdmins = pgTable("org_admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  orgId: varchar("org_id").references(() => organizations.id).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Staff table
export const staff = pgTable("staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  orgId: varchar("org_id").references(() => organizations.id).notNull(),
  canManageSections: boolean("can_manage_sections").default(false),
  canManageFacilities: boolean("can_manage_facilities").default(false),
  canManageUsers: boolean("can_manage_users").default(false),
  canAddSlots: boolean("can_add_slots").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Organization Mapping
export const userOrganizationMap = pgTable("user_organization_map", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  orgId: varchar("org_id").references(() => organizations.id).notNull(),
  role: userRoleEnum("role").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Groups table
export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Group Mapping
export const userGroupMap = pgTable("user_group_map", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  groupId: varchar("group_id").references(() => groups.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sections table
export const sections = pgTable("sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  assignedToUser: varchar("assigned_to_user").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Facilities table
export const facilities = pgTable("facilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Courts table
export const courts = pgTable("courts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").references(() => facilities.id).notNull(),
  name: text("name").notNull(),
  playersRequired: integer("players_required").default(1),
  availableToPublic: boolean("available_to_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Slot Restrictions table
export const slotRestrictions = pgTable("slot_restrictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  restrictedGroups: text("restricted_groups").array(),
  onePerUserPerDay: boolean("one_per_user_per_day").default(false),
  allowFullCourt: boolean("allow_full_court").default(false),
  maxCombinableSlots: integer("max_combinable_slots").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Slots table (enhanced with restrictions)
export const slots = pgTable("slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courtId: varchar("court_id").references(() => courts.id).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  maxBookings: integer("max_bookings").default(1),
  restrictionId: varchar("restriction_id").references(() => slotRestrictions.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Coupons table
export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  type: couponTypeEnum("type").notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }).default('0'),
  usageLimit: integer("usage_limit").default(1),
  usedCount: integer("used_count").default(0),
  expiryDate: timestamp("expiry_date").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slotId: varchar("slot_id").references(() => slots.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  status: bookingStatusEnum("status").default('booked'),
  isFullCourt: boolean("is_full_court").default(false),
  consecutiveSlots: text("consecutive_slots").array(),
  couponId: varchar("coupon_id").references(() => coupons.id),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default('0'),
  bookingTime: timestamp("booking_time").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payments table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  originalAmount: decimal("original_amount", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default('0'),
  finalAmount: decimal("final_amount", { precision: 10, scale: 2 }).notNull(),
  status: paymentStatusEnum("status").default('pending'),
  paymentMethod: text("payment_method"),
  transactionId: text("transaction_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  createdBy: one(appAdmins, { fields: [organizations.createdBy], references: [appAdmins.id] }),
  facilities: many(facilities),
  groups: many(groups),
  orgAdmins: many(orgAdmins),
  staff: many(staff),
  userMappings: many(userOrganizationMap),
}));

export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  orgAdminRoles: many(orgAdmins),
  staffRoles: many(staff),
  organizationMappings: many(userOrganizationMap),
  groupMappings: many(userGroupMap),
}));

export const facilitiesRelations = relations(facilities, ({ one, many }) => ({
  organization: one(organizations, { fields: [facilities.orgId], references: [organizations.id] }),
  courts: many(courts),
}));

export const courtsRelations = relations(courts, ({ one, many }) => ({
  facility: one(facilities, { fields: [courts.facilityId], references: [facilities.id] }),
  slots: many(slots),
}));

export const slotsRelations = relations(slots, ({ one, many }) => ({
  court: one(courts, { fields: [slots.courtId], references: [courts.id] }),
  restriction: one(slotRestrictions, { fields: [slots.restrictionId], references: [slotRestrictions.id] }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  slot: one(slots, { fields: [bookings.slotId], references: [slots.id] }),
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  coupon: one(coupons, { fields: [bookings.couponId], references: [coupons.id] }),
  payment: one(payments, { fields: [bookings.id], references: [payments.bookingId] }),
}));

export const couponsRelations = relations(coupons, ({ many }) => ({
  bookings: many(bookings),
}));



// Insert Schemas
export const insertAppAdminSchema = createInsertSchema(appAdmins).omit({ id: true, createdAt: true });
export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertOrgAdminSchema = createInsertSchema(orgAdmins).omit({ id: true, createdAt: true });
export const insertStaffSchema = createInsertSchema(staff).omit({ id: true, createdAt: true });
export const insertUserOrganizationMapSchema = createInsertSchema(userOrganizationMap).omit({ id: true, createdAt: true });
export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true });
export const insertUserGroupMapSchema = createInsertSchema(userGroupMap).omit({ id: true, createdAt: true });
export const insertSectionSchema = createInsertSchema(sections).omit({ id: true, createdAt: true });
export const insertFacilitySchema = createInsertSchema(facilities).omit({ id: true, createdAt: true });
export const insertCourtSchema = createInsertSchema(courts).omit({ id: true, createdAt: true });
export const insertSlotRestrictionSchema = createInsertSchema(slotRestrictions).omit({ id: true, createdAt: true });
export const insertSlotSchema = createInsertSchema(slots).omit({ id: true, createdAt: true });
export const insertCouponSchema = createInsertSchema(coupons).omit({ id: true, createdAt: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true, bookingTime: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });

// Types
export type InsertAppAdmin = z.infer<typeof insertAppAdminSchema>;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertOrgAdmin = z.infer<typeof insertOrgAdminSchema>;
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type InsertUserOrganizationMap = z.infer<typeof insertUserOrganizationMapSchema>;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type InsertUserGroupMap = z.infer<typeof insertUserGroupMapSchema>;
export type InsertSection = z.infer<typeof insertSectionSchema>;
export type InsertFacility = z.infer<typeof insertFacilitySchema>;
export type InsertCourt = z.infer<typeof insertCourtSchema>;
export type InsertSlotRestriction = z.infer<typeof insertSlotRestrictionSchema>;
export type InsertSlot = z.infer<typeof insertSlotSchema>;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type AppAdmin = typeof appAdmins.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type OrgAdmin = typeof orgAdmins.$inferSelect;
export type Staff = typeof staff.$inferSelect;
export type UserOrganizationMap = typeof userOrganizationMap.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type UserGroupMap = typeof userGroupMap.$inferSelect;
export type Section = typeof sections.$inferSelect;
export type Facility = typeof facilities.$inferSelect;
export type Court = typeof courts.$inferSelect;
export type SlotRestriction = typeof slotRestrictions.$inferSelect;
export type Slot = typeof slots.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type AppAdminPermission = typeof appAdminPermissions.$inferSelect;
export type DeviceToken = typeof deviceTokens.$inferSelect;
