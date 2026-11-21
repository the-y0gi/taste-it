const path = require("path");
const fs = require("fs");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const QRCode = require("qrcode");
const logger = require("../../../shared/utils/logger");

const AUTH_DIR = path.resolve(__dirname, "../../../../data/whatsapp_auth");

class WhatsAppService {
  constructor() {
    this.sock = null;
    this.status = "disconnected"; // "disconnected" | "connecting" | "qr_ready" | "connected"
    this.qrCode = null; // Base64 data URL
    this.connectedPhone = null;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  // Initialize and auto-connect if previous session exists
  async init() {
    try {
      if (!fs.existsSync(AUTH_DIR)) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
      }

      // Check if session creds exist
      const credsPath = path.join(AUTH_DIR, "creds.json");
      if (fs.existsSync(credsPath)) {
        logger.info("WhatsApp: Found existing session creds, connecting...");
        await this.connect();
      } else {
        logger.info("WhatsApp: No saved session. Ready to connect on request.");
      }
    } catch (error) {
      logger.error(`WhatsApp Init Error: ${error.message}`);
    }
  }

  async connect() {
    if (this.isConnecting) return;
    this.isConnecting = true;
    this.status = "connecting";

    try {
      if (!fs.existsSync(AUTH_DIR)) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

      this.sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        browser: ["Taste-It POS", "Desktop", "1.0.0"],
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
      });

