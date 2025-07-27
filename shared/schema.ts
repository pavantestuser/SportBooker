import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, decimal, pgEnum, serial, date, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userGenderEnum = pgEnum('user_gender', ['Male', 'Female', 'Other']);
export const organizationTypeEnum = pgEnum('organization_type', ['public', 'private']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'staff', 'member']);
export const bookingStatusEnum = pgEnum('booking_status', ['booked', 'cancelled', 'completed', 'no_show']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed', 'refunded']);
export const couponTypeEnum = pgEnum('coupon_type', ['flat', 'percent']);
export const restrictionTypeEnum = pgEnum('restriction_type', ['group_only', 'one_per_day', 'full_court', 'combinable']);

// App Admin table
export const appAdmins = pgTable("app_admins", {
  id: serial("admin_id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  superAdmin: boolean("super_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// App Admin Permissions table
export const appAdminPermissions = pgTable("app_admin_permissions", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => appAdmins.id, { onDelete: 'cascade' }).notNull(),
  canCreateAdmin: boolean("can_create_admin").default(false),
  canManageOrganizations: boolean("can_manage_organizations").default(false),
  canAccessSystemLogs: boolean("can_access_system_logs").default(false),
  canManageCoupons: boolean("can_manage_coupons").default(false),
  canPromoteUsers: boolean("can_promote_users").default(false),
});



// Organizations table
export const organizations = pgTable("organizations", {
  id: serial("org_id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: organizationTypeEnum("type").notNull(),
  createdBy: integer("created_by").references(() => appAdmins.id),
  isActive: boolean("is_active").default(true),
  city: varchar("city", { length: 100 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Users table (enhanced with gender)
export const users = pgTable("users", {
  id: serial("user_id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  publicUser: boolean("public_user").default(true),
  gender: userGenderEnum("gender"),
  city: varchar("city", { length: 100 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Device Token table
export const deviceTokens = pgTable("device_tokens", {
  id: serial("token_id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  fcmToken: text("fcm_token").notNull(),
  deviceType: varchar("device_type", { length: 50 }), // 'Android', 'iOS', 'Web'
  deviceName: varchar("device_name", { length: 100 }), // 'iPhone 13', 'Chrome Browser'
  lastUsedAt: timestamp("last_used_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});



// Organization Admins
export const orgAdmins = pgTable("org_admins", {
  id: serial("org_admin_id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  orgId: integer("org_id").references(() => organizations.id).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Staff table
export const staff = pgTable("staff", {
  id: serial("staff_id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  orgId: integer("org_id").references(() => organizations.id).notNull(),
  canManageSections: boolean("can_manage_sections").default(false),
  canManageFacilities: boolean("can_manage_facilities").default(false),
  canManageUsers: boolean("can_manage_users").default(false),
  canAddSlots: boolean("can_add_slots").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Organization Mapping
export const userOrganizationMap = pgTable("user_organization_map", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  orgId: integer("org_id").references(() => organizations.id).notNull(),
  role: userRoleEnum("role").notNull(),
  isActive: boolean("is_active").default(true),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Groups table
export const groups = pgTable("groups", {
  id: serial("group_id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Group Mapping
export const userGroupMap = pgTable("user_group_map", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  groupId: integer("group_id").references(() => groups.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Sections table
export const sections = pgTable("sections", {
  id: serial("section_id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  assignedToUser: integer("assigned_to_user").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Facilities table
export const facilities = pgTable("facilities", {
  id: serial("facility_id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  city: varchar("city", { length: 100 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  tags: text("tags").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Courts table
export const courts = pgTable("courts", {
  id: serial("court_id").primaryKey(),
  facilityId: integer("facility_id").references(() => facilities.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  playersRequired: integer("players_required").default(1),
  availableToPublic: boolean("available_to_public").default(true),
  tags: text("tags").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Slot Restrictions table
export const slotRestrictions = pgTable("slot_restrictions", {
  id: serial("restriction_id").primaryKey(),
  slotId: integer("slot_id").references(() => slots.id, { onDelete: 'cascade' }).notNull(),
  groupId: integer("group_id").references(() => groups.id),
  restrictionType: restrictionTypeEnum("restriction_type").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Slots table
export const slots = pgTable("slots", {
  id: serial("slot_id").primaryKey(),
  courtId: integer("court_id").references(() => courts.id).notNull(),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  restrictedToOncePerDay: boolean("restricted_to_once_per_day").default(false),
  maxBookings: integer("max_bookings").default(1),
  price: decimal("price", { precision: 10, scale: 2 }).default('0.00'),
  allowFullCourtBooking: boolean("allow_full_court_booking").default(false),
  maxCombinableSlots: integer("max_combinable_slots").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Coupons table
export const coupons = pgTable("coupons", {
  id: serial("coupon_id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  discountType: couponTypeEnum("discount_type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  minBookingAmount: decimal("min_booking_amount", { precision: 10, scale: 2 }).default('0.00'),
  validFrom: date("valid_from").notNull(),
  validTo: date("valid_to").notNull(),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").default(0),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => appAdmins.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: serial("booking_id").primaryKey(),
  slotId: integer("slot_id").references(() => slots.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: bookingStatusEnum("status").default('booked'),
  bookingTime: timestamp("booking_time").defaultNow(),
  isFullCourt: boolean("is_full_court").default(false),
  combinedSlots: integer("combined_slots").array(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payments table
export const payments = pgTable("payments", {
  id: serial("payment_id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default('0.00'),
  finalAmount: decimal("final_amount", { precision: 10, scale: 2 }).notNull(),
  couponId: integer("coupon_id").references(() => coupons.id),
  status: paymentStatusEnum("status").default('pending'),
  paymentMethod: varchar("payment_method", { length: 50 }),
  transactionId: varchar("transaction_id", { length: 255 }),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const appAdminsRelations = relations(appAdmins, ({ one, many }) => ({
  user: one(users, { fields: [appAdmins.userId], references: [users.id] }),
  permissions: one(appAdminPermissions, { fields: [appAdmins.id], references: [appAdminPermissions.adminId] }),
  createdOrganizations: many(organizations),
  createdCoupons: many(coupons),
}));

export const appAdminPermissionsRelations = relations(appAdminPermissions, ({ one }) => ({
  admin: one(appAdmins, { fields: [appAdminPermissions.adminId], references: [appAdmins.id] }),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  createdBy: one(appAdmins, { fields: [organizations.createdBy], references: [appAdmins.id] }),
  facilities: many(facilities),
  groups: many(groups),
  orgAdmins: many(orgAdmins),
  staff: many(staff),
  userMappings: many(userOrganizationMap),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  appAdmin: one(appAdmins, { fields: [users.id], references: [appAdmins.userId] }),
  deviceTokens: many(deviceTokens),
  bookings: many(bookings),
  orgAdminRoles: many(orgAdmins),
  staffRoles: many(staff),
  organizationMappings: many(userOrganizationMap),
  groupMappings: many(userGroupMap),
}));

export const deviceTokensRelations = relations(deviceTokens, ({ one }) => ({
  user: one(users, { fields: [deviceTokens.userId], references: [users.id] }),
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
  bookings: many(bookings),
  restrictions: many(slotRestrictions),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  slot: one(slots, { fields: [bookings.slotId], references: [slots.id] }),
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  payment: one(payments, { fields: [bookings.id], references: [payments.bookingId] }),
}));

export const slotRestrictionsRelations = relations(slotRestrictions, ({ one }) => ({
  slot: one(slots, { fields: [slotRestrictions.slotId], references: [slots.id] }),
  group: one(groups, { fields: [slotRestrictions.groupId], references: [groups.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, { fields: [payments.bookingId], references: [bookings.id] }),
  coupon: one(coupons, { fields: [payments.couponId], references: [coupons.id] }),
}));

export const couponsRelations = relations(coupons, ({ one, many }) => ({
  createdBy: one(appAdmins, { fields: [coupons.createdBy], references: [appAdmins.id] }),
  payments: many(payments),
}));



// Insert Schemas
export const insertAppAdminSchema = createInsertSchema(appAdmins).omit({ id: true, createdAt: true });
export const insertAppAdminPermissionSchema = createInsertSchema(appAdminPermissions).omit({ id: true });
export const insertDeviceTokenSchema = createInsertSchema(deviceTokens).omit({ id: true, createdAt: true, lastUsedAt: true });
export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrgAdminSchema = createInsertSchema(orgAdmins).omit({ id: true, createdAt: true });
export const insertStaffSchema = createInsertSchema(staff).omit({ id: true, createdAt: true });
export const insertUserOrganizationMapSchema = createInsertSchema(userOrganizationMap).omit({ id: true, joinedAt: true });
export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true });
export const insertUserGroupMapSchema = createInsertSchema(userGroupMap).omit({ id: true, joinedAt: true });
export const insertSectionSchema = createInsertSchema(sections).omit({ id: true, createdAt: true });
export const insertFacilitySchema = createInsertSchema(facilities).omit({ id: true, createdAt: true });
export const insertCourtSchema = createInsertSchema(courts).omit({ id: true, createdAt: true });
export const insertSlotRestrictionSchema = createInsertSchema(slotRestrictions).omit({ id: true, createdAt: true });
export const insertSlotSchema = createInsertSchema(slots).omit({ id: true, createdAt: true });
export const insertCouponSchema = createInsertSchema(coupons).omit({ id: true, createdAt: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true, updatedAt: true, bookingTime: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });

// Types
export type InsertAppAdmin = z.infer<typeof insertAppAdminSchema>;
export type InsertAppAdminPermission = z.infer<typeof insertAppAdminPermissionSchema>;
export type InsertDeviceToken = z.infer<typeof insertDeviceTokenSchema>;
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
export type AppAdminPermission = typeof appAdminPermissions.$inferSelect;
export type DeviceToken = typeof deviceTokens.$inferSelect;
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
