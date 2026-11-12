require("dotenv").config();
const connectDB = require("../config/db");
const SuperAdmin = require("../modules/company/models/superAdmin.model");
const Branch = require("../modules/company/models/branch.model");
const Employee = require("../modules/employee/models/employee.model");

async function seedAuthUsers() {
  try {
    await connectDB();
    console.log("\n📦 Connected to MongoDB. Configuring Super Admin & Branch POS logins...");

    // ─────────────────────────────────────────────────────────────
    // 1. SUPER ADMIN ACCOUNT
    // ─────────────────────────────────────────────────────────────
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
    console.log("   ✅ Super Admin: admin@admin.com / 123456");

    // ─────────────────────────────────────────────────────────────
    // 2. BRANCH POS ACCOUNT 1 (RFC Cafe & Restro)
    // ─────────────────────────────────────────────────────────────
    let rfcBranch = await Branch.findOne({ $or: [{ code: "RFC" }, { email: "rfc@admin.com" }] });
    if (!rfcBranch) {
      rfcBranch = new Branch({
        name: "RFC Cafe & Restro",
        code: "RFC",
        email: "rfc@admin.com",
        password: "123456",
        phone: "9876543210",
        address: "College Road, Near City Mall",
        city: "Indore",
        restaurantType: "cafe",
        themeColor: "#F97316",
        isActive: true,
        isLive: true,
        settings: {
          mainSettings: {
            timezone: "Asia/Kolkata",
            gstNumber: "23AABCU9603R1ZM",
            defaultTimeMinutes: 10,
          },
          taxFeesSettings: {
            deliveryFee: 30,
            gstTaxRate: 5,
            pstTaxRate: 0,
            hstTaxRate: 0,
          },
        },
        featureToggles: {
          pos: true,
          kotKitchen: true,
          receptionView: false,
          deliveryFleet: false,
          tableManagement: true,
          accountClosing: true,
          employeeAttendance: false,
          expenses: false,
        },
      });
    } else {
      rfcBranch.name = "RFC Cafe & Restro";
      rfcBranch.code = "RFC";
      rfcBranch.email = "rfc@admin.com";
      rfcBranch.password = "123456";
      rfcBranch.themeColor = "#F97316";
      rfcBranch.restaurantType = "cafe";
      rfcBranch.isActive = true;
      rfcBranch.isLive = true;
    }
    await rfcBranch.save();
    console.log("   ✅ Branch POS 1 (RFC Cafe): rfc@admin.com / 123456 (Code: RFC)");

    // ─────────────────────────────────────────────────────────────
    // 3. BRANCH POS ACCOUNT 2 (Central Main Branch)
    // ─────────────────────────────────────────────────────────────
    let mainBranch = await Branch.findOne({ $or: [{ code: "BR01" }, { email: "branch@admin.com" }] });
    if (!mainBranch) {
      mainBranch = new Branch({
        name: "Taste-It Central Branch",
        code: "BR01",
        email: "branch@admin.com",
        password: "123456",
        phone: "9876543211",
        address: "Main Market, MG Road",
        city: "Indore",
        restaurantType: "cafe",
        themeColor: "#F97316",
        isActive: true,
        isLive: true,
        settings: {
          mainSettings: {
            timezone: "Asia/Kolkata",
            gstNumber: "23AABCU9603R1ZM",
            defaultTimeMinutes: 10,
          },
          taxFeesSettings: {
            deliveryFee: 30,
            gstTaxRate: 5,
          },
        },
        featureToggles: {
          pos: true,
          kotKitchen: true,
          tableManagement: true,
          accountClosing: true,
        },
      });
    } else {
      mainBranch.name = "Taste-It Central Branch";
      mainBranch.code = "BR01";
      mainBranch.email = "branch@admin.com";
      mainBranch.password = "123456";
      mainBranch.themeColor = "#F97316";
      mainBranch.isActive = true;
      mainBranch.isLive = true;
    }
    await mainBranch.save();
    console.log("   ✅ Branch POS 2 (Central): branch@admin.com / 123456 (Code: BR01)");

    // ─────────────────────────────────────────────────────────────
    // 4. CASHIER EMPLOYEES (For POS Staff PIN Login)
    // ─────────────────────────────────────────────────────────────
    let rfcCashier = await Employee.findOne({ branchId: rfcBranch._id, employeeId: "1001" });
    if (!rfcCashier) {
      rfcCashier = new Employee({
        branchId: rfcBranch._id,
        employeeId: "1001",
        name: "Mohit (Cashier)",
        role: "cashier",
        pin: "1234",
        isActive: true,
        permissions: {
          pos: true,
          dashboard: true,
          orders: true,
          orders_list: true,
          sales_summary: true,
        },
      });
    } else {
      rfcCashier.pin = "1234";
      rfcCashier.isActive = true;
    }
    await rfcCashier.save();
    console.log("   ✅ POS Cashier (RFC): Emp ID: 1001 / PIN: 1234");

    let centralCashier = await Employee.findOne({ branchId: mainBranch._id, employeeId: "1001" });
    if (!centralCashier) {
      centralCashier = new Employee({
        branchId: mainBranch._id,
        employeeId: "1001",
        name: "Central Cashier",
        role: "cashier",
        pin: "1234",
        isActive: true,
        permissions: {
          pos: true,
          dashboard: true,
          orders: true,
          orders_list: true,
        },
      });
    } else {
      centralCashier.pin = "1234";
      centralCashier.isActive = true;
    }
    await centralCashier.save();
    console.log("   ✅ POS Cashier (Central): Emp ID: 1001 / PIN: 1234");

    console.log("\n========================================================");
    console.log("  ALL LOGIN CREDENTIALS CONFIGURED SUCCESSFULLY! 🎉");
    console.log("========================================================");
    console.log("  👑 SUPER ADMIN PORTAL (http://localhost:3001/login)");
    console.log("     Email    : admin@admin.com");
    console.log("     Password : 123456");
    console.log("--------------------------------------------------------");
    console.log("  🖥️  BRANCH POS - MASTER LOGIN (http://localhost:3000/login)");
    console.log("     Email    : rfc@admin.com  (or branch@admin.com)");
    console.log("     Password : 123456");
    console.log("--------------------------------------------------------");
    console.log("  👤 BRANCH POS - STAFF PIN LOGIN");
    console.log("     Emp ID   : 1001");
    console.log("     PIN      : 1234");
    console.log("========================================================\n");

    process.exit(0);
  } catch (err) {
    console.error("\n❌ Auth Seed Error:", err.message);
    process.exit(1);
  }
}

seedAuthUsers();

