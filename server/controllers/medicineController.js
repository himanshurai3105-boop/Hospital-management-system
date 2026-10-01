const Medicine = require("../models/Medicine");
const MedicineOrder = require("../models/MedicineOrder");

// @route GET /api/medicines
// @desc  Public/patient - view all medicines
exports.getAllMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find();
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/medicines
// @desc  Admin - add a medicine
exports.addMedicine = async (req, res) => {
  try {
    const { name, category, manufacturer, price, stock, description } = req.body;
    const medicine = await Medicine.create({ name, category, manufacturer, price, stock, description });
    res.status(201).json(medicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/medicines/:id
// @desc  Admin - edit a medicine
exports.editMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ message: "Medicine not found" });

    const allowedFields = ["name", "category", "manufacturer", "price", "stock", "description"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) medicine[field] = req.body[field];
    });

    await medicine.save();
    res.json(medicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/medicines/:id
// @desc  Admin - delete a medicine
exports.deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) return res.status(404).json({ message: "Medicine not found" });
    res.json({ message: "Medicine removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/medicines/order
// @desc  Patient - place an order
exports.placeOrder = async (req, res) => {
  try {
    const { items } = req.body; // [{ medicineId, quantity }]

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order must have at least one item" });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const medicine = await Medicine.findById(item.medicineId);
      if (!medicine) {
        return res.status(404).json({ message: `Medicine not found` });
      }
      if (medicine.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${medicine.name}` });
      }

      totalAmount += medicine.price * item.quantity;
      orderItems.push({
        medicine: medicine._id,
        quantity: item.quantity,
        priceAtOrder: medicine.price,
      });

      medicine.stock -= item.quantity;
      await medicine.save();
    }

    const order = await MedicineOrder.create({
      patient: req.user._id,
      items: orderItems,
      totalAmount,
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/medicines/my-orders
// @desc  Patient - view their orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await MedicineOrder.find({ patient: req.user._id })
      .populate("items.medicine", "name price")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/medicines/orders/all
// @desc  Admin - view all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await MedicineOrder.find()
      .populate("patient", "name email phone")
      .populate("items.medicine", "name price")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/medicines/orders/:id/status
// @desc  Admin - update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await MedicineOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};