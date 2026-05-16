const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  createComplaint, getComplaints, getComplaintById,
  updateStatus, assignComplaint, submitFeedback, deleteComplaint,adminDeleteComplaint,
} = require("../controllers/complaintController");
const { protect, authorize } = require("../middleware/auth");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.route("/")
  .get(protect, getComplaints)
  .post(protect, authorize("citizen"), upload.array("images", 5), createComplaint);

router.route("/:id")
  .get(protect, getComplaintById)
  .delete(protect, authorize("citizen"), deleteComplaint);

router.put("/:id/status",
protect,
authorize("staff","admin","dept_admin"),
updateStatus
);
router.put("/:id/assign", protect, authorize("admin"), assignComplaint);
router.post("/:id/feedback", protect, authorize("citizen"), submitFeedback);
router.delete("/admin/:id", protect, authorize("admin"), adminDeleteComplaint);
module.exports = router;