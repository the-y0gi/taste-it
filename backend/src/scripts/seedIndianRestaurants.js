require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Branch = require("../modules/company/models/branch.model");
const Category = require("../modules/menu/models/category.model");
const Product = require("../modules/menu/models/product.model");
const logger = require("../shared/utils/logger");

async function seedIndianRestaurants() {
  try {
    await connectDB();
    console.log("\n📦 Connected to MongoDB. Seeding Indian Restaurants & Menus...");

    // ─────────────────────────────────────────────────────────────
    // 1. SEED RESTAURANT 1: RFC CAFE
    // ─────────────────────────────────────────────────────────────
    console.log("\n☕ Seeding Restaurant 1: RFC Cafe...");
    let rfcBranch = await Branch.findOne({ code: "RFC" });
    if (!rfcBranch) {
      rfcBranch = new Branch({
        name: "RFC Cafe",
        code: "RFC",
        email: "rfccafe@cybernest.com",
        password: "password123",
        phone: "9876543210",
        address: "College Road, Near City Mall",
        city: "Indore",
        restaurantType: "cafe",
        themeColor: "#F97316", // Orange Theme
        logo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&auto=format&fit=crop&q=80",
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
            gstTaxRate: 5, // 2.5% CGST + 2.5% SGST
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
      await rfcBranch.save();
      console.log("   ✅ Created Branch: RFC Cafe (Code: RFC)");
    } else {
      rfcBranch.themeColor = "#F97316";
      rfcBranch.restaurantType = "cafe";
      rfcBranch.featureToggles = {
        pos: true,
        kotKitchen: true,
        receptionView: false,
        deliveryFleet: false,
        tableManagement: true,
        accountClosing: true,
        employeeAttendance: false,
        expenses: false,
      };
      await rfcBranch.save();
      console.log("   ℹ️  Existing Branch Updated: RFC Cafe");
    }

    const rfcId = rfcBranch._id;

    // Remove previous RFC menu items for clean seed
    await Product.deleteMany({ branchId: rfcId });
    await Category.deleteMany({ branchId: rfcId });

    // RFC Categories & Items
    const rfcMenu = [
      {
        category: { name: "Burger", slug: "burger", displayOrder: 1 },
        items: [
          {
            name: "Cheese Overloaded Burger",
            shortcode: "COB",
            foodType: "veg",
            pricingType: "variant",
            hasVariants: true,
            variants: [
              { name: "Lite (1 Tikki)", price: 90, isDefault: true, sizeCode: "lite", sizeName: "Lite" },
              { name: "Heavy (2 Tikki)", price: 120, sizeCode: "heavy", sizeName: "Heavy" },
            ],
            addons: [{ name: "Extra Cheese Slice", price: 20 }],
            image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80",
            kitchenLabel: "fast_food",
          },
          {
            name: "Spicy Paneer Burger",
            shortcode: "SPB",
            foodType: "veg",
            pricingType: "variant",
            hasVariants: true,
            variants: [
              { name: "Lite (1 Tikki)", price: 90, isDefault: true, sizeCode: "lite", sizeName: "Lite" },
              { name: "Heavy (2 Tikki)", price: 120, sizeCode: "heavy", sizeName: "Heavy" },
            ],
            addons: [{ name: "Extra Cheese Slice", price: 20 }],
            image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=300&auto=format&fit=crop&q=80",
            kitchenLabel: "fast_food",
          },
          {
            name: "Hot Garlic Burger",
            shortcode: "HGB",
            foodType: "veg",
            pricingType: "variant",
            hasVariants: true,
            variants: [
              { name: "Lite (1 Tikki)", price: 90, isDefault: true, sizeCode: "lite", sizeName: "Lite" },
              { name: "Heavy (2 Tikki)", price: 120, sizeCode: "heavy", sizeName: "Heavy" },
            ],
            image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300&auto=format&fit=crop&q=80",
            kitchenLabel: "fast_food",
          },
          {
            name: "Makhani Burger",
            shortcode: "MB",
            foodType: "veg",
            pricingType: "variant",
            hasVariants: true,
            variants: [
              { name: "Lite (1 Tikki)", price: 80, isDefault: true, sizeCode: "lite", sizeName: "Lite" },
              { name: "Heavy (2 Tikki)", price: 100, sizeCode: "heavy", sizeName: "Heavy" },
            ],
            kitchenLabel: "fast_food",
          },
          {
            name: "Veg Burger",
            shortcode: "VB",
            foodType: "veg",
            pricingType: "variant",
            hasVariants: true,
            variants: [
              { name: "Lite (1 Tikki)", price: 70, isDefault: true, sizeCode: "lite", sizeName: "Lite" },
              { name: "Heavy (2 Tikki)", price: 90, sizeCode: "heavy", sizeName: "Heavy" },
            ],
            image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&auto=format&fit=crop&q=80",
            kitchenLabel: "fast_food",
          },
        ],
      },
      {
        category: { name: "Sandwich", slug: "sandwich", displayOrder: 2 },
        items: [
          {
            name: "Pizza Sandwich",
            shortcode: "PS",
            foodType: "veg",
            pricingType: "variant",
            hasVariants: true,
            variants: [
              { name: "Lite (2 Layer)", price: 100, isDefault: true, sizeCode: "2layer", sizeName: "2 Layer" },
              { name: "Heavy (3 Layer)", price: 140, sizeCode: "3layer", sizeName: "3 Layer" },
            ],
            image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&auto=format&fit=crop&q=80",
            kitchenLabel: "fast_food",
          },
          {
            name: "Indoori Sandwich",
            shortcode: "IS",
            foodType: "veg",
            pricingType: "variant",
            hasVariants: true,
            variants: [
              { name: "Lite (2 Layer)", price: 90, isDefault: true, sizeCode: "2layer", sizeName: "2 Layer" },
              { name: "Heavy (3 Layer)", price: 120, sizeCode: "3layer", sizeName: "3 Layer" },
            ],
            kitchenLabel: "fast_food",
          },
          {
            name: "Spicy Paneer Sandwich",
            shortcode: "SPS",
            foodType: "veg",
            pricingType: "variant",
            hasVariants: true,
            variants: [
              { name: "Lite (2 Layer)", price: 90, isDefault: true, sizeCode: "2layer", sizeName: "2 Layer" },
              { name: "Heavy (3 Layer)", price: 120, sizeCode: "3layer", sizeName: "3 Layer" },
            ],
            kitchenLabel: "fast_food",
          },
          {
            name: "Cheese Sandwich",
            shortcode: "CS",
            foodType: "veg",
            pricingType: "variant",
            hasVariants: true,
            variants: [
              { name: "Lite (2 Layer)", price: 80, isDefault: true, sizeCode: "2layer", sizeName: "2 Layer" },
              { name: "Heavy (3 Layer)", price: 110, sizeCode: "3layer", sizeName: "3 Layer" },
            ],
            kitchenLabel: "fast_food",
          },
          {
            name: "Veg Sandwich",
            shortcode: "VS",
            foodType: "veg",
            pricingType: "variant",
            hasVariants: true,
            variants: [
              { name: "Lite (2 Layer)", price: 70, isDefault: true, sizeCode: "2layer", sizeName: "2 Layer" },
              { name: "Heavy (3 Layer)", price: 100, sizeCode: "3layer", sizeName: "3 Layer" },
            ],
            kitchenLabel: "fast_food",
          },
        ],
      },
      {
        category: { name: "Maggi", slug: "maggi", displayOrder: 3 },
        items: [
          { name: "Plain Maggi", shortcode: "PM", foodType: "veg", pricingType: "single", price: 50, kitchenLabel: "fast_food" },
          { name: "Masala Maggi", shortcode: "MM", foodType: "veg", pricingType: "single", price: 60, kitchenLabel: "fast_food" },
          { name: "Cheese Maggi", shortcode: "CM", foodType: "veg", pricingType: "single", price: 60, kitchenLabel: "fast_food" },
          { name: "Peri-Peri Maggi", shortcode: "PPM", foodType: "veg", pricingType: "single", price: 60, kitchenLabel: "fast_food" },
          { name: "Punjabi Tadka Maggi", shortcode: "PTM", foodType: "veg", pricingType: "single", price: 70, kitchenLabel: "fast_food" },
          { name: "Cheese Corn Maggi", shortcode: "CCM", foodType: "veg", pricingType: "single", price: 70, kitchenLabel: "fast_food" },
          { name: "Pahado Wali Maggi", shortcode: "PWM", foodType: "veg", pricingType: "single", price: 80, isPopular: true, kitchenLabel: "fast_food" },
        ],
      },
      {
        category: { name: "Shake & Cold Coffee", slug: "shake-cold-coffee", displayOrder: 4 },
        items: [
          {
            name: "Cold Coffee",
            shortcode: "CC",
            foodType: "veg",
            pricingType: "variant",
            hasVariants: true,
            isPopular: true,
            variants: [
              { name: "Normal", price: 60, isDefault: true, sizeCode: "normal", sizeName: "Normal" },
              { name: "With Ice Cream", price: 80, sizeCode: "icecream", sizeName: "With Ice Cream" },
              { name: "VIP Pure Ice Cream", price: 120, sizeCode: "vip", sizeName: "VIP" },
            ],
            image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&auto=format&fit=crop&q=80",
            kitchenLabel: "beverages",
          },
          {
            name: "Kitkat Shake",
            shortcode: "KS",
            foodType: "veg",
            pricingType: "variant",
            hasVariants: true,
            variants: [
              { name: "Normal", price: 60, isDefault: true, sizeCode: "normal", sizeName: "Normal" },
              { name: "With Ice Cream", price: 80, sizeCode: "icecream", sizeName: "With Ice Cream" },
              { name: "VIP Pure Ice Cream", price: 120, sizeCode: "vip", sizeName: "VIP" },
            ],
            kitchenLabel: "beverages",
          },
          {
            name: "Oreo Shake",
            shortcode: "OS",
            foodType: "veg",
            pricingType: "variant",
            hasVariants: true,
            variants: [
              { name: "Normal", price: 60, isDefault: true, sizeCode: "normal", sizeName: "Normal" },
              { name: "With Ice Cream", price: 80, sizeCode: "icecream", sizeName: "With Ice Cream" },
              { name: "VIP Pure Ice Cream", price: 120, sizeCode: "vip", sizeName: "VIP" },
            ],
            kitchenLabel: "beverages",
          },
          {
            name: "Chocolate Shake",
            shortcode: "CSH",
            foodType: "veg",
            pricingType: "variant",
            hasVariants: true,
            variants: [
              { name: "Normal", price: 60, isDefault: true, sizeCode: "normal", sizeName: "Normal" },
              { name: "With Ice Cream", price: 80, sizeCode: "icecream", sizeName: "With Ice Cream" },
              { name: "VIP Pure Ice Cream", price: 120, sizeCode: "vip", sizeName: "VIP" },
            ],
            kitchenLabel: "beverages",
          },
        ],
      },
      {
        category: { name: "Pizza", slug: "pizza", displayOrder: 5 },
        items: [
          {
            name: "Farm House Pizza",
            shortcode: "FHP",
            foodType: "veg",
            pricingType: "variant",
            hasVariants: true,
            variants: [
              { name: "Normal", price: 180, isDefault: true, sizeCode: "normal", sizeName: "Normal" },
              { name: "Extra Cheese", price: 200, sizeCode: "extra_cheese", sizeName: "Extra Cheese" },
            ],
            image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&auto=format&fit=crop&q=80",
            kitchenLabel: "fast_food",
          },
          {
            name: "Paneer Tikka Pizza",
            shortcode: "PTP",
            foodType: "veg",
            pricingType: "variant",
            hasVariants: true,
            variants: [
              { name: "Normal", price: 180, isDefault: true, sizeCode: "normal", sizeName: "Normal" },
              { name: "Extra Cheese", price: 200, sizeCode: "extra_cheese", sizeName: "Extra Cheese" },
            ],
            kitchenLabel: "fast_food",
          },
          {
            name: "Margherita Pizza",
            shortcode: "MARG",
            foodType: "veg",
            pricingType: "variant",
            hasVariants: true,
            variants: [
              { name: "Normal", price: 140, isDefault: true, sizeCode: "normal", sizeName: "Normal" },
              { name: "Extra Cheese", price: 160, sizeCode: "extra_cheese", sizeName: "Extra Cheese" },
            ],
            kitchenLabel: "fast_food",
          },
          {
            name: "Veg Pizza",
            shortcode: "VP",
            foodType: "veg",
            pricingType: "variant",
            hasVariants: true,
            variants: [
              { name: "Normal", price: 100, isDefault: true, sizeCode: "normal", sizeName: "Normal" },
              { name: "Extra Cheese", price: 120, sizeCode: "extra_cheese", sizeName: "Extra Cheese" },
            ],
            kitchenLabel: "fast_food",
          },
        ],
      },
      {
        category: { name: "Fries & Momos", slug: "fries-momos", displayOrder: 6 },
        items: [
          { name: "French Fries", shortcode: "FF", foodType: "veg", pricingType: "single", price: 80, kitchenLabel: "fast_food" },
          { name: "Peri Peri Fries", shortcode: "PPF", foodType: "veg", pricingType: "single", price: 90, kitchenLabel: "fast_food" },
          { name: "Fried Momos", shortcode: "FM", foodType: "veg", pricingType: "single", price: 100, kitchenLabel: "fast_food" },
          { name: "Kurkure Momos", shortcode: "KM", foodType: "veg", pricingType: "single", price: 120, kitchenLabel: "fast_food" },
          { name: "Paneer 65", shortcode: "P65", foodType: "veg", pricingType: "single", price: 160, kitchenLabel: "fast_food" },
        ],
      },
      {
        category: { name: "Combos", slug: "combos", displayOrder: 7 },
        items: [
          {
            name: "Burger + French Fries + Coke",
            shortcode: "COMBO-1",
            foodType: "veg",
            pricingType: "single",
            price: 150,
            itemType: "combo",
            badge: "Best Seller",
            kitchenLabel: "fast_food",
          },
          {
            name: "Pizza + French Fries + Coke",
            shortcode: "COMBO-2",
            foodType: "veg",
            pricingType: "single",
            price: 200,
            itemType: "combo",
            badge: "Popular",
            kitchenLabel: "fast_food",
          },
        ],
      },
      {
        category: { name: "Desserts", slug: "desserts", displayOrder: 8 },
        items: [
          { name: "Sizzling Brownie", shortcode: "SB", foodType: "veg", pricingType: "single", price: 120, kitchenLabel: "beverages" },
          { name: "Sizzling Brownie Extra Ice Cream", shortcode: "SBE", foodType: "veg", pricingType: "single", price: 140, kitchenLabel: "beverages" },
        ],
      },
    ];

    for (const catData of rfcMenu) {
      const cat = await Category.create({
        branchId: rfcId,
        name: catData.category.name,
        slug: catData.category.slug,
        displayOrder: catData.category.displayOrder,
        isActive: true,
      });

      for (const itemData of catData.items) {
        await Product.create({
          branchId: rfcId,
          categoryId: cat._id,
          name: itemData.name,
          shortcode: itemData.shortcode,
          foodType: itemData.foodType,
          pricingType: itemData.pricingType,
          price: itemData.price || 0,
          hasVariants: !!itemData.hasVariants,
          variants: itemData.variants || [],
          addons: itemData.addons || [],
          badge: itemData.badge || null,
          isPopular: !!itemData.isPopular,
          image: itemData.image || "",
          itemType: itemData.itemType || "simple",
          kitchenLabel: itemData.kitchenLabel || "fast_food",
          isActive: true,
        });
      }
    }
    console.log("   ✅ Seeded RFC Cafe Menu (8 Categories, 35+ Items)");


    // ─────────────────────────────────────────────────────────────
    // 2. SEED RESTAURANT 2: JAINSON'S FAMILY RESTAURANT
    // ─────────────────────────────────────────────────────────────
    console.log("\n🍛 Seeding Restaurant 2: Jainson's Family Restaurant...");
    let jsnBranch = await Branch.findOne({ code: "JSN" });
    if (!jsnBranch) {
      jsnBranch = new Branch({
        name: "Jainson's Family Restaurant",
        code: "JSN",
        email: "jainsons@cybernest.com",
        password: "password123",
        phone: "07161220099",
        address: "Kirana Market, Main Road",
        city: "Nagpur",
        restaurantType: "fine_dine",
        themeColor: "#DC2626", // Crimson Red Theme
        logo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop&q=80",
        isActive: true,
        isLive: true,
        settings: {
          mainSettings: {
            timezone: "Asia/Kolkata",
            gstNumber: "27AABCU9603R1ZM",
            defaultTimeMinutes: 15,
          },
          taxFeesSettings: {
            deliveryFee: 40,
            gstTaxRate: 5, // 2.5% CGST + 2.5% SGST
            pstTaxRate: 0,
            hstTaxRate: 0,
          },
        },
        featureToggles: {
          pos: true,
          kotKitchen: true,
          receptionView: true,
          deliveryFleet: true,
          tableManagement: true,
          accountClosing: true,
          employeeAttendance: true,
          expenses: true,
        },
      });
      await jsnBranch.save();
      console.log("   ✅ Created Branch: Jainson's (Code: JSN)");
    } else {
      jsnBranch.themeColor = "#DC2626";
      jsnBranch.restaurantType = "fine_dine";
      jsnBranch.featureToggles = {
        pos: true,
        kotKitchen: true,
        receptionView: true,
        deliveryFleet: true,
        tableManagement: true,
        accountClosing: true,
        employeeAttendance: true,
        expenses: true,
      };
      await jsnBranch.save();
      console.log("   ℹ️  Existing Branch Updated: Jainson's");
    }

    const jsnId = jsnBranch._id;

    // Remove previous Jainson's menu items for clean seed
    await Product.deleteMany({ branchId: jsnId });
    await Category.deleteMany({ branchId: jsnId });

    // Jainson's Categories & Items
    const jsnMenu = [
      {
        category: { name: "Thalis & Mini Meals", slug: "thalis-mini-meals", displayOrder: 1 },
        items: [
          {
            name: "Mini Meal Limited",
            shortcode: "THALI-MINI",
            foodType: "veg",
            pricingType: "single",
            price: 160,
            description: "Sabji + Dal + Raita + Salad + 3 Roti",
            badge: "Best Seller",
            kitchenLabel: "main_kitchen",
          },
          {
            name: "Special Thali Limited",
            shortcode: "THALI-SPL",
            foodType: "veg",
            pricingType: "single",
            price: 190,
            description: "2 Sabji + Dal + Jeera Rice + Raita/Dahi + Salad + 4 Roti",
            badge: "Popular",
            kitchenLabel: "main_kitchen",
          },
          {
            name: "Jainson's Special Thali",
            shortcode: "THALI-JSN",
            foodType: "veg",
            pricingType: "single",
            price: 240,
            isJainAvailable: true,
            description: "Paneer Sabji + Sabji + Dal + Jeera Rice + Raita + Salad + 4 Butter Roti",
            badge: "Popular",
            kitchenLabel: "main_kitchen",
          },
        ],
      },
      {
        category: { name: "Paneer Ka Swad", slug: "paneer-ka-swad", displayOrder: 2 },
        items: [
          {
            name: "Butter Paneer Masala",
            shortcode: "BPM",
            foodType: "veg",
            pricingType: "variant",
            hasVariants: true,
            isJainAvailable: true,
            variants: [
              { name: "Half", price: 115, isDefault: true, sizeCode: "half", sizeName: "Half" },
              { name: "Full", price: 175, sizeCode: "full", sizeName: "Full" },
            ],
            addons: [{ name: "Butter Cube", price: 10 }],
            image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&auto=format&fit=crop&q=80",
            kitchenLabel: "main_kitchen",
          },
          {
            name: "Mutter Paneer",
            shortcode: "MP",
            foodType: "veg",
            pricingType: "variant",
            hasVariants: true,
            variants: [
              { name: "Half", price: 115, isDefault: true, sizeCode: "half", sizeName: "Half" },
              { name: "Full", price: 175, sizeCode: "full", sizeName: "Full" },
            ],
            kitchenLabel: "main_kitchen",
          },
          {
            name: "Palak Paneer",
            shortcode: "PP",
            foodType: "veg",
            pricingType: "single",
            price: 175,
            kitchenLabel: "main_kitchen",
          },
          {
            name: "Kadai Paneer",
            shortcode: "KP",
            foodType: "veg",
            pricingType: "single",
            price: 195,
            kitchenLabel: "main_kitchen",
          },
          {
            name: "Paneer Tikka Masala",
            shortcode: "PTM",
            foodType: "veg",
            pricingType: "single",
            price: 235,
            kitchenLabel: "main_kitchen",
          },
          {
            name: "Paneer Bhurji",
            shortcode: "PBHURJI",
            foodType: "veg",
            pricingType: "single",
            price: 205,
            kitchenLabel: "main_kitchen",
          },
        ],
      },
      {
        category: { name: "Dal Ka Kamaal", slug: "dal-ka-kamaal", displayOrder: 3 },
        items: [
          {
            name: "Dal Fry",
            shortcode: "DF",
            foodType: "veg",
            pricingType: "variant",
            hasVariants: true,
            variants: [
              { name: "Half", price: 90, isDefault: true, sizeCode: "half", sizeName: "Half" },
              { name: "Full", price: 125, sizeCode: "full", sizeName: "Full" },
            ],
            image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&auto=format&fit=crop&q=80",
            kitchenLabel: "main_kitchen",
          },
          {
            name: "Dal Tadka",
            shortcode: "DT",
            foodType: "veg",
            pricingType: "variant",
            hasVariants: true,
            variants: [
              { name: "Half", price: 95, isDefault: true, sizeCode: "half", sizeName: "Half" },
              { name: "Full", price: 135, sizeCode: "full", sizeName: "Full" },
            ],
            kitchenLabel: "main_kitchen",
          },
          {
            name: "Punjabi Dal Tadka",
            shortcode: "PDT",
            foodType: "veg",
            pricingType: "single",
            price: 145,
            kitchenLabel: "main_kitchen",
          },
        ],
      },
      {
        category: { name: "Indian Main Course", slug: "indian-main-course", displayOrder: 4 },
        items: [
          {
            name: "Mix Veg",
            shortcode: "MV",
            foodType: "veg",
            pricingType: "variant",
            hasVariants: true,
            variants: [
              { name: "Half", price: 105, isDefault: true, sizeCode: "half", sizeName: "Half" },
              { name: "Full", price: 155, sizeCode: "full", sizeName: "Full" },
            ],
            kitchenLabel: "main_kitchen",
          },
          {
            name: "Chana Masala",
            shortcode: "CMASALA",
            foodType: "veg",
            pricingType: "variant",
            hasVariants: true,
            variants: [
              { name: "Half", price: 115, isDefault: true, sizeCode: "half", sizeName: "Half" },
              { name: "Full", price: 155, sizeCode: "full", sizeName: "Full" },
            ],
            kitchenLabel: "main_kitchen",
          },
          {
            name: "Sev Tomato",
            shortcode: "ST",
            foodType: "veg",
            pricingType: "single",
            price: 165,
            isJainAvailable: true,
            kitchenLabel: "main_kitchen",
          },
          {
            name: "Malai Kofta",
            shortcode: "MK",
            foodType: "veg",
            pricingType: "single",
            price: 195,
            kitchenLabel: "main_kitchen",
          },
        ],
      },
      {
        category: { name: "Roti Tandoor Se Ya Tawa Se", slug: "roti-tandoor-tawa", displayOrder: 5 },
        items: [
          { name: "Plain Chapati", shortcode: "PC", foodType: "veg", pricingType: "single", price: 11, kitchenLabel: "tandoor" },
          { name: "Butter Chapati", shortcode: "BC", foodType: "veg", pricingType: "single", price: 12, kitchenLabel: "tandoor" },
          { name: "Tandoori Roti", shortcode: "TR", foodType: "veg", pricingType: "single", price: 12, kitchenLabel: "tandoor" },
          { name: "Tandoori Butter Roti", shortcode: "TBR", foodType: "veg", pricingType: "single", price: 13, kitchenLabel: "tandoor" },
          { name: "Butter Naan", shortcode: "BN", foodType: "veg", pricingType: "single", price: 35, kitchenLabel: "tandoor" },
          { name: "Garlic Naan", shortcode: "GN", foodType: "veg", pricingType: "single", price: 60, kitchenLabel: "tandoor" },
          { name: "Aloo Paratha (1pc)", shortcode: "AP", foodType: "veg", pricingType: "single", price: 45, kitchenLabel: "tandoor" },
        ],
      },
      {
        category: {
          name: "South Indian",
          slug: "south-indian",
          displayOrder: 6,
          operatingHours: { isRestricted: true, startTime: "09:00 AM", endTime: "08:00 PM" },
        },
        items: [
          { name: "Plain Dosa", shortcode: "PDOSA", foodType: "veg", pricingType: "single", price: 90, kitchenLabel: "chinese" },
          { name: "Masala Dosa", shortcode: "MDOSA", foodType: "veg", pricingType: "single", price: 100, isPopular: true, kitchenLabel: "chinese" },
          { name: "Paneer Masala Dosa", shortcode: "PMDOSA", foodType: "veg", pricingType: "single", price: 120, kitchenLabel: "chinese" },
          { name: "Mix Uttapam", shortcode: "MUTTAPAM", foodType: "veg", pricingType: "single", price: 100, kitchenLabel: "chinese" },
        ],
      },
      {
        category: { name: "Chinese Main Course", slug: "chinese-main-course", displayOrder: 7 },
        items: [
          { name: "Veg Noodles", shortcode: "VNOODLES", foodType: "veg", pricingType: "single", price: 135, kitchenLabel: "chinese" },
          { name: "Veg Manchurian Dry", shortcode: "VMD", foodType: "veg", pricingType: "single", price: 165, kitchenLabel: "chinese" },
          { name: "Veg Manchurian Gravy", shortcode: "VMG", foodType: "veg", pricingType: "single", price: 175, kitchenLabel: "chinese" },
          { name: "Chilly Paneer Dry", shortcode: "CPD", foodType: "veg", pricingType: "single", price: 175, kitchenLabel: "chinese" },
          { name: "Veg Fried Rice", shortcode: "VFR", foodType: "veg", pricingType: "single", price: 185, kitchenLabel: "chinese" },
        ],
      },
      {
        category: { name: "Khane Ke Saath", slug: "khane-ke-saath", displayOrder: 8 },
        items: [
          { name: "Butter Cube", shortcode: "BUTTER", foodType: "veg", pricingType: "single", price: 10, kitchenLabel: "main_kitchen" },
          { name: "Roasted Papad", shortcode: "RPAPAD", foodType: "veg", pricingType: "single", price: 20, kitchenLabel: "main_kitchen" },
          { name: "Masala Papad", shortcode: "MPAPAD", foodType: "veg", pricingType: "single", price: 30, kitchenLabel: "main_kitchen" },
          { name: "Green Salad", shortcode: "GSALAD", foodType: "veg", pricingType: "single", price: 80, kitchenLabel: "main_kitchen" },
          { name: "Plain Curd", shortcode: "CURD", foodType: "veg", pricingType: "single", price: 60, kitchenLabel: "main_kitchen" },
          { name: "Boondi Raita", shortcode: "BRAITA", foodType: "veg", pricingType: "single", price: 80, kitchenLabel: "main_kitchen" },
        ],
      },
      {
        category: { name: "Soups", slug: "soups", displayOrder: 9 },
        items: [
          { name: "Tomato Soup", shortcode: "TSOUP", foodType: "veg", pricingType: "single", price: 80, kitchenLabel: "chinese" },
          { name: "Hot & Sour Soup", shortcode: "HSSOUP", foodType: "veg", pricingType: "single", price: 80, kitchenLabel: "chinese" },
          { name: "Sweet Corn Soup", shortcode: "SCSOUP", foodType: "veg", pricingType: "single", price: 80, kitchenLabel: "chinese" },
        ],
      },
    ];

    for (const catData of jsnMenu) {
      const cat = await Category.create({
        branchId: jsnId,
        name: catData.category.name,
        slug: catData.category.slug,
        displayOrder: catData.category.displayOrder,
        operatingHours: catData.category.operatingHours || { isRestricted: false },
        isActive: true,
      });

      for (const itemData of catData.items) {
        await Product.create({
          branchId: jsnId,
          categoryId: cat._id,
          name: itemData.name,
          shortcode: itemData.shortcode,
          foodType: itemData.foodType,
          pricingType: itemData.pricingType,
          price: itemData.price || 0,
          hasVariants: !!itemData.hasVariants,
          variants: itemData.variants || [],
          addons: itemData.addons || [],
          badge: itemData.badge || null,
          isPopular: !!itemData.isPopular,
          isJainAvailable: !!itemData.isJainAvailable,
          description: itemData.description || "",
          image: itemData.image || "",
          itemType: itemData.itemType || "simple",
          kitchenLabel: itemData.kitchenLabel || "main_kitchen",
          isActive: true,
        });
      }
    }
    console.log("   ✅ Seeded Jainson's Restaurant Menu (9 Categories, 40+ Items)");

    console.log("\n========================================================");
    console.log("🎉 INDIAN RESTAURANTS & MENUS SEEDED SUCCESSFULLY!");
    console.log("========================================================");
    console.log(`1. RFC Cafe (Cafe Format):`);
    console.log(`   - Branch Code : RFC`);
    console.log(`   - Login Email : rfccafe@cybernest.com`);
    console.log(`   - Password    : password123`);
    console.log(`   - Theme Color : Orange (#F97316)`);
    console.log(`\n2. Jainson's (Family Dine-In & Thali Format):`);
    console.log(`   - Branch Code : JSN`);
    console.log(`   - Login Email : jainsons@cybernest.com`);
    console.log(`   - Password    : password123`);
    console.log(`   - Theme Color : Red (#DC2626)`);
    console.log("========================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed Error:", error);
    process.exit(1);
  }
}

seedIndianRestaurants();
