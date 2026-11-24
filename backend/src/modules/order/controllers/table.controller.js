const Table = require("../models/table.model");
const Order = require("../models/order.model");
const Branch = require("../../company/models/branch.model");
const logger = require("../../../shared/utils/logger");

const DEFAULT_SEED_TABLES = [
  { name: "T-1", section: "Main Dining", capacity: 2, shape: "square" },
  { name: "T-2", section: "Main Dining", capacity: 4, shape: "square" },
  { name: "T-3", section: "Main Dining", capacity: 4, shape: "square" },
  { name: "T-4", section: "Main Dining", capacity: 6, shape: "rectangle" },
  { name: "T-5", section: "AC Hall", capacity: 4, shape: "square" },
  { name: "T-6", section: "AC Hall", capacity: 6, shape: "rectangle" },
];

/**
 * Get all tables for a branch (with populated current active order)
 */
exports.getTables = async (req, res) => {
  try {
    const { branchId } = req.query;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "branchId is required",
      });
    }

    let tables = await Table.find({ branchId, isActive: { $ne: false } })
      .populate({
        path: "currentOrderId",
        select: "orderNumber orderType paymentStatus orderStatus total subtotal tax discount items customer table orderSource notes createdAt",
      })
      .sort({ section: 1, sortOrder: 1, name: 1 })
      .lean();

    // Auto-seed default tables if branch has 0 tables configured
    if (tables.length === 0) {
      const seeded = DEFAULT_SEED_TABLES.map((t, idx) => ({
        ...t,
        branchId,
        sortOrder: idx,
        status: "available",
      }));

      await Table.insertMany(seeded);

      tables = await Table.find({ branchId, isActive: { $ne: false } })
        .populate({
          path: "currentOrderId",
          select: "orderNumber orderType paymentStatus orderStatus total subtotal tax discount items customer table orderSource notes createdAt",
        })
        .sort({ section: 1, sortOrder: 1, name: 1 })
        .lean();
    }

    // Self-healing: If table is marked occupied or billed, but order is already paid/completed/cancelled
    const healedUpdates = [];
    for (const table of tables) {
      if (table.status === "occupied" || table.status === "billed") {
        if (!table.currentOrderId || table.currentOrderId.paymentStatus === "paid" || table.currentOrderId.orderStatus === "completed" || table.currentOrderId.orderStatus === "cancelled") {
          table.status = "available";
          table.currentOrderId = null;
          table.occupiedSince = null;
          healedUpdates.push(
            Table.findByIdAndUpdate(table._id, {
              status: "available",
              currentOrderId: null,
              occupiedSince: null,
            })
          );
        }
      }
    }
    if (healedUpdates.length > 0) {
      await Promise.all(healedUpdates);
    }

    // Extract unique sections
    const sections = Array.from(new Set(tables.map((t) => t.section || "Main Dining")));

    return res.status(200).json({
      success: true,
      count: tables.length,
      sections,
      data: tables,
    });
  } catch (error) {
    logger.error(`Error in getTables: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch tables",
    });
  }
};

/**
 * Create a new table
 */
exports.createTable = async (req, res) => {
  try {
    const { branchId, name, section, capacity, shape } = req.body;

    if (!branchId || !name) {
      return res.status(400).json({
        success: false,
        message: "branchId and table name are required",
      });
    }

    // Check duplicate name in same branch
    const existing = await Table.findOne({
      branchId,
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      isActive: { $ne: false },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Table with name "${name}" already exists in this branch.`,
      });
    }

    const table = new Table({
      branchId,
      name: name.trim(),
      section: section ? section.trim() : "Main Dining",
      capacity: Number(capacity) || 4,
      shape: shape || "square",
      status: "available",
    });

    await table.save();

    return res.status(201).json({
      success: true,
      message: `Table "${table.name}" created successfully`,
      data: table,
    });
  } catch (error) {
    logger.error(`Error in createTable: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create table",
    });
  }
};

/**
 * Update table details (name, section, capacity, shape, etc.)
 */
exports.updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, section, capacity, shape, isActive, sortOrder } = req.body;

    const table = await Table.findById(id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    if (name && name.trim() !== table.name) {
      const duplicate = await Table.findOne({
        branchId: table.branchId,
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
        isActive: { $ne: false },
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Another table named "${name}" already exists in this branch`,
        });
      }
      table.name = name.trim();
    }

    if (section !== undefined) table.section = section.trim();
    if (capacity !== undefined) table.capacity = Number(capacity) || 4;
    if (shape !== undefined) table.shape = shape;
    if (isActive !== undefined) table.isActive = Boolean(isActive);
    if (sortOrder !== undefined) table.sortOrder = Number(sortOrder) || 0;

    await table.save();

    return res.status(200).json({
      success: true,
      message: "Table updated successfully",
      data: table,
    });
  } catch (error) {
    logger.error(`Error in updateTable: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update table",
    });
  }
};

/**
 * Delete table (only if available)
 */
exports.deleteTable = async (req, res) => {
  try {
    const { id } = req.params;

    const table = await Table.findById(id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    if (table.status === "occupied" || table.status === "billed") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete an occupied or billed table. Settle or transfer the order first.",
      });
    }

    await Table.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Table deleted successfully",
    });
  } catch (error) {
    logger.error(`Error in deleteTable: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete table",
    });
  }
};

