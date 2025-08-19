const express = require("express");
const authenticate = require("../middleware/authMiddleware");

const testController = require("../controller/testController");
const { register, login } = require("../controller/authController");
const { getAll, create, reorder, update } = require("../controller/questionController");
const {
  listAnswers,
  getByPhone,
  updateResponse,
  deleteResponse,
  deleteAnswer,
  markViewed
} = require("../controller/answerController");

// NEW: campaign controller
const {
  downloadSampleTemplate,
  uploadAndSend,
  uploadMiddleware,
} = require("../controller/campaignController");

const router = express.Router();

// test
router.get("/test", testController);

// auth
router.post("/register", register);
router.post("/login", login);

// questions
router.get("/questions", authenticate, getAll);
router.post("/questions", authenticate, create);
router.put("/questions/reorder", authenticate, reorder);
router.put("/questions/:id", authenticate, update);

// answers
router.get("/answers", authenticate, listAnswers);
router.get("/answers/:phoneNumber", authenticate, getByPhone);
router.put("/answers/:phoneNumber/viewed", authenticate, markViewed);
router.put("/answers/:phoneNumber/responses/:questionId", authenticate, updateResponse);
router.delete("/answers/:phoneNumber/responses/:questionId", authenticate, deleteResponse);
router.delete("/answers/:phoneNumber", authenticate, deleteAnswer);

// NEW: campaign routes
router.get("/campaign/sample", authenticate, downloadSampleTemplate);
router.post("/campaign/upload", authenticate, uploadMiddleware, uploadAndSend);

module.exports = router;
