const express = require("express");
const router = express.Router();
const tableController = require("../controllers/table.controller");

router.get("/", tableController.getTables);
router.post("/", tableController.createTable);
router.post("/transfer", tableController.transferTable);
router.post("/:id/clear", tableController.clearTable);
router.put("/:id", tableController.updateTable);
router.delete("/:id", tableController.deleteTable);
router.patch("/:id/status", tableController.updateTableStatus);

module.exports = router;