/**
 * Update table status (e.g. available, occupied, billed)
 */
exports.updateTableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, orderId } = req.body;

    const table = await Table.findById(id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    if (status === "occupied") {
      table.status = "occupied";
      if (orderId) table.currentOrderId = orderId;
      table.occupiedSince = table.occupiedSince || new Date();
    } else if (status === "billed") {
      table.status = "billed";
      if (orderId) table.currentOrderId = orderId;
    } else if (status === "available") {
      table.status = "available";
      table.currentOrderId = null;
      table.occupiedSince = null;
    } else if (status === "reserved") {
      table.status = "reserved";
    }

    await table.save();

    const populated = await Table.findById(table._id).populate({
      path: "currentOrderId",
      select: "orderNumber orderType paymentStatus orderStatus total subtotal tax discount items customer table orderSource notes createdAt",
    });

    return res.status(200).json({
      success: true,
      message: `Table status updated to ${status}`,
      data: populated,
    });
  } catch (error) {
    logger.error(`Error in updateTableStatus: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update table status",
    });
  }
};

/**
 * Transfer / Shift running order from one table to another
 */
exports.transferTable = async (req, res) => {
  try {
    const { fromTableId, toTableId } = req.body;

    if (!fromTableId || !toTableId) {
      return res.status(400).json({
        success: false,
        message: "fromTableId and toTableId are required",
      });
    }

    const [fromTable, toTable] = await Promise.all([
      Table.findById(fromTableId),
      Table.findById(toTableId),
    ]);

    if (!fromTable || !toTable) {
      return res.status(404).json({
        success: false,
        message: "One or both tables not found",
      });
    }

    if (toTable.status === "occupied" || toTable.status === "billed") {
      return res.status(400).json({
        success: false,
        message: `Target table "${toTable.name}" is already occupied! Please choose an available table.`,
      });
    }

    const orderId = fromTable.currentOrderId;
    const occupiedSince = fromTable.occupiedSince || new Date();

    // Update target table
    toTable.status = fromTable.status; // 'occupied' or 'billed'
    toTable.currentOrderId = orderId;
    toTable.occupiedSince = occupiedSince;
    await toTable.save();

    // Reset source table
    fromTable.status = "available";
    fromTable.currentOrderId = null;
    fromTable.occupiedSince = null;
    await fromTable.save();

    // If there is an active order, update its table reference
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        table: {
          id: toTable._id.toString(),
          name: toTable.name,
          status: toTable.status,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Order successfully transferred from ${fromTable.name} to ${toTable.name}`,
      data: {
        fromTable,
        toTable,
      },
    });
  } catch (error) {
    logger.error(`Error in transferTable: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to transfer table",
    });
  }
};

/**
 * Force clear table (Admin / Cashier override)
 */
exports.clearTable = async (req, res) => {
  try {
    const { id } = req.params;

    const table = await Table.findByIdAndUpdate(
      id,
      {
        status: "available",
        currentOrderId: null,
        occupiedSince: null,
      },
      { new: true }
    );

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Table "${table.name}" cleared and is now available`,
      data: table,
    });
  } catch (error) {
    logger.error(`Error in clearTable: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to clear table",
    });
  }
};
