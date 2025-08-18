'use strict';

const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Branching + Media:
 * - nextDefault: fallback next question
 * - nextBoolean: { ifTrue, ifFalse }
 * - nextOptions: [{ optionValue, next }]
 * - nextNumberRules: [{ operator, value, value2, next }]
 * - image: optional image to send with the question
 * - caption: optional helper text
 */

const nextBooleanSchema = new Schema(
  {
    ifTrue:  { type: Schema.Types.ObjectId, ref: "Question", default: null },
    ifFalse: { type: Schema.Types.ObjectId, ref: "Question", default: null },
  },
  { _id: false }
);

const nextOptionSchema = new Schema(
  {
    optionValue: { type: String, required: true },
    next:        { type: Schema.Types.ObjectId, ref: "Question", default: null },
  },
  { _id: false }
);

const nextNumberRuleSchema = new Schema(
  {
    operator: { type: String, enum: ["lt", "lte", "eq", "gte", "gt", "between"], required: true },
    value:    { type: Number, required: true },
    value2:   { type: Number, default: null }, // for "between"
    next:     { type: Schema.Types.ObjectId, ref: "Question", default: null },
  },
  { _id: false }
);

const imageSchema = new Schema(
  {
    url:      { type: String, default: "" },
    publicId: { type: String, default: "" },
    alt:      { type: String, default: "" },
  },
  { _id: false }
);

const questionSchema = new Schema(
  {
    question: { type: String, required: true },
    caption:  { type: String, default: "" },
    image:    { type: imageSchema, default: undefined },

    answerType: {
      type: String,
      enum: ["text", "number", "boolean", "options"],
      required: true,
    },
    options:      { type: [String], default: [] },
    numberDigits: { type: Number, default: null },
    order:        { type: Number, default: 0 },

    nextDefault:     { type: Schema.Types.ObjectId, ref: "Question", default: null },
    nextBoolean:     { type: nextBooleanSchema, default: undefined },
    nextOptions:     { type: [nextOptionSchema], default: undefined },
    nextNumberRules: { type: [nextNumberRuleSchema], default: undefined },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", questionSchema);
