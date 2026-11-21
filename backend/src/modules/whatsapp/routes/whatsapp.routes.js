const express = require("express");
const router = express.Router();
const whatsappController = require("../controllers/whatsapp.controller");

router.get("/status", whatsappController.getStatus);
router.post("/connect", whatsappController.connect);
router.post("/disconnect", whatsappController.disconnect);
router.post("/test-message", whatsappController.sendTestMessage);
router.post("/send-bill/:orderId", whatsappController.sendBillReceipt);

module.exports = router;
