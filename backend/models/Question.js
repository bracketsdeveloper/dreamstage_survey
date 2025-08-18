const mongoose = require("mongoose");

const { Schema } = mongoose;

/**
 * Branching model:
 * - nextDefault: fallback next question (works for any type)
 * - nextBoolean: for answerType === "boolean" (Yes/No)
 * - nextOptions: for answerType === "options" (button/dropdowns etc.)
 * - nextNumberRules: for answerType === "number" with conditional operators
 *
 * Media:
 * - image: { url, publicId, alt }  // optional illustrative image for the question
 * - caption: optional short message under/with the question
 */

const nextBooleanSchema = new Schema(
  {
    ifTrue: { type: Schema.Types.ObjectId, ref: "Question", default: null },
    ifFalse: { type: Schema.Types.ObjectId, ref: "Question", default: null },
  },
  { _id: false }
);

const nextOptionSchema = new Schema(
  {
    optionValue: { type: String, required: true },
    next: { type: Schema.Types.ObjectId, ref: "Question", default: null },
  },
  { _id: false }
);

const nextNumberRuleSchema = new Schema(
  {
    operator: {
      type: String,
      enum: ["lt", "lte", "eq", "gte", "gt", "between"],
      required: true,
    },
    value: { type: Number, required: true },
    value2: { type: Number, default: null }, // only for "between"
    next: { type: Schema.Types.ObjectId, ref: "Question", default: null },
  },
  { _id: false }
);

const imageSchema = new Schema(
  {
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
    alt: { type: String, default: "" },
  },
  { _id: false }
);

const questionSchema = new Schema(
  {
    question: { type: String, required: true },
    caption: { type: String, default: "" }, // optional message/subtext
    image: { type: imageSchema, default: undefined }, // optional

    answerType: {
      type: String,
      enum: ["text", "number", "boolean", "options"],
      required: true,
    },
    options: { type: [String], default: [] }, // used when answerType === "options"
    numberDigits: { type: Number, default: null },
    order: { type: Number, default: 0 },

    // Branching:
    nextDefault: { type: Schema.Types.ObjectId, ref: "Question", default: null },
    nextBoolean: { type: nextBooleanSchema, default: undefined },
    nextOptions: { type: [nextOptionSchema], default: undefined },
    nextNumberRules: { type: [nextNumberRuleSchema], default: undefined },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", questionSchema);
