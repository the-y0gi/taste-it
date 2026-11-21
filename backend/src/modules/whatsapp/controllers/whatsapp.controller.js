const whatsappService = require("../services/whatsapp.service");
const { Order } = require("../../order/models/order.model");
const logger = require("../../../shared/utils/logger");

exports.getStatus = async (req, res) => {
  try {
    const status = whatsappService.getStatus();
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    logger.error(`WhatsApp Controller getStatus Error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.connect = async (req, res) => {
  try {
    await whatsappService.connect();
    const status = whatsappService.getStatus();
    res.status(200).json({
      success: true,
      message: "Connection process initiated.",
      data: status,
    });
  } catch (error) {
    logger.error(`WhatsApp Controller connect Error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.disconnect = async (req, res) => {
  try {
    await whatsappService.disconnect();
    res.status(200).json({
      success: true,
      message: "WhatsApp disconnected successfully.",
      data: whatsappService.getStatus(),
    });
  } catch (error) {
    logger.error(`WhatsApp Controller disconnect Error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendTestMessage = async (req, res) => {
  try {
    const { phone, branchName, preferences } = req.body;
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
      });
    }

    const result = await whatsappService.sendTestMessage(phone, branchName, preferences);
    res.status(200).json({
      success: true,
      message: `Test message sent to ${result.phone}`,
      data: result,
    });
  } catch (error) {
    logger.error(`WhatsApp Controller sendTestMessage Error: ${error.message}`);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.sendBillReceipt = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (!order.customer?.phone) {
      return res.status(400).json({
        success: false,
        message: "This order does not have a customer phone number.",
      });
    }

    const result = await whatsappService.sendBillReceipt(order);
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      success: true,
      message: `WhatsApp bill sent for Order #${order.orderNumber}`,
      data: result,
    });
  } catch (error) {
    logger.error(`WhatsApp Controller sendBillReceipt Error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};
