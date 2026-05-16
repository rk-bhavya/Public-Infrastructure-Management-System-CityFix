const User = require("../models/user");
const Complaint = require("../models/complaint");
const Department = require("../models/department");

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalComplaints, pending, assigned, inProgress,
      resolved, rejected, totalUsers, totalStaff,
    ] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: "pending" }),
      Complaint.countDocuments({ status: "assigned" }),
      Complaint.countDocuments({ status: "in-progress" }),
      Complaint.countDocuments({ status: "resolved" }),
      Complaint.countDocuments({ status: "rejected" }),
      User.countDocuments({ role: "citizen" }),
      User.countDocuments({ role: "staff" }),
    ]);

    const categoryStats = await Complaint.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      stats: { totalComplaints, pending, assigned, inProgress, resolved, rejected, totalUsers, totalStaff },
      categoryStats,
    });
  } catch (err) {
  res.status(500).json({ message: err.message });
}
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
  .populate("department", "name")
  .select("-password").sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
  res.status(500).json({ message: err.message });
}
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
  res.status(500).json({ message: err.message });
}
};

// Toggle user active status
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? "activated" : "deactivated"}` });
  } catch (err) {
  res.status(500).json({ message: err.message });
}
};
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot delete your own account" });
    }

    // Prevent deleting other admins
    if (user.role === "admin") {
      return res.status(400).json({ success: false, message: "Cannot delete another admin account" });
    }

    user.isActive = false;
    await user.save();
    res.json({ success: true, message: `User ${user.name} has been deactivated` });
  } catch (err) {
  res.status(500).json({ message: err.message });
}
};

// Hard delete user — permanently removes user and their complaints
exports.hardDeleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot delete your own account" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ success: false, message: "Cannot delete an admin account" });
    }

    // Delete all complaints filed by this user
    await Complaint.deleteMany({ citizen: req.params.id });

    await user.deleteOne();
    res.json({ success: true, message: `User and all their complaints permanently deleted` });
  } catch (err) {
  res.status(500).json({ message: err.message });
}
};

exports.createDeptAdmin = async (req,res)=>{
try{

const {name,email,password,phone,departmentId} = req.body;

const existingUser = await User.findOne({email});

if(existingUser){
return res.status(400).json({
message:"Email already exists"
});
}

const department = await Department.findById(departmentId);

if(!department){
return res.status(404).json({
message:"Department not found"
});
}

const user = await User.create({
name,
email,
password,
phone,
role:"dept_admin",
department:departmentId
});

res.status(201).json({
success:true,
user
});

}catch(err){
res.status(500).json({
message:err.message
});
}
};
