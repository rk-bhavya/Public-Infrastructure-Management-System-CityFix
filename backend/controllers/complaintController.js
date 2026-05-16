const Complaint = require("../models/complaint");

// @POST /api/complaints  — Citizen files a complaint
exports.createComplaint = async (req, res) => {
  try {
    const { title, description, category, priority, location } = req.body;
    const images = req.files ? req.files.map((f) => f.path) : [];

    const complaint = await Complaint.create({
      title, description, category, priority, location,
      images,
      citizen: req.user._id,
      statusHistory: [{ status: "pending", changedBy: req.user._id, comment: "Complaint filed" }],
    });

    res.status(201).json({ success: true, complaint });
  } catch (err) {
  res.status(500).json({ message: err.message });
}
};

// @GET /api/complaints  — Citizen sees own; staff/admin sees all
exports.getComplaints = async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 10 } = req.query;
    const query = {};

    if (req.user.role === "citizen") query.citizen = req.user._id;
    if (req.user.role === "staff") query.assignedTo = req.user._id;
    if (req.user.role === "dept_admin") query.department = req.user.department;
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .populate("citizen", "name email phone")
      .populate("department", "name")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), complaints });
  } catch (err) {
  res.status(500).json({ message: err.message });
}
};

// @GET /api/complaints/:id
exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("citizen", "name email phone")
      .populate("department", "name contactEmail")
      .populate("assignedTo", "name email")
      .populate("statusHistory.changedBy", "name role");

    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    // Citizens can only view their own
    if (req.user.role === "citizen" && complaint.citizen._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Access denied" });

    res.json({ success: true, complaint });
  }catch (err) {
  res.status(500).json({ message: err.message });
}
};

// @PUT /api/complaints/:id/status  — Staff/Admin update status
exports.updateStatus = async (req, res) => {
  try {
    const { status, comment } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    complaint.status = status;
    complaint.statusHistory.push({ status, changedBy: req.user._id, comment });
    if (status === "resolved") complaint.resolvedAt = new Date();

    await complaint.save();
    res.json({ success: true, complaint });
  } catch (err) {
  res.status(500).json({ message: err.message });
}
};

// @PUT /api/complaints/:id/assign  — Admin assigns to dept and staff
exports.assignComplaint = async (req, res) => {
  try {
    const { departmentId, staffId, dueDate } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if(
req.user.role === "dept_admin" &&
departmentId !== req.user.department.toString()
){
return res.status(403).json({
message:"You can assign only within your department"
});
}
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    complaint.department = departmentId;
    complaint.assignedTo = staffId;
    complaint.status = "assigned";
    complaint.dueDate = dueDate;
    complaint.statusHistory.push({
      status: "assigned",
      changedBy: req.user._id,
      comment: "Assigned to department",
    });

    await complaint.save();
    res.json({ success: true, complaint });
  } catch (err) {
  res.status(500).json({ message: err.message });
}
};

// @POST /api/complaints/:id/feedback  — Citizen submits feedback after resolution
exports.submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    if (complaint.citizen.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your complaint" });
    if (complaint.status !== "resolved")
      return res.status(400).json({ message: "Can only rate resolved complaints" });

    complaint.feedback = { rating, comment, submittedAt: new Date() };
    complaint.status = "closed";
    await complaint.save();

    res.json({ success: true, message: "Feedback submitted", complaint });
  } catch (err) {
  res.status(500).json({ message: err.message });
}
};

// @DELETE /api/complaints/:id  — Citizen deletes own pending complaint
exports.deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    if (complaint.citizen.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });
    if (complaint.status !== "pending")
      return res.status(400).json({ message: "Only pending complaints can be deleted" });

    await complaint.deleteOne();
    res.json({ success: true, message: "Complaint deleted" });
  } catch (err) {
  res.status(500).json({ message: err.message });
}
};
// @DELETE /api/complaints/:id  — Citizen deletes own pending complaint
exports.deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    // Only the citizen who filed it can delete
    if (complaint.citizen.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this complaint" });
    }

    // Can only delete if still pending
    if (complaint.status !== "pending") {
      return res.status(400).json({ success: false, message: "Only pending complaints can be deleted" });
    }

    await complaint.deleteOne();

    res.json({ success: true, message: "Complaint deleted successfully" });
  } catch (err) {
  res.status(500).json({ message: err.message });
}
};

// @DELETE /api/complaints/admin/:id  — Admin force deletes any complaint
exports.adminDeleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    await complaint.deleteOne();

    res.json({ success: true, message: "Complaint permanently deleted by admin" });
  } catch (err) {
  res.status(500).json({ message: err.message });
}
};