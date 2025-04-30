// src/pages/Answers.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import SummaryApi from "../common";
import { useToast } from "../components/ToastProvider";

export default function AnswersPage() {
  const toast = useToast();

  const [allEntries, setAllEntries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filterText, setFilterText] = useState("");
  const [viewMode, setViewMode] = useState("unread"); // "unread" | "read"

  // Fetch all entries on mount
  useEffect(() => {
    (async () => {
      try {
        const { url, method } = SummaryApi.GetAllAnswers;
        const res = await axios({
          method,
          url,
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setAllEntries(res.data.data);
      } catch (err) {
        console.error("Fetch list error:", err);
        toast.error("Could not load answers");
      }
    })();
  }, [toast]);

  // View details and mark as viewed
  const handleView = async (phone) => {
    // 1) fetch detail
    let detail;
    try {
      const { url, method } = SummaryApi.GetAnswerByPhone(phone);
      const res = await axios({
        method,
        url,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      detail = res.data.data;
      setSelected(detail);
      setViewMode("read");
    } catch (err) {
      console.error("Fetch detail error:", err);
      toast.error("Could not load detail");
      return;
    }

    // 2) mark viewed on backend
    try {
      const { url, method } = SummaryApi.MarkViewed(phone);
      await axios({
        method,
        url,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setAllEntries((prev) =>
        prev.map((e) =>
          e.phoneNumber === phone ? { ...e, adminViewed: true } : e
        )
      );
    } catch (err) {
      console.warn("Failed to mark viewed", err);
    }
  };

  // Update a single response
  const saveResponse = async (qid, field, value) => {
    try {
      const { url, method } = SummaryApi.UpdateResponse(
        selected.phoneNumber,
        qid
      );
      await axios({
        method,
        url,
        data: { [field]: value },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("Saved");
      const { url: du, method: dm } = SummaryApi.GetAnswerByPhone(
        selected.phoneNumber
      );
      const detailRes = await axios({
        method: dm,
        url: du,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setSelected(detailRes.data.data);
    } catch (err) {
      console.error("Save response error:", err);
      toast.error("Save failed");
    }
  };

  // Delete a single response
  const removeResponse = async (qid) => {
    try {
      const { url, method } = SummaryApi.DeleteResponse(
        selected.phoneNumber,
        qid
      );
      await axios({
        method,
        url,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("Removed");
      const { url: du, method: dm } = SummaryApi.GetAnswerByPhone(
        selected.phoneNumber
      );
      const detailRes = await axios({
        method: dm,
        url: du,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setSelected(detailRes.data.data);
    } catch (err) {
      console.error("Remove response error:", err);
      toast.error("Remove failed");
    }
  };

  // Delete entire entry
  const removeAnswer = async () => {
    try {
      const { url, method } = SummaryApi.DeleteAnswer(selected.phoneNumber);
      await axios({
        method,
        url,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("Entry deleted");
      setSelected(null);
      setViewMode("unread");
    } catch (err) {
      console.error("Remove entry error:", err);
      toast.error("Delete failed");
    }
  };

  // Filter entries by adminViewed + search text
  const filtered = allEntries
    .filter((e) =>
      viewMode === "unread" ? !e.adminViewed : !!e.adminViewed
    )
    .filter((e) =>
      e.phoneNumber.toLowerCase().includes(filterText.toLowerCase()) ||
      e.userName.toLowerCase().includes(filterText.toLowerCase())
    );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">User Answers</h1>

      {/* Search and View Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full sm:w-1/3 rounded border px-3 py-2"
        />
        <div className="space-x-2">
          {["unread", "read"].map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setSelected(null);
                setViewMode(mode);
              }}
              className={`px-4 py-2 rounded ${
                viewMode === mode
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Entries Table */}
      <table className="w-full table-auto border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Phone</th>
            <th className="border px-2 py-1">Count</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((ans) => (
            <tr key={ans.phoneNumber}>
              <td className="border px-2 py-1">{ans.userName}</td>
              <td className="border px-2 py-1">{ans.phoneNumber}</td>
              <td className="border px-2 py-1">{ans.responses.length}</td>
              <td className="border px-2 py-1">
                <button
                  onClick={() => handleView(ans.phoneNumber)}
                  className="text-blue-600 hover:underline"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center py-4 text-gray-500">
                No {viewMode} entries.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl space-y-4 rounded bg-white p-6 shadow-lg">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {selected.userName} ({selected.phoneNumber})
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="overflow-auto max-h-96">
              <table className="w-full table-auto border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">#</th>
                    <th className="border px-2 py-1">Question</th>
                    <th className="border px-2 py-1">Answer</th>
                    <th className="border px-2 py-1">Confirmed</th>
                    <th className="border px-2 py-1">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.responses.map((r, i) => (
                    <tr key={r.question._id}>
                      <td className="border px-2 py-1">{i + 1}</td>
                      <td className="border px-2 py-1">{r.question.question}</td>
                      <td className="border px-2 py-1">{r.answer}</td>
                      <td className="border px-2 py-1 text-center">
                        {r.confirmed ? "✅" : "❌"}
                      </td>
                      <td className="border px-2 py-1">
                        <button
                          onClick={() => removeResponse(r.question._id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-right space-x-2">
              <button
                onClick={removeAnswer}
                className="rounded bg-red-600 px-4 py-2 text-white"
              >
                Delete All
              </button>
              <button
                onClick={() => setSelected(null)}
                className="rounded bg-blue-600 px-4 py-2 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
