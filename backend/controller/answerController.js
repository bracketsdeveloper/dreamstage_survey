const Answer = require("../models/Answer");

/** GET /api/answers?adminViewed=<true|false> */
async function listAnswers(req, res) {
  try {
    const filter = {};
    if (req.query.adminViewed !== undefined) {
      filter.adminViewed = req.query.adminViewed === "true";
    }
    const data = await Answer.find(filter)
      .populate("responses.question", "question caption image")
      .sort({ updatedAt: -1 });
    res.json({ message: "Answers fetched", data, success: true, error: false });
  } catch (err) {
    res.status(400).json({ message: err.message, success: false, error: true });
  }
}

/** GET /api/answers/:phoneNumber */
async function getByPhone(req, res) {
  try {
    const { phoneNumber } = req.params;
    const data = await Answer.findOne({ phoneNumber })
      .populate("responses.question", "question caption image");
    if (!data)
      return res
        .status(404)
        .json({ message: "Not found", success: false, error: true });
    res.json({ message: "Answer found", data, success: true, error: false });
  } catch (err) {
    res.status(400).json({ message: err.message, success: false, error: true });
  }
}

/** PUT /api/answers/:phoneNumber/viewed */
async function markViewed(req, res) {
  try {
    const { phoneNumber } = req.params;
    const data = await Answer.findOneAndUpdate(
      { phoneNumber },
      { adminViewed: true },
      { new: true }
    );
    if (!data)
      return res
        .status(404)
        .json({ message: "Not found", success: false, error: true });
    res.json({ message: "Marked viewed", data, success: true, error: false });
  } catch (err) {
    res.status(400).json({ message: err.message, success: false, error: true });
  }
}

/** PUT /api/answers/:phoneNumber/responses/:questionId */
async function updateResponse(req, res) {
  try {
    const { phoneNumber, questionId } = req.params;
    const { answer, confirmed } = req.body;
    const doc = await Answer.findOne({ phoneNumber });
    if (!doc)
      return res
        .status(404)
        .json({ message: "Not found", success: false, error: true });
    const resp = doc.responses.find((r) => r.question.toString() === questionId);
    if (!resp)
      return res
        .status(404)
        .json({ message: "Response not found", success: false, error: true });

    if (answer !== undefined) resp.answer = answer;
    if (confirmed !== undefined) resp.confirmed = confirmed;

    await doc.save();
    res.json({ message: "Updated", data: resp, success: true, error: false });
  } catch (err) {
    res.status(400).json({ message: err.message, success: false, error: true });
  }
}

/** DELETE /api/answers/:phoneNumber/responses/:questionId */
async function deleteResponse(req, res) {
  try {
    const { phoneNumber, questionId } = req.params;
    const doc = await Answer.findOneAndUpdate(
      { phoneNumber },
      { $pull: { responses: { question: questionId } } },
      { new: true }
    ).populate("responses.question", "question caption image");
    if (!doc)
      return res
        .status(404)
        .json({ message: "Not found", success: false, error: true });
    res.json({ message: "Response removed", data: doc, success: true, error: false });
  } catch (err) {
    res.status(400).json({ message: err.message, success: false, error: true });
  }
}

/** DELETE /api/answers/:phoneNumber */
async function deleteAnswer(req, res) {
  try {
    const { phoneNumber } = req.params;
    const doc = await Answer.findOneAndDelete({ phoneNumber });
    if (!doc)
      return res
        .status(404)
        .json({ message: "Not found", success: false, error: true });
    res.json({ message: "Entry deleted", success: true, error: false });
  } catch (err) {
    res.status(400).json({ message: err.message, success: false, error: true });
  }
}

module.exports = {
  listAnswers,
  getByPhone,
  markViewed,
  updateResponse,
  deleteResponse,
  deleteAnswer,
};
