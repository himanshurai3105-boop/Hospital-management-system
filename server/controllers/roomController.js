const Room = require("../models/Room");
const Bed = require("../models/Bed");
const RoomBooking = require("../models/RoomBooking");

// @route GET /api/rooms
// @desc  Public/patient - view all rooms with their beds
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    const roomsWithBeds = await Promise.all(
      rooms.map(async (room) => {
        const beds = await Bed.find({ room: room._id }).populate("currentPatient", "name");
        const availableBeds = beds.filter((b) => b.status === "available").length;
        return { ...room.toObject(), beds, availableBeds };
      })
    );
    res.json(roomsWithBeds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/rooms
// @desc  Admin - add a new room (auto-creates individual beds)
exports.addRoom = async (req, res) => {
  try {
    const { roomNumber, roomType, pricePerDay, totalBeds, description } = req.body;

    const exists = await Room.findOne({ roomNumber });
    if (exists) {
      return res.status(400).json({ message: "Room number already exists" });
    }

    const room = await Room.create({ roomNumber, roomType, pricePerDay, totalBeds, description });

    // Auto-generate beds: 101-A, 101-B, 101-C ...
    const bedLetters = "ABCDEFGHIJ";
    const beds = [];
    for (let i = 0; i < totalBeds; i++) {
      beds.push({ room: room._id, bedNumber: `${roomNumber}-${bedLetters[i]}` });
    }
    await Bed.create(beds);

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/rooms/:id
// @desc  Admin - edit a room (price/description/type only — bed count locked after creation)
exports.editRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });

    const allowedFields = ["roomType", "pricePerDay", "description"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) room[field] = req.body[field];
    });

    await room.save();
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/rooms/:id
// @desc  Admin - delete a room (and its beds)
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    await Bed.deleteMany({ room: room._id });
    res.json({ message: "Room and its beds removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/rooms/book
// @desc  Patient - book a specific bed
// @route POST /api/rooms/book
// @desc  Doctor - book a specific bed for a patient (based on medical need)
exports.bookRoom = async (req, res) => {
  try {
    const { bedId, patientId, fromDate, toDate } = req.body;

    const User = require("../models/User");
    const patient = await User.findOne({ _id: patientId, role: "patient" });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const bed = await Bed.findById(bedId);
    if (!bed) return res.status(404).json({ message: "Bed not found" });
    if (bed.status !== "available") {
      return res.status(400).json({ message: "This bed is not available" });
    }

    const booking = await RoomBooking.create({
      patient: patientId,
      doctor: req.user._id,
      room: bed.room,
      bed: bed._id,
      fromDate,
      toDate,
    });

    bed.status = "occupied";
    bed.currentPatient = patientId;
    await bed.save();

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/rooms/beds/:bedId/discharge
// @desc  Admin - discharge a patient from a bed (frees it up)
exports.dischargeBed = async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.bedId);
    if (!bed) return res.status(404).json({ message: "Bed not found" });

    bed.status = "available";
    bed.currentPatient = null;
    await bed.save();

    await RoomBooking.updateMany(
      { bed: bed._id, status: { $in: ["pending", "confirmed"] } },
      { status: "completed" }
    );

    res.json({ message: "Bed discharged successfully", bed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/rooms/my-bookings
exports.getMyRoomBookings = async (req, res) => {
  try {
    const bookings = await RoomBooking.find({ patient: req.user._id })
      .populate("room")
      .populate("bed")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/rooms/bookings/all
exports.getAllRoomBookings = async (req, res) => {
  try {
    const bookings = await RoomBooking.find()
      .populate("room")
      .populate("bed")
      .populate("patient", "name email phone")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/rooms/my-bookings-doctor
// @desc  Doctor - view room bookings they made for patients
exports.getDoctorRoomBookings = async (req, res) => {
  try {
    const bookings = await RoomBooking.find({ doctor: req.user._id })
      .populate("patient", "name hospitalId phone")
      .populate("room")
      .populate("bed")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};