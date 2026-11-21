const whatsappRoutes = require("./routes/whatsapp.routes");
const whatsappService = require("./services/whatsapp.service");

exports.initWhatsAppModule = (app) => {
  app.use("/api/whatsapp", whatsappRoutes);
  // Auto-init WhatsApp session in background
  whatsappService.init().catch(() => {});
};
