'use strict';

const mongoose = require("mongoose");
const { Schema } = mongoose;

const responseSchema = new Schema({
  question:  { type: Schema.Types.ObjectId, ref: "Question", required: true },
  // Store typed answers: text -> string, number -> number, boolean -> true/false, options -> string (option id)
  answer:    { type: Schema.Types.Mixed,    required: true },
  confirmed: { type: Boolean,               default: false }
}, { _id: false });

const answerSchema = new Schema({
  phoneNumber: { type: String, required: true, unique: true },
  userName:    { type: String, default: "" },

  // flags for ops
  adminViewed: { type: Boolean, default: false }, // used by admin panel
  mailStatus:  { type: Boolean, default: false }, // completion email sent once?

  responses:   { type: [responseSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model("Answer", answerSchema);
