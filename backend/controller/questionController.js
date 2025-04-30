// backend/controllers/questionController.js
const Question = require("../models/Question");

async function getAll(req, res) {
  try {
    const data = await Question.find().sort({ order: 1 });
    res.json({ message: "Questions fetched", data, success: true, error: false });
  } catch (err) {
    res.status(400).json({ message: err.message || err, success: false, error: true });
  }
}

async function create(req, res) {
  try {
    const { question, answerType, options = [], numberDigits = null } = req.body;
    const order = (await Question.countDocuments()) + 1;
    const data = await Question.create({ question, answerType, options, numberDigits, order });
    res.json({ message: "Question created", data, success: true, error: false });
  } catch (err) {
    res.status(400).json({ message: err.message || err, success: false, error: true });
  }
}

async function update(req, res) {
  try {
    const { question, answerType, options = [], numberDigits = null } = req.body;
    const data = await Question.findByIdAndUpdate(
      req.params.id,
      { question, answerType, options, numberDigits },
      { new: true }
    );
    res.json({ message: "Question updated", data, success: true, error: false });
  } catch (err) {
    res.status(400).json({ message: err.message || err, success: false, error: true });
  }
}

/* PUT /api/questions/reorder */
async function reorder(req, res) {
    try {
      const { ids } = req.body;            // Expect an array of Mongo _id strings
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          message: "ids array is required",
          success: false,
          error: true,
        });
      }
  
      await Promise.all(
        ids.map((id, idx) =>
          Question.findByIdAndUpdate(id, { order: idx + 1 }, { runValidators: false })
        )
      );
  
      res.json({
        message: "Order updated",
        data: ids,
        success: true,
        error: false,
      });
    } catch (err) {
      res.status(400).json({
        message: err.message || err,
        success: false,
        error: true,
      });
    }
  }
  

module.exports = { getAll, create, update, reorder };
