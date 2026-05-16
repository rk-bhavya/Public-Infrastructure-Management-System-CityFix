const express = require("express");
const router = express.Router();
const {
  getDashboardStats, getAllUsers, updateUserRole, toggleUserStatus,deleteUser,hardDeleteUser, createDeptAdmin
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect, authorize("admin"));

router.get("/dashboard", getDashboardStats);
router.get("/users", getAllUsers);
router.put("/users/:id/role", updateUserRole);
router.put("/users/:id/toggle", toggleUserStatus);
router.delete("/users/:id",       deleteUser);        // soft delete (deactivate)
router.delete("/users/:id/hard",  hardDeleteUser);    // hard delete (permanent)
router.post("/dept-admins", createDeptAdmin);
module.exports = router;