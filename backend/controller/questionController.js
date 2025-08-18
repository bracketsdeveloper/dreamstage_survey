const Question = require("../models/Question");

// Clean branching payload by answerType
function normalizeBranching(body) {
  const clean = {
    nextDefault: body.nextDefault || null,
    nextBoolean: undefined,
    nextOptions: undefined,
    nextNumberRules: undefined,
  };

  switch (body.answerType) {
    case "boolean":
      if (body.nextBoolean && (body.nextBoolean.ifTrue || body.nextBoolean.ifFalse)) {
        clean.nextBoolean = {
          ifTrue: body.nextBoolean.ifTrue || null,
          ifFalse: body.nextBoolean.ifFalse || null,
        };
      }
      break;

    case "options":
      if (Array.isArray(body.nextOptions)) {
        clean.nextOptions = body.nextOptions
          .filter((r) => r && typeof r.optionValue === "string")
          .map((r) => ({
            optionValue: r.optionValue,
            next: r.next || null,
          }));
      }
      break;

    case "number":
      if (Array.isArray(body.nextNumberRules)) {
        clean.nextNumberRules = body.nextNumberRules
          .filter((r) => r && r.operator && r.value !== undefined)
          .map((r) => ({
            operator: r.operator,
            value: Number(r.value),
            value2: r.operator === "between" && r.value2 !== undefined ? Number(r.value2) : null,
            next: r.next || null,
          }));
      }
      break;

    default:
      // text -> only nextDefault is relevant
      break;
  }

  return clean;
}

function normalizeImage(body) {
  // Accept either flat fields (imageUrl, imagePublicId, imageAlt) or nested image: { url, publicId, alt }
  if (body.image && (body.image.url || body.image.publicId || body.image.alt)) {
    return {
      image: {
        url: body.image.url || "",
        publicId: body.image.publicId || "",
        alt: body.image.alt || "",
      },
    };
  }
  if (body.imageUrl || body.imagePublicId || body.imageAlt) {
    return {
      image: {
        url: body.imageUrl || "",
        publicId: body.imagePublicId || "",
        alt: body.imageAlt || "",
      },
    };
  }
  return { image: undefined };
}

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
    const { question, answerType, options = [], numberDigits = null, caption = "" } = req.body;
    const order = (await Question.countDocuments()) + 1;

    const branching = normalizeBranching(req.body);
    const { image } = normalizeImage(req.body);

    const payload = {
      question,
      caption,
      answerType,
      options: answerType === "options" ? options : [],
      numberDigits: answerType === "number" ? numberDigits : null,
      order,
      ...branching,
      ...(image ? { image } : {}),
    };

    const data = await Question.create(payload);
    res.json({ message: "Question created", data, success: true, error: false });
  } catch (err) {
    res.status(400).json({ message: err.message || err, success: false, error: true });
  }
}

async function update(req, res) {
  try {
    const { question, answerType, options = [], numberDigits = null, caption = "" } = req.body;

    const branching = normalizeBranching(req.body);
    const { image } = normalizeImage(req.body);

    const payload = {
      question,
      caption,
      answerType,
      options: answerType === "options" ? options : [],
      numberDigits: answerType === "number" ? numberDigits : null,
      ...branching,
    };

    if (image !== undefined) {
      // If client sent any image fields, set them (can be cleared by sending empty strings)
      payload.image = image;
    }

    const data = await Question.findByIdAndUpdate(req.params.id, payload, { new: true });
    res.json({ message: "Question updated", data, success: true, error: false });
  } catch (err) {
    res.status(400).json({ message: err.message || err, success: false, error: true });
  }
}

/* PUT /api/questions/reorder */
async function reorder(req, res) {
  try {
    const { ids } = req.body;
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
