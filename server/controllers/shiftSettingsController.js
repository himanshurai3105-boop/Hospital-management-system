const ShiftSettings = require("../models/ShiftSettings");

// @route GET /api/shift-settings
// @desc  Anyone logged in - view current shift timings
exports.getShiftSettings = async (req, res) => {
  try {
    const settings = await ShiftSettings.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/shift-settings
// @desc  Admin - update shift timings
exports.updateShiftSettings = async (req, res) => {
  try {
    const { daySessions, nightSessions, emergencySessions, bookingWindow } = req.body;
    const settings = await ShiftSettings.getSettings();

    if (daySessions) settings.daySessions = daySessions;
    if (nightSessions) settings.nightSessions = nightSessions;
    if (emergencySessions) settings.emergencySessions = emergencySessions;
    if (bookingWindow) settings.bookingWindow = bookingWindow;

    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};