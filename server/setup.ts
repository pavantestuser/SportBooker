import bcrypt from "bcrypt";
import { storage } from "./storage";

/**
 * Setup script for creating the first app admin
 * This should only be run once during initial setup
 */
export async function createInitialAppAdmin(adminData: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  try {
    // Check if any app admin already exists
    const existingAdmins = await storage.getAppAdmins?.();
    if (existingAdmins && existingAdmins.length > 0) {
      throw new Error("App admin already exists. Use the admin panel to create additional admins.");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminData.password, 12);

    // Create app admin
    const admin = await storage.createAppAdmin({
      name: adminData.name,
      email: adminData.email,
      passwordHash,
      phone: adminData.phone
    });

    console.log("✅ App admin created successfully:");
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   ID: ${admin.id}`);
    
    return admin;
  } catch (error) {
    console.error("❌ Failed to create app admin:", error.message);
    throw error;
  }
}

/**
 * Setup script for creating sample data
 */
export async function createSampleData() {
  try {
    console.log("🏗️  Creating sample data...");

    // Create sample organization
    const sampleOrg = await storage.createOrganization({
      name: "Downtown Sports Complex",
      type: "public",
      city: "Mumbai",
      latitude: "19.0760",
      longitude: "72.8777",
      tags: ["Badminton", "Tennis", "Basketball", "Swimming"]
    });

    console.log(`✅ Created organization: ${sampleOrg.name}`);

    // Create sample facility
    const sampleFacility = await storage.createFacility({
      orgId: sampleOrg.id,
      name: "Main Sports Hall",
      description: "Multi-purpose sports facility with modern amenities",
      city: "Mumbai",
      latitude: "19.0760",
      longitude: "72.8777",
      tags: ["Indoor", "Air Conditioned", "Parking Available"]
    });

    console.log(`✅ Created facility: ${sampleFacility.name}`);

    // Create sample courts
    const courts = [
      {
        facilityId: sampleFacility.id,
        name: "Badminton Court 1",
        playersRequired: 4,
        availableToPublic: true,
        tags: ["Badminton", "Wooden Floor", "Professional"]
      },
      {
        facilityId: sampleFacility.id,
        name: "Tennis Court A",
        playersRequired: 2,
        availableToPublic: true,
        tags: ["Tennis", "Hard Court", "Outdoor"]
      },
      {
        facilityId: sampleFacility.id,
        name: "Basketball Court",
        playersRequired: 10,
        availableToPublic: true,
        tags: ["Basketball", "Full Court", "Indoor"]
      }
    ];

    const createdCourts = [];
    for (const court of courts) {
      const created = await storage.createCourt(court);
      createdCourts.push(created);
      console.log(`✅ Created court: ${created.name}`);
    }

    // Create sample user groups
    const groups = [
      { orgId: sampleOrg.id, name: "VIP Members", description: "Premium members with priority access" },
      { orgId: sampleOrg.id, name: "Students", description: "Student discount group" },
      { orgId: sampleOrg.id, name: "Corporate Members", description: "Corporate package members" },
      { orgId: sampleOrg.id, name: "Women Only", description: "Women-only sessions" },
      { orgId: sampleOrg.id, name: "Senior Citizens", description: "Senior citizen special rates" }
    ];

    for (const group of groups) {
      const created = await storage.createGroup(group);
      console.log(`✅ Created group: ${created.name}`);
    }

    // Create sample coupons
    const coupons = [
      {
        code: "WELCOME20",
        description: "Welcome bonus - 20% off first booking",
        type: "percentage" as const,
        discountValue: "20",
        minBookingAmount: "100",
        usageLimit: 100,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true
      },
      {
        code: "STUDENT50",
        description: "Student discount - ₹50 off",
        type: "fixed_amount" as const,
        discountValue: "50",
        minBookingAmount: "200",
        usageLimit: 50,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        isActive: true
      }
    ];

    for (const coupon of coupons) {
      const created = await storage.createCoupon(coupon);
      console.log(`✅ Created coupon: ${created.code}`);
    }

    console.log("🎉 Sample data created successfully!");
    return {
      organization: sampleOrg,
      facility: sampleFacility,
      courts: createdCourts
    };

  } catch (error) {
    console.error("❌ Failed to create sample data:", error.message);
    throw error;
  }
}

/**
 * CLI setup function
 */
export async function runSetup() {
  console.log("🚀 SportBook Pro Setup");
  console.log("=".repeat(50));

  try {
    // Get admin details from environment or prompt
    const adminData = {
      name: process.env.ADMIN_NAME || "System Administrator",
      email: process.env.ADMIN_EMAIL || "admin@sportbook.com",
      password: process.env.ADMIN_PASSWORD || "SportBook123!",
      phone: process.env.ADMIN_PHONE || "+1234567890"
    };

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.log("⚠️  Using default admin credentials:");
      console.log(`   Email: ${adminData.email}`);
      console.log(`   Password: ${adminData.password}`);
      console.log("   Please change these after first login!");
    }

    // Create app admin
    await createInitialAppAdmin(adminData);

    // Ask if user wants sample data
    const createSample = process.env.CREATE_SAMPLE_DATA === 'true';
    if (createSample) {
      await createSampleData();
    }

    console.log("\n🎉 Setup completed successfully!");
    console.log("\nNext steps:");
    console.log("1. Start the application: npm start");
    console.log("2. Login with admin credentials");
    console.log("3. Create organizations and facilities");
    console.log("4. Configure user access and permissions");

  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  runSetup();
}
