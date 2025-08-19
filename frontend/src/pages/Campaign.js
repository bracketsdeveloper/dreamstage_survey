import React, { useState } from "react";
import axios from "axios";
import SummaryApi from "../common";
import { useToast } from "../components/ToastProvider";

export default function Campaign() {
  const toast = useToast();

  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(null);

  const authHeader = {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  const downloadTemplate = async () => {
    try {
      const { url } = SummaryApi.CampaignDownloadTemplate;
      const res = await axios.get(url, {
        headers: authHeader,
        responseType: "blob",
      });
      const blob = new Blob([res.data], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "campaign_template.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Template download failed:", err);
      toast.error("Template download failed");
    }
  };

  const uploadAndSend = async () => {
    if (!file) {
      toast.error("Please select an Excel file first");
      return;
    }
    setBusy(true);
    setReport(null);
    try {
      const form = new FormData();
      form.append("file", file);

      const { url, method } = SummaryApi.CampaignUploadExcel;
      const res = await axios({
        url,
        method,
        data: form,
        headers: {
          ...authHeader,
          "Content-Type": "multipart/form-data",
        },
        timeout: 0, // allow long
      });

      setReport(res.data?.data || null);
      toast.success("Campaign processed");
    } catch (err) {
      console.error("Upload/send failed:", err);
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Campaign: Send First Question</h1>
        <button
          onClick={downloadTemplate}
          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Download Sample Excel
        </button>
      </div>

      <div className="rounded border p-4 space-y-4">
        <div className="text-sm text-gray-700">
          <p className="mb-2">
            Upload an Excel file (<code>.xlsx</code>, <code>.xls</code> or <code>.csv</code>) with the following columns:
          </p>
          <ul className="list-disc ml-6">
            <li>
              <strong>phoneNumber</strong> – required (digits only, country code included, e.g. <code>919999888877</code>)
            </li>
            <li>
              <strong>userName</strong> – optional
            </li>
          </ul>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button
            onClick={uploadAndSend}
            disabled={!file || busy}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {busy ? "Processing…" : "Upload & Send"}
          </button>
        </div>
      </div>

      {report && (
        <div className="rounded border p-4">
          <h2 className="text-lg font-semibold mb-2">Report</h2>
          <div className="text-sm space-y-1">
            <div>Total in file: <strong>{report.total}</strong></div>
            <div>New records created: <strong>{report.created}</strong></div>
            <div>Messages sent: <strong>{report.sent}</strong></div>
            <div>Errors: <strong>{report.errors?.length || 0}</strong></div>
          </div>

          {report.errors?.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full table-auto border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">Phone</th>
                    <th className="border px-2 py-1">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {report.errors.map((e, i) => (
                    <tr key={i}>
                      <td className="border px-2 py-1">{e.phoneNumber}</td>
                      <td className="border px-2 py-1">
                        <pre className="whitespace-pre-wrap break-all">
                          {typeof e.error === 'string' ? e.error : JSON.stringify(e.error)}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
