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
  const [loading, setLoading] = useState(false);

  const authHeader = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  const fetchList = async () => {
    setLoading(true);
    try {
      const { url, method } = SummaryApi.GetAllAnswers;
      const res = await axios({ method, url, headers: authHeader });
      setAllEntries(res.data.data || []);
    } catch (err) {
      console.error("Fetch list error:", err);
      toast.error("Could not load answers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleView = async (phone) => {
    try {
      const { url, method } = SummaryApi.GetAnswerByPhone(phone);
      const res = await axios({ method, url, headers: authHeader });
      const detail = res.data.data;
      setSelected(detail);
      setViewMode("read");
    } catch (err) {
      console.error("Fetch detail error:", err);
      toast.error("Could not load detail");
      return;
    }

    // mark viewed (best-effort)
    try {
      const { url, method } = SummaryApi.MarkViewed(phone);
      await axios({ method, url, headers: authHeader });
      setAllEntries((prev) =>
        prev.map((e) => (e.phoneNumber === phone ? { ...e, adminViewed: true } : e))
      );
    } catch (err) {
      console.warn("Failed to mark viewed", err);
    }
  };

  const saveResponse = async (qid, field, value) => {
    try {
      const { url, method } = SummaryApi.UpdateResponse(selected.phoneNumber, qid);
      await axios({ method, url, data: { [field]: value }, headers: authHeader });
      toast.success("Saved");

      const { url: du, method: dm } = SummaryApi.GetAnswerByPhone(selected.phoneNumber);
      const detailRes = await axios({ method: dm, url: du, headers: authHeader });
      setSelected(detailRes.data.data);
    } catch (err) {
      console.error("Save response error:", err);
      toast.error("Save failed");
    }
  };

  const removeResponse = async (qid) => {
    try {
      const { url, method } = SummaryApi.DeleteResponse(selected.phoneNumber, qid);
      await axios({ method, url, headers: authHeader });
      toast.success("Removed");

      const { url: du, method: dm } = SummaryApi.GetAnswerByPhone(selected.phoneNumber);
      const detailRes = await axios({ method: dm, url: du, headers: authHeader });
      setSelected(detailRes.data.data);
    } catch (err) {
      console.error("Remove response error:", err);
      toast.error("Remove failed");
    }
  };

  const removeAnswer = async () => {
    if (!selected) return;
    try {
      const { url, method } = SummaryApi.DeleteAnswer(selected.phoneNumber);
      await axios({ method, url, headers: authHeader });
      toast.success("Entry deleted");
      setSelected(null);
      setViewMode("unread");
      await fetchList();
    } catch (err) {
      console.error("Remove entry error:", err);
      toast.error("Delete failed");
    }
  };

  const filtered = allEntries
    .filter((e) => (viewMode === "unread" ? !e.adminViewed : !!e.adminViewed))
    .filter((e) => {
      const hay = `${e.phoneNumber} ${e.userName}`.toLowerCase();
      return hay.includes(filterText.toLowerCase());
    });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">User Answers</h1>
        <button
          onClick={fetchList}
          className="rounded bg-gray-200 px-3 py-1 text-sm"
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Search & filter */}
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

      {/* Entries */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Name</th>
              <th className="border px-2 py-1">Phone</th>
              <th className="border px-2 py-1">Count</th>
              <th className="border px-2 py-1">Viewed</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ans) => (
              <tr key={ans.phoneNumber}>
                <td className="border px-2 py-1">{ans.userName || "-"}</td>
                <td className="border px-2 py-1">{ans.phoneNumber}</td>
                <td className="border px-2 py-1">{ans.responses?.length || 0}</td>
                <td className="border px-2 py-1">{ans.adminViewed ? "✅" : "❌"}</td>
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
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  No {viewMode} entries.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-3xl space-y-4 rounded bg-white p-6 shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">
                  {selected.userName || "Unknown"} ({selected.phoneNumber})
                </h2>
                <p className="text-xs text-gray-500">
                  Created: {new Date(selected.createdAt).toLocaleString()} • Updated:{" "}
                  {new Date(selected.updatedAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-500 hover:text-gray-800"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="overflow-auto max-h-[70vh]">
              <table className="w-full table-auto border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">#</th>
                    <th className="border px-2 py-1">Question</th>
                    <th className="border px-2 py-1">Media</th>
                    <th className="border px-2 py-1">Answer</th>
                    <th className="border px-2 py-1">Confirmed</th>
                    <th className="border px-2 py-1">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.responses.map((r, i) => {
                    const q = r.question || {};
                    const img = q.image?.url;
                    return (
                      <tr key={q._id || i}>
                        <td className="border px-2 py-1 align-top">{i + 1}</td>
                        <td className="border px-2 py-1 align-top">
                          <div className="font-medium">{q.question}</div>
                          {q.caption ? (
                            <div className="text-xs text-gray-500 mt-1">{q.caption}</div>
                          ) : null}
                        </td>
                        <td className="border px-2 py-1 align-top">
                          {img ? (
                            <a href={img} target="_blank" rel="noreferrer">
                              <img
                                src={img}
                                alt={q.image?.alt || "question"}
                                className="h-16 w-16 object-cover rounded border"
                              />
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="border px-2 py-1 align-top">
                          {/* pretty-print booleans */}
                          {typeof r.answer === "boolean"
                            ? r.answer ? "Yes" : "No"
                            : String(r.answer)}
                        </td>
                        <td className="border px-2 py-1 text-center align-top">
                          {r.confirmed ? "✅" : "❌"}
                        </td>
                        <td className="border px-2 py-1 align-top">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                // Toggle confirmed
                                saveResponse(q._id, "confirmed", !r.confirmed);
                              }}
                              className="text-xs rounded bg-gray-200 px-2 py-1"
                            >
                              {r.confirmed ? "Mark Unconfirmed" : "Mark Confirmed"}
                            </button>
                            <button
                              onClick={() => removeResponse(q._id)}
                              className="text-xs rounded bg-red-100 px-2 py-1 text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Viewed: {selected.adminViewed ? "Yes" : "No"} • Email sent:{" "}
                {selected.mailStatus ? "Yes" : "No"}
              </div>
              <div className="space-x-2">
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
        </div>
      )}
    </div>
  );
}
