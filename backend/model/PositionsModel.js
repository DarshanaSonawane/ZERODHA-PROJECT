const { model } = require("mongoose");

const { PositionsSchema } = require("../schemas/PositionSchema");

const PositionsModel = new model("position", PositionsSchema);

module.exports = { PositionsModel };