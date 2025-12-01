-- Drop all existing tables to reset database
DROP TABLE IF EXISTS "session" CASCADE;
DROP TABLE IF EXISTS "institutions" CASCADE;
DROP TABLE IF EXISTS "organization_admins" CASCADE;
DROP TABLE IF EXISTS "sports_tracking" CASCADE;
DROP TABLE IF EXISTS "time_slots" CASCADE;
DROP TABLE IF EXISTS "user_organizations" CASCADE;
DROP TABLE IF EXISTS "coupons" CASCADE;

-- Drop conflicting tables that might exist
DROP TABLE IF EXISTS "bookings" CASCADE;
DROP TABLE IF EXISTS "courts" CASCADE;
DROP TABLE IF EXISTS "facilities" CASCADE;
DROP TABLE IF EXISTS "groups" CASCADE;
DROP TABLE IF EXISTS "org_admins" CASCADE;
DROP TABLE IF EXISTS "organizations" CASCADE;
DROP TABLE IF EXISTS "payments" CASCADE;
DROP TABLE IF EXISTS "sections" CASCADE;
DROP TABLE IF EXISTS "slot_restrictions" CASCADE;
DROP TABLE IF EXISTS "slots" CASCADE;
DROP TABLE IF EXISTS "staff" CASCADE;
DROP TABLE IF EXISTS "user_group_map" CASCADE;
DROP TABLE IF EXISTS "user_organization_map" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "app_admins" CASCADE;

-- Drop all custom types
DROP TYPE IF EXISTS "booking_status" CASCADE;
DROP TYPE IF EXISTS "coupon_type" CASCADE;
DROP TYPE IF EXISTS "organization_type" CASCADE;
DROP TYPE IF EXISTS "payment_status" CASCADE;
DROP TYPE IF EXISTS "restriction_type" CASCADE;
DROP TYPE IF EXISTS "user_gender" CASCADE;
DROP TYPE IF EXISTS "user_role" CASCADE;

-- Drop migration table
DROP TABLE IF EXISTS "__drizzle_migrations" CASCADE;
