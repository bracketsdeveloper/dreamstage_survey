import React, { useEffect, useMemo, useState } from "react";
import SummaryApi from "../../common";
import axios from "axios";
import { useToast } from "../ToastProvider";
import uploadImage from "../../helpers/uploadImage";

const OPERATORS = ["lt", "lte", "eq", "gte", "gt", "between"];

const AddQuestionModal = ({ open, onClose, refresh, editData = null }) => {
  const toast = useToast();

  const [question, setQuestion] = useState("");
  const [caption, setCaption] = useState(""); // NEW
  const [answerType, setAnswerType] = useState("text");
  const [options, setOptions] = useState([""]);
  const [numberDigits, setNumberDigits] = useState("");

  // image state
  const [imageUrl, setImageUrl] = useState("");
  const [imagePublicId, setImagePublicId] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [uploadPct, setUploadPct] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // branching states
  const [questionsList, setQuestionsList] = useState([]);
  const [nextDefault, setNextDefault] = useState("");

  const [nextBoolean, setNextBoolean] = useState({ ifTrue: "", ifFalse: "" });
  const [nextOptions, setNextOptions] = useState([{ optionValue: "", next: "" }]);
  const [nextNumberRules, setNextNumberRules] = useState([
    { operator: "eq", value: "", value2: "", next: "" },
  ]);

  // Fetch all questions for next-target choices
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios({
          method: SummaryApi.GetQuestions.method,
          url: SummaryApi.GetQuestions.url,
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setQuestionsList(Array.isArray(res.data.data) ? res.data.data : []);
      } catch {
        setQuestionsList([]);
      }
    };
    if (open) load();
  }, [open]);

  // Populate edit fields
  useEffect(() => {
    if (editData) {
      setQuestion(editData.question || "");
      setCaption(editData.caption || "");
      setAnswerType(editData.answerType || "text");

      setOptions(
        editData.answerType === "options"
          ? (Array.isArray(editData.options) ? editData.options : [])
          : [""]
      );
      setNumberDigits(editData.answerType === "number" ? (editData.numberDigits || "") : "");

      // image
      setImageUrl(editData.image?.url || "");
      setImagePublicId(editData.image?.publicId || "");
      setImageAlt(editData.image?.alt || "");

      // branching
      setNextDefault(editData.nextDefault || "");

      if (editData.answerType === "boolean") {
        setNextBoolean({
          ifTrue: editData.nextBoolean?.ifTrue || "",
          ifFalse: editData.nextBoolean?.ifFalse || "",
        });
      } else {
        setNextBoolean({ ifTrue: "", ifFalse: "" });
      }

      if (editData.answerType === "options") {
        const mapped = (Array.isArray(editData.nextOptions) ? editData.nextOptions : []).map(
          (r) => ({
            optionValue: r.optionValue || "",
            next: r.next || "",
          })
        );
        const ensured = (editData.options || []).map((opt) => {
          const found = mapped.find((m) => m.optionValue === opt);
          return found || { optionValue: opt, next: "" };
        });
        setNextOptions(ensured.length ? ensured : [{ optionValue: "", next: "" }]);
      } else {
        setNextOptions([{ optionValue: "", next: "" }]);
      }

      if (editData.answerType === "number") {
        const rules = Array.isArray(editData.nextNumberRules) ? editData.nextNumberRules : [];
        setNextNumberRules(
          rules.length
            ? rules.map((r) => ({
                operator: r.operator || "eq",
                value: r.value ?? "",
                value2: r.value2 ?? "",
                next: r.next || "",
              }))
            : [{ operator: "eq", value: "", value2: "", next: "" }]
        );
      } else {
        setNextNumberRules([{ operator: "eq", value: "", value2: "", next: "" }]);
      }
    } else {
      // reset for add
      setQuestion("");
      setCaption("");
      setAnswerType("text");
      setOptions([""]);
      setNumberDigits("");
      setImageUrl("");
      setImagePublicId("");
      setImageAlt("");
      setUploadPct(0);
      setIsUploading(false);

      setNextDefault("");
      setNextBoolean({ ifTrue: "", ifFalse: "" });
      setNextOptions([{ optionValue: "", next: "" }]);
      setNextNumberRules([{ operator: "eq", value: "", value2: "", next: "" }]);
    }
  }, [editData]);

  // if (!open) return null;

  const addOptionField = () => setOptions((prev) => [...prev, ""]);
  const handleOptionChange = (i, v) =>
    setOptions((prev) => prev.map((o, idx) => (idx === i ? v : o)));

  // Keep nextOptions rows synced with options (for answerType=options)
  useEffect(() => {
    if (answerType !== "options") return;
    setNextOptions((prev) => {
      const map = new Map(prev.map((r) => [r.optionValue, r.next]));
      const merged = options
        .filter(Boolean)
        .map((opt) => ({ optionValue: opt, next: map.get(opt) || "" }));
      return merged.length ? merged : [{ optionValue: "", next: "" }];
    });
  }, [options, answerType]);

  const questionChoices = useMemo(
    () =>
      [{ _id: "", question: "— End (no next) —" }]
        .concat(questionsList)
        .filter((q) => !editData || q._id !== editData._id),
    [questionsList, editData]
  );

  const handleImagePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      setUploadPct(0);
      const { secure_url, public_id } = await uploadImage(file, setUploadPct);
      setImageUrl(secure_url || "");
      setImagePublicId(public_id || "");
      // auto-fill alt if empty
      if (!imageAlt) setImageAlt(file.name.replace(/\.[^/.]+$/, "").slice(0, 120));
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const clearImage = () => {
    setImageUrl("");
    setImagePublicId("");
    setImageAlt("");
    setUploadPct(0);
  };

  const submit = async (e) => {
    e.preventDefault();

    const base = {
      question,
      caption,
      answerType,
      options: answerType === "options" ? options.filter(Boolean) : [],
      numberDigits: answerType === "number" ? Number(numberDigits || 0) || null : null,
      nextDefault: nextDefault || null,
      image: imageUrl || imagePublicId || imageAlt ? {
        url: imageUrl,
        publicId: imagePublicId,
        alt: imageAlt,
      } : undefined,
    };

    if (answerType === "boolean") {
      base.nextBoolean = {
        ifTrue: nextBoolean.ifTrue || null,
        ifFalse: nextBoolean.ifFalse || null,
      };
    }

    if (answerType === "options") {
      base.nextOptions = (nextOptions || [])
        .filter((r) => r.optionValue)
        .map((r) => ({ optionValue: r.optionValue, next: r.next || null }));
    }

    if (answerType === "number") {
      base.nextNumberRules = (nextNumberRules || [])
        .filter((r) => r.operator && r.value !== "")
        .map((r) => ({
          operator: r.operator,
          value: Number(r.value),
          value2: r.operator === "between" && r.value2 !== "" ? Number(r.value2) : null,
          next: r.next || null,
        }));
    }

    try {
      if (editData) {
        await axios({
          method: SummaryApi.UpdateQuestion(editData._id).method,
          url: SummaryApi.UpdateQuestion(editData._id).url,
          data: base,
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        toast.success("Question updated");
      } else {
        await axios({
          method: SummaryApi.AddQuestion.method,
          url: SummaryApi.AddQuestion.url,
          data: base,
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        toast.success("Question added");
      }
      onClose();
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || (editData ? "Update failed" : "Creation failed"));
    }
  };

  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={submit}
        className="w-full max-w-2xl space-y-4 rounded-lg bg-white p-6 shadow-lg"
      >
        <h3 className="text-lg font-medium">{editData ? "Edit Question" : "Add Question"}</h3>

        {/* Question text */}
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Question"
          required
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        {/* Caption (optional) */}
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Caption (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        {/* Image upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Image (optional)</label>
          {imageUrl ? (
            <div className="flex items-start gap-4">
              <img
                src={imageUrl}
                alt={imageAlt || "question"}
                className="h-20 w-20 rounded object-cover border"
              />
              <div className="flex-1 space-y-2">
                <input
                  className="w-full rounded border px-3 py-2"
                  placeholder="Alt text / description"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                />
                <div className="flex gap-2">
                  <label className="rounded bg-gray-200 px-3 py-1 text-sm cursor-pointer">
                    Replace
                    <input type="file" accept="image/*" hidden onChange={handleImagePick} />
                  </label>
                  <button
                    type="button"
                    onClick={clearImage}
                    className="rounded bg-red-100 px-3 py-1 text-sm text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="rounded bg-gray-200 px-3 py-2 text-sm cursor-pointer inline-block">
                Upload Image
                <input type="file" accept="image/*" hidden onChange={handleImagePick} />
              </label>
              {isUploading && (
                <div className="mt-2 text-sm text-gray-700">Uploading… {uploadPct}%</div>
              )}
            </div>
          )}
        </div>

        {/* Type */}
        <select
          className="w-full rounded border px-3 py-2"
          value={answerType}
          onChange={(e) => setAnswerType(e.target.value)}
        >
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="boolean">Yes / No</option>
          <option value="options">Options / Buttons / Dropdown</option>
        </select>

        {/* Number config */}
        {answerType === "number" && (
          <input
            className="w-full rounded border px-3 py-2"
            type="number"
            placeholder="Number of digits (optional)"
            value={numberDigits}
            onChange={(e) => setNumberDigits(e.target.value)}
          />
        )}

        {/* Options list */}
        {answerType === "options" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Options (buttons/dropdown items)</h4>
              <button
                type="button"
                onClick={addOptionField}
                className="rounded bg-gray-200 px-3 py-1 text-sm"
              >
                + Add option
              </button>
            </div>
            {options.map((opt, idx) => (
              <input
                key={idx}
                className="w-full rounded border px-3 py-2"
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                required
              />
            ))}
          </div>
        )}

        {/* Branching UI */}
        <div className="space-y-4">
          <h4 className="font-medium">Branching (Next question rules)</h4>

          {/* Default next for all types */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="text-sm text-gray-700">Default Next</label>
            <select
              className="rounded border px-3 py-2"
              value={nextDefault}
              onChange={(e) => setNextDefault(e.target.value)}
            >
              {questionChoices.map((q) => (
                <option key={q._id || "none"} value={q._id}>
                  {q.question}
                </option>
              ))}
            </select>
          </div>

          {/* Boolean-specific */}
          {answerType === "boolean" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-700">If True (Yes) →</span>
                <select
                  className="flex-1 rounded border px-3 py-2"
                  value={nextBoolean.ifTrue}
                  onChange={(e) => setNextBoolean((p) => ({ ...p, ifTrue: e.target.value }))}
                >
                  {questionChoices.map((q) => (
                    <option key={q._id || "none"} value={q._id}>
                      {q.question}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-700">If False (No) →</span>
                <select
                  className="flex-1 rounded border px-3 py-2"
                  value={nextBoolean.ifFalse}
                  onChange={(e) => setNextBoolean((p) => ({ ...p, ifFalse: e.target.value }))}
                >
                  {questionChoices.map((q) => (
                    <option key={q._id || "none"} value={q._id}>
                      {q.question}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Options-specific */}
          {answerType === "options" && (
            <div className="space-y-2">
              <div className="text-sm text-gray-700">Map each option → next</div>
              {nextOptions.map((r, idx) => (
                <div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    className="rounded border px-3 py-2 bg-gray-50"
                    value={r.optionValue}
                    readOnly
                  />
                  <select
                    className="rounded border px-3 py-2"
                    value={r.next}
                    onChange={(e) =>
                      setNextOptions((prev) =>
                        prev.map((row, i) => (i === idx ? { ...row, next: e.target.value } : row))
                      )
                    }
                  >
                    {questionChoices.map((q) => (
                      <option key={q._id || "none"} value={q._id}>
                        {q.question}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Number-specific */}
          {answerType === "number" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Rules (checked in order)</span>
                <button
                  type="button"
                  onClick={() =>
                    setNextNumberRules((prev) => [
                      ...prev,
                      { operator: "eq", value: "", value2: "", next: "" },
                    ])
                  }
                  className="rounded bg-gray-200 px-3 py-1 text-sm"
                >
                  + Add rule
                </button>
              </div>

              {nextNumberRules.map((r, idx) => (
                <div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                  <select
                    className="rounded border px-3 py-2"
                    value={r.operator}
                    onChange={(e) =>
                      setNextNumberRules((prev) =>
                        prev.map((row, i) =>
                          i === idx ? { ...row, operator: e.target.value } : row
                        )
                      )
                    }
                  >
                    {OPERATORS.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>

                  <input
                    className="rounded border px-3 py-2"
                    type="number"
                    placeholder="value"
                    value={r.value}
                    onChange={(e) =>
                      setNextNumberRules((prev) =>
                        prev.map((row, i) => (i === idx ? { ...row, value: e.target.value } : row))
                      )
                    }
                    required
                  />

                  {r.operator === "between" ? (
                    <input
                      className="rounded border px-3 py-2"
                      type="number"
                      placeholder="value2"
                      value={r.value2}
                      onChange={(e) =>
                        setNextNumberRules((prev) =>
                          prev.map((row, i) =>
                            i === idx ? { ...row, value2: e.target.value } : row
                          )
                        )
                      }
                      required
                    />
                  ) : (
                    <div className="hidden sm:block" />
                  )}

                  <select
                    className="rounded border px-3 py-2 sm:col-span-2"
                    value={r.next}
                    onChange={(e) =>
                      setNextNumberRules((prev) =>
                        prev.map((row, i) => (i === idx ? { ...row, next: e.target.value } : row))
                      )
                    }
                  >
                    {questionChoices.map((q) => (
                      <option key={q._id || "none"} value={q._id}>
                        {q.question}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded bg-gray-200 px-4 py-2">
            Cancel
          </button>
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-white"
            disabled={isUploading}
          >
            {isUploading ? "Uploading…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  ) : null;
};

export default AddQuestionModal;