      // Handle connection updates (QR code, connection state)
      this.sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            this.qrCode = await QRCode.toDataURL(qr, {
              margin: 2,
              scale: 8,
              color: { dark: "#000000", light: "#ffffff" },
            });
            this.status = "qr_ready";
            logger.info("WhatsApp: New QR Code generated for scanning.");
          } catch (qrErr) {
            logger.error(`WhatsApp QR Generation Error: ${qrErr.message}`);
          }
        }

        if (connection === "open") {
          this.status = "connected";
          this.qrCode = null;
          this.reconnectAttempts = 0;
          this.isConnecting = false;

          const rawId = this.sock.user?.id || "";
          this.connectedPhone = rawId.split(":")[0] || rawId.split("@")[0];
          logger.info(`WhatsApp Connected Successfully! Phone: +${this.connectedPhone}`);
        } else if (connection === "close") {
          this.isConnecting = false;
          const statusCode =
            lastDisconnect?.error?.output?.statusCode ||
            lastDisconnect?.error?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          logger.warn(
            `WhatsApp Connection Closed. Status code: ${statusCode}, Reconnecting: ${shouldReconnect}`,
          );

          if (shouldReconnect) {
            this.status = "connecting";
            if (this.reconnectAttempts < 5) {
              this.reconnectAttempts++;
              setTimeout(() => this.connect(), 4000);
            } else {
              this.status = "disconnected";
            }
          } else {
            // Logged out by user: clean up session
            this.status = "disconnected";
            this.connectedPhone = null;
            this.qrCode = null;
            this.clearAuth();
          }
        }
      });

      // Persist auth credentials on update
      this.sock.ev.on("creds.update", saveCreds);
    } catch (error) {
      this.isConnecting = false;
      this.status = "disconnected";
      logger.error(`WhatsApp Connection Error: ${error.message}`);
    }
  }

  // Logout / clear session to link another number
  async disconnect() {
    try {
      if (this.sock) {
        await this.sock.logout().catch(() => {});
        this.sock.end(new Error("User disconnected"));
        this.sock = null;
      }
    } catch (e) {}

    this.status = "disconnected";
    this.connectedPhone = null;
    this.qrCode = null;
    this.clearAuth();
    return { success: true };
  }

  clearAuth() {
    try {
      if (fs.existsSync(AUTH_DIR)) {
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        fs.mkdirSync(AUTH_DIR, { recursive: true });
      }
    } catch (e) {
      logger.warn(`Failed to clear auth dir: ${e.message}`);
    }
  }

  getStatus() {
    return {
      connected: this.status === "connected",
      status: this.status,
      phone: this.connectedPhone,
      qrCode: this.qrCode,
    };
  }

  // Send WhatsApp bill receipt to customer
  async sendBillReceipt(order) {
    if (!order) return { success: false, message: "No order data provided." };

    const rawPhone = order.customer?.phone || "";
    if (!rawPhone || !rawPhone.trim()) {
      return { success: false, message: "Customer phone number is missing." };
    }

    // Clean Indian Phone Number (e.g. 9876543210 -> 919876543210)
    let cleanPhone = rawPhone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = cleanPhone.substring(1);
    }
    if (cleanPhone.length === 10) {
      cleanPhone = "91" + cleanPhone;
    }

    if (cleanPhone.length < 10) {
      return { success: false, message: "Invalid customer phone number." };
    }

    const jid = `${cleanPhone}@s.whatsapp.net`;

    if (this.status !== "connected" || !this.sock) {
      logger.warn(
        `WhatsApp Bill Skipped: Gateway not connected. Order: ${order.orderNumber}, Target: ${cleanPhone}`,
      );
      return {
        success: false,
        message: "WhatsApp Gateway is not connected. Please scan QR in Settings.",
      };
    }

    try {
      let branchName = order.branchName || (order.branch && order.branch.name);
      if (!branchName || branchName === "Main Branch" || branchName === "Taste-It Restaurant") {
        if (order.branchId) {
          try {
            const Branch = require("../../branch/models/branch.model");
            const b = await Branch.findById(order.branchId).select("name").lean();
            if (b?.name) branchName = b.name;
          } catch (e) {}
        }
      }
      if (!branchName) branchName = "Restaurant POS";

      const orderNum = order.orderNumber || "POS";
      const orderType = (order.orderType || "takeout").toUpperCase();
      const customerName = order.customer?.name && order.customer.name !== "No Name"
        ? order.customer.name
        : "Valued Guest";

      const items = order.items || [];
      const itemsText = items
        .map((item) => {
          let line = `▪ *${item.quantity}x ${item.name}*`;
          if (item.selectedSize?.sizeName) {
            line += ` (${item.selectedSize.sizeName})`;
          }
          if (item.selectedVariant?.name) {
            line += ` (${item.selectedVariant.name})`;
          }
          line += ` — ₹${Number(item.totalPrice).toFixed(2)}`;
          return line;
        })
        .join("\n");

      const subtotal = Number(order.subtotal || 0).toFixed(2);
      const taxAmount = Number(order.tax || 0);
      const halfTax = (taxAmount / 2).toFixed(2);
      const total = Number(order.total || 0).toFixed(2);

      const paymentMethodStr = (order.paymentMethod || "CASH").toUpperCase();
      const isPaid = order.paymentStatus === "paid";
      const paymentStatusStr = isPaid
        ? `✓ PAID (${paymentMethodStr})`
        : "⏳ PAYMENT PENDING / TABLE BILL";

      const now = new Date();
      const dateStr = now.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const timeStr = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const prefs = order.whatsappPreferences || {};
      const includeGstSplit = prefs.includeGstSplit !== false;
      const includeGreeting = prefs.includeGreeting !== false;

      let message =
        `🧾 *${branchName.toUpperCase()}*\n` +
        `*Digital Receipt • Order #${orderNum}*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📅 *Date:* ${dateStr} • ${timeStr}\n` +
        `📦 *Order Type:* ${orderType}${order.table?.name ? ` • Table: ${order.table.name}` : ""}\n` +
        `👤 *Guest:* ${customerName}\n\n` +
        `*ORDER DETAILS:*\n` +
        `${itemsText}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Sub Total: ₹${subtotal}\n` +
        (order.discount > 0 ? `Discount: -₹${Number(order.discount).toFixed(2)}\n` : "") +
        (order.deliveryFee > 0 ? `Delivery Fee: +₹${Number(order.deliveryFee).toFixed(2)}\n` : "");

      if (includeGstSplit) {
        message +=
          `CGST (2.5%): ₹${halfTax}\n` +
          `SGST (2.5%): ₹${halfTax}\n`;
      }

      message +=
        `*TOTAL AMOUNT: ₹${total}*\n` +
        `*Payment:* ${paymentStatusStr}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n`;

      if (includeGreeting) {
        message +=
          `🙏 *Thank you for dining with ${branchName}!* \n` +
          `We hope you loved the food! Have a wonderful day & visit again ✨`;
      }

      await this.sock.sendMessage(jid, { text: message });
      logger.info(
        `WhatsApp Bill Sent Successfully! Order: ${orderNum} to +${cleanPhone}`,
      );
      return { success: true, jid };
    } catch (error) {
      logger.error(`Failed to send WhatsApp bill: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  // Send a test message to verify connection
  async sendTestMessage(targetPhone, branchName, preferences = {}) {
    if (this.status !== "connected" || !this.sock) {
      throw new Error("WhatsApp Gateway is not connected.");
    }
    let cleanPhone = targetPhone.replace(/\D/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;
    const jid = `${cleanPhone}@s.whatsapp.net`;

    const name = branchName || "Restaurant POS";
    const includeGstSplit = preferences.includeGstSplit !== false;
    const includeGreeting = preferences.includeGreeting !== false;

    let message =
      `🧾 *${name.toUpperCase()}*\n` +
      `*Sample Digital Receipt Verification*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `✓ WhatsApp billing service is active and verified for *${name}*.\n` +
      `Digital receipts and order updates will be delivered directly from this account.\n\n` +
      `*ORDER DETAILS:*\n` +
      `▪ 1x Cheese Overloaded Burger — ₹120.00\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Sub Total: ₹120.00\n`;

    if (includeGstSplit) {
      message +=
        `CGST (2.5%): ₹3.00\n` +
        `SGST (2.5%): ₹3.00\n`;
    }

    message +=
      `*TOTAL AMOUNT: ₹126.00*\n` +
      `*Payment:* ✓ PAID via UPI\n` +
      `━━━━━━━━━━━━━━━━━━━━\n`;

    if (includeGreeting) {
      message +=
        `🙏 *Thank you for dining with ${name}!* Have a wonderful day & visit again ✨\n\n`;
    }

    message +=
      `🕒 *Timestamp:* ${new Date().toLocaleString("en-IN")}\n` +
      `*${name} POS System*`;

    await this.sock.sendMessage(jid, { text: message });
    return { success: true, phone: cleanPhone };
  }
}

// Singleton instance
const whatsappService = new WhatsAppService();
module.exports = whatsappService;
