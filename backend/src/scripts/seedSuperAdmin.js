require("dotenv").config();
const connectDB = require("../config/db");
const SuperAdmin = require("../modules/company/models/superAdmin.model");

async function seed() {
  try {
    await connectDB();
    console.log("\n📦 Connected to MongoDB. Seeding Super Admin account...");

    let admin = await SuperAdmin.findOne({ email: "admin@admin.com" });
    if (!admin) {
      admin = new SuperAdmin({
        name: "Taste-It Super Admin",
        email: "admin@admin.com",
        password: "123456",
        role: "super_admin",
        isActive: true,
      });
    } else {
      admin.name = "Taste-It Super Admin";
      admin.password = "123456";
      admin.isActive = true;
    }

    await admin.save();

    console.log("\n==================================================");
    console.log("  SUPER ADMIN ACCOUNT CONFIGURED SUCCESSFULLY!");
    console.log("==================================================");
    console.log("  Portal URL : http://localhost:3001/login");
    console.log("  Email      : admin@admin.com");
    console.log("  Password   : 123456");
    console.log("==================================================\n");

    process.exit(0);
  } catch (err) {
    console.error("\n❌ Super Admin Seed Error:", err.message);
    process.exit(1);
  }
}

seed();
