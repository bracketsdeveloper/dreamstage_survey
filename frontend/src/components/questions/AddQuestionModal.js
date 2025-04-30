// frontend/src/components/questions/AddQuestionModal.js
import React, { useEffect, useState } from "react";
import SummaryApi from "../../common";
import axios from "axios";
import { useToast } from "../ToastProvider";

const AddQuestionModal = ({ open, onClose, refresh, editData = null }) => {
  const toast = useToast();
  const [question, setQuestion] = useState("");
  const [answerType, setAnswerType] = useState("text");
  const [options, setOptions] = useState([""]);
  const [numberDigits, setNumberDigits] = useState("");

  useEffect(() => {
    if (editData) {
      setQuestion(editData.question);
      setAnswerType(editData.answerType);
      setOptions(editData.options.length ? editData.options : [""]);
      setNumberDigits(editData.numberDigits || "");
    } else {
      setQuestion("");
      setAnswerType("text");
      setOptions([""]);
      setNumberDigits("");
    }
  }, [editData]);
  

  if (!open) return null;

  const addOptionField = () => setOptions([...options, ""]);
  const handleOptionChange = (i, v) => setOptions(options.map((o, idx) => (idx === i ? v : o)));

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      question,
      answerType,
      options: answerType === "options" ? options.filter(Boolean) : [],
      numberDigits: answerType === "number" ? numberDigits : null,
    };
    try {
      if (editData) {
        await axios({
          method: SummaryApi.UpdateQuestion(editData._id).method,
          url: SummaryApi.UpdateQuestion(editData._id).url,
          data: payload,
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        toast.success("Question updated");
      } else {
        await axios({
          method: SummaryApi.AddQuestion.method,
          url: SummaryApi.AddQuestion.url,
          data: payload,
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        toast.success("Question added");
      }
      onClose();
      refresh();
    } catch {
      toast.error(editData ? "Update failed" : "Creation failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={submit}
        className="w-full max-w-lg space-y-4 rounded-lg bg-white p-6 shadow-lg"
      >
        <h3 className="text-lg font-medium">{editData ? "Edit Question" : "Add Question"}</h3>
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Question"
          required
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <select
          className="w-full rounded border px-3 py-2"
          value={answerType}
          onChange={(e) => setAnswerType(e.target.value)}
        >
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="boolean">Yes / No</option>
          <option value="options">Options</option>
        </select>

        {answerType === "number" && (
          <input
            className="w-full rounded border px-3 py-2"
            type="number"
            placeholder="Number of digits"
            value={numberDigits}
            onChange={(e) => setNumberDigits(e.target.value)}
          />
        )}

        {answerType === "options" && (
          <div className="space-y-2">
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
            <button
              type="button"
              onClick={addOptionField}
              className="rounded bg-gray-200 px-3 py-1 text-sm"
            >
              + Add option
            </button>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded bg-gray-200 px-4 py-2">
            Cancel
          </button>
          <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddQuestionModal;
