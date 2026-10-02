const Salary = require("../models/Salary");
const User = require("../models/User");

// @route PUT /api/salary/doctors/:id/base-salary
// @desc  Admin sets a doctor's base salary
exports.setBaseSalary = async (req, res) => {
  try {
    const { baseSalary } = req.body;
    const doctor = await User.findOneAndUpdate(
      { _id: req.params.id, role: "doctor" },
      { baseSalary },
      { new: true }
    ).select("-password");

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/salary/generate
// @desc  Admin generates salary records for all doctors for a given month/year
// @route POST /api/salary/generate
exports.generateMonthlySalary = async (req, res) => {
  try {
    const { month, year } = req.body;

    const employees = await User.find({
      role: { $in: ["doctor", "receptionist", "staff"] },
      isActive: true,
    });

    let created = 0;
    let skipped = 0;

    for (const emp of employees) {
      if (!emp.baseSalary || emp.baseSalary <= 0) {
        skipped++;
        continue;
      }
      const exists = await Salary.findOne({ doctor: emp._id, month, year });
      if (exists) {
        skipped++;
        continue;
      }
      await Salary.create({ doctor: emp._id, month, year, amount: emp.baseSalary });
      created++;
    }

    res.json({ message: `Salary generated for ${created} employees. ${skipped} skipped (already exists or no base salary set).` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/salary/all
// @desc  Admin views all salary records
exports.getAllSalaries = async (req, res) => {
  try {
    const { month, year, status } = req.query;
    const filter = {};
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);
    if (status) filter.status = status;

   const salaries = await Salary.find(filter)
  .populate("doctor", "name email specialization hospitalId role staffType")
  .sort({ year: -1, month: -1 });

    res.json(salaries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/salary/:id/pay
// @desc  Admin marks a salary record as paid
exports.markSalaryPaid = async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);
    if (!salary) return res.status(404).json({ message: "Salary record not found" });

    salary.status = "paid";
    salary.paidDate = new Date();
    await salary.save();

    res.json(salary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/salary/my
// @desc  Doctor views their own salary history
exports.getMySalary = async (req, res) => {
  try {
    const salaries = await Salary.find({ doctor: req.user._id }).sort({ year: -1, month: -1 });
    res.json(salaries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};