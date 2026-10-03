const RoomRequest = require("../models/RoomRequest");
const RoomBooking = require("../models/RoomBooking");
const Bed = require("../models/Bed");
const Room = require("../models/Room");

const checkBedCoordinator = (req, res) => {
  if (req.user.role !== "staff" || req.user.staffType !== "bed_coordinator") {
    res.status(403).json({ message: "Only bed coordinator staff can perform this action" });
    return false;
  }
  return true;
};

// @route POST /api/room-requests
// @desc  Doctor - request a room/bed for a patient
exports.createRoomRequest = async (req, res) => {
  try {
    const { patientId, roomTypeNeeded, urgency, notes } = req.body;

    const User = require("../models/User");
    const patient = await User.findOne({ _id: patientId, role: "patient" });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const request = await RoomRequest.create({
      patient: patientId,
      doctor: req.user._id,
      roomTypeNeeded,
      urgency: urgency || "normal",
      notes,
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/room-requests/my
// @desc  Doctor - view requests they've made
exports.getMyRoomRequests = async (req, res) => {
  try {
    const requests = await RoomRequest.find({ doctor: req.user._id })
      .populate("patient", "name hospitalId phone")
      .populate({ path: "booking", populate: [{ path: "room" }, { path: "bed" }] })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/room-requests/pending
// @desc  Bed Coordinator - view all pending requests
exports.getPendingRequests = async (req, res) => {
  try {
    if (!checkBedCoordinator(req, res)) return;

    const requests = await RoomRequest.find({ status: "pending" })
      .populate("patient", "name hospitalId phone age gender")
      .populate("doctor", "name specialization")
      .sort({ urgency: -1, createdAt: 1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/room-requests/:id/allot
// @desc  Bed Coordinator - allot a specific bed to fulfil a request
exports.allotBed = async (req, res) => {
  try {
    if (!checkBedCoordinator(req, res)) return;

    const { bedId, fromDate, toDate } = req.body;

    const request = await RoomRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "pending") return res.status(400).json({ message: "Request already handled" });

    const bed = await Bed.findById(bedId);
    if (!bed) return res.status(404).json({ message: "Bed not found" });
    if (bed.status !== "available") return res.status(400).json({ message: "This bed is not available" });

    const booking = await RoomBooking.create({
      patient: request.patient,
      doctor: request.doctor,
      allottedBy: req.user._id,
      room: bed.room,
      bed: bed._id,
      fromDate,
      toDate,
      status: "confirmed",
    });

    bed.status = "occupied";
    bed.currentPatient = request.patient;
    await bed.save();

    request.status = "allotted";
    request.booking = booking._id;
    await request.save();

    res.json({ message: "Bed allotted successfully", request, booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/room-requests/:id/reject
// @desc  Bed Coordinator - reject a request (e.g. no beds available)
exports.rejectRequest = async (req, res) => {
  try {
    if (!checkBedCoordinator(req, res)) return;

    const { reason } = req.body;
    const request = await RoomRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = "rejected";
    request.rejectReason = reason;
    await request.save();

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/room-requests/occupancy
// @desc  Bed Coordinator / Admin - full room+bed occupancy overview
exports.getOccupancyOverview = async (req, res) => {
  try {
    const rooms = await Room.find();
    const roomsWithBeds = await Promise.all(
      rooms.map(async (room) => {
        const beds = await Bed.find({ room: room._id }).populate("currentPatient", "name hospitalId");
        return { ...room.toObject(), beds };
      })
    );
    res.json(roomsWithBeds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};