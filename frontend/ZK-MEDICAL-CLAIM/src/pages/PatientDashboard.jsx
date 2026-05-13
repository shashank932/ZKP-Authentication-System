import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPatient, getClaims, submitClaim, savePatient, deleteClaim, recoverClaim, updateClaimPermissions, updateClaim, permanentDeleteClaim } from "../services/api";

const profileFields = [
  { key: "name", label: "Full Name", required: true, type: "text", placeholder: "e.g. John Smith" },
  { key: "age", label: "Age", type: "number", placeholder: "e.g. 28" },
  { key: "blood", label: "Blood Group", type: "text", placeholder: "e.g. B+" },
  { key: "phone", label: "Phone", type: "text", placeholder: "+91 98765 43210" },
  { key: "email", label: "Email", required: true, type: "email", placeholder: "john@example.com" },
  { key: "insuranceId", label: "Insurance ID", required: true, type: "text", placeholder: "e.g. INS-2026-001" },
  { key: "plan", label: "Plan", type: "text", placeholder: "e.g. Gold Health Plan" },
  { key: "coverAmount", label: "Cover Amount", type: "number", placeholder: "500000" },
];

function defaultPermissions(fields, enabled = false) {
  return fields.reduce((acc, field) => {
    acc[field.key] = { hospital: enabled, insurance: enabled };
    return acc;
  }, {});
}

function ConsentMatrix({ fields, permissions, onChange, values, caption }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-900">Sharing Controls</h3>
        <p className="mt-1 text-xs text-gray-500">{caption}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-5 py-3 text-left">Field</th>
              <th className="px-5 py-3 text-left">Patient View</th>
              <th className="px-5 py-3 text-center">Hospital</th>
              <th className="px-5 py-3 text-center">Insurance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fields.map((field) => (
              <tr key={field.key}>
                <td className="px-5 py-3 font-medium text-gray-800">{field.label}</td>
                <td className="px-5 py-3 text-xs text-gray-500">{String(values?.[field.key] || "Not filled")}</td>
                <td className="px-5 py-3 text-center">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-600">
                    <input
                      type="checkbox"
                      checked={Boolean(permissions?.[field.key]?.hospital)}
                      onChange={(event) => onChange(field.key, "hospital", event.target.checked)}
                    />
                    Show hash
                  </label>
                </td>
                <td className="px-5 py-3 text-center">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-600">
                    <input
                      type="checkbox"
                      checked={Boolean(permissions?.[field.key]?.insurance)}
                      onChange={(event) => onChange(field.key, "insurance", event.target.checked)}
                    />
                    Show hash
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ClaimDetailView({ claim, onUpdatePermissions, onCancel }) {
  const claimFields = [
    { key: "hospital", label: "Hospital" },
    { key: "type", label: "Treatment" },
    { key: "date", label: "Date" },
    { key: "amount", label: "Amount" },
    { key: "description", label: "Description" },
  ];

  return (
    <div className="mt-8 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Claim Details & Sharing: {claim.id}</h3>
        <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">Close</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Field</th>
              <th className="px-4 py-3 text-left">Raw Value</th>
              <th className="px-4 py-3 text-left">Hash</th>
              <th className="px-4 py-3 text-center">Hospital</th>
              <th className="px-4 py-3 text-center">Insurance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {claimFields.map(f => (
              <tr key={f.key}>
                <td className="px-4 py-3 font-medium text-gray-700">{f.label}</td>
                <td className="px-4 py-3 text-gray-600">{String(claim.claimData?.[f.key] || "-")}</td>
                <td className="px-4 py-3 font-mono text-[10px] text-blue-600 break-all">{claim.hashedClaim?.[f.key] || "-"}</td>
                <td className="px-4 py-3 text-center">
                  <input 
                    type="checkbox" 
                    checked={Boolean(claim.claimPermissions?.[f.key]?.hospital)} 
                    onChange={(e) => onUpdatePermissions(f.key, "hospital", e.target.checked)}
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <input 
                    type="checkbox" 
                    checked={Boolean(claim.claimPermissions?.[f.key]?.insurance)} 
                    onChange={(e) => onUpdatePermissions(f.key, "insurance", e.target.checked)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function StatusBadge({ status }) {
  const c = {
    Approved:      { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
    Pending:       { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-500"   },
    "Under Review":{ bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-200",     dot: "bg-sky-500"     },
    Rejected:      { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500"     },
  }[status] || { bg:"bg-gray-50", text:"text-gray-600", border:"border-gray-200", dot:"bg-gray-400" };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

function PatientProfileForm({ patientId, initialPatient, onSaved, isSetup = false }) {
  const [form, setForm] = useState(() => ({
    name: initialPatient?.name || "",
    age: initialPatient?.age || "",
    blood: initialPatient?.blood || "B+",
    phone: initialPatient?.phone || "",
    email: initialPatient?.email || "",
    insuranceId: initialPatient?.insuranceId || "",
    plan: initialPatient?.plan || "",
    coverAmount: initialPatient?.coverAmount || "",
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (!form.name || !form.email || !form.insuranceId) {
      setError("Full Name, Email, and Insurance ID are required.");
      return;
    }
    setLoading(true);
    try {
      await savePatient({ id: patientId, ...form, coverAmount: Number(form.coverAmount) || 500000 });
      onSaved();
    } catch (e) {
      setError(e.message || "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-gray-900">{isSetup ? "Complete Your Profile" : "Edit Profile"}</h2>
        <p className="text-gray-500 text-sm mt-1">Please fill in your details to continue</p>
      </div>
      {error && <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { label: "Full Name", key: "name", type: "text", req: true },
          { label: "Email", key: "email", type: "email", req: true },
          { label: "Phone", key: "phone", type: "text" },
          { label: "Insurance ID", key: "insuranceId", type: "text", req: true },
          { label: "Plan", key: "plan", type: "text" },
          { label: "Cover Amount", key: "coverAmount", type: "number" },
          { label: "Age", key: "age", type: "number" },
          { label: "Blood Group", key: "blood", type: "text" },
        ].map(f => (
          <div key={f.key}>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">{f.label} {f.req && <span className="text-red-500">*</span>}</label>
            <input 
              type={f.type} 
              value={form[f.key]} 
              onChange={e => setForm({ ...form, [f.key]: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
        ))}
      </div>
      <button onClick={handleSave} disabled={loading} className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
        {loading ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
}

// ── Edit Claim Modal ──────────────────────────────────────────────────────────
function EditClaimModal({ claim, onClose, onSuccess }) {
  const [form, setForm] = useState({
    hospital: claim.claimData?.hospital || "",
    type: claim.claimData?.type || "Consultation",
    amount: claim.claimData?.amount || "",
    date: claim.claimData?.date || "",
    description: claim.claimData?.description || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (!form.hospital || !form.amount || !form.date) {
      setError("Hospital, amount, and date are required.");
      return;
    }
    setLoading(true);
    try {
      await updateClaim(claim.id, form);
      onSuccess();
      onClose();
    } catch (e) {
      setError(e.message || "Failed to update claim.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Edit Claim #{claim.serialNumber || "N/A"}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Updating claim data and regenerating ZK proof</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6">
          {error && <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Hospital / Clinic Name <span className="text-red-500">*</span></label>
              <input className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form.hospital} onChange={e => setForm({ ...form, hospital: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Treatment Type <span className="text-red-500">*</span></label>
              <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition"
                value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {["Consultation","Surgery","Hospitalization","Diagnostic","Pharmacy","Emergency","Dental","Vision"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Claim Amount (₹) <span className="text-red-500">*</span></label>
                <input type="number" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Date of Treatment <span className="text-red-500">*</span></label>
                <input type="date" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Description <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
              <textarea className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <button onClick={handleSave} disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors text-sm">
              {loading ? "Updating & Generating Proof..." : "Update Claim"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── New Claim Modal ──────────────────────────────────────────────────────────
function NewClaimModal({ patientId, onClose, onSuccess }) {
  const [form, setForm]         = useState({ hospital: "", type: "Consultation", amount: "", date: "", description: "" });
  const [step, setStep]         = useState("form");
  const [newClaim, setNewClaim] = useState(null);
  const [error, setError]       = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!form.hospital || !form.amount || !form.date) {
      setError("Hospital name, amount, and date are required.");
      return;
    }
    setStep("processing");
    try {
      const result = await submitClaim({ patientId, ...form });
      setNewClaim(result.claim);
      setStep("done");
      onSuccess();
    } catch {
      setStep("form");
      setError("Submission failed. Please check server is running.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Submit Insurance Claim</h3>
            <p className="text-xs text-gray-400 mt-0.5">Protected with Zero Knowledge Proof</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6">
          {step === "processing" && (
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-800 text-sm">Generating ZK Proof...</p>
              <p className="text-gray-400 text-xs mt-1">Securing your medical data</p>
            </div>
          )}

          {step === "done" && newClaim && (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="font-bold text-gray-900">Claim Submitted Successfully</h4>
              <p className="text-gray-500 text-sm mt-1 mb-4">Your claim is now under review.</p>
              <div className="bg-gray-50 rounded-xl p-4 text-left mb-4">
                {[
                  { label: "Claim ID", value: newClaim.id, mono: true },
                  { label: "Hospital", value: newClaim.hospital },
                  { label: "Amount",   value: `₹${Number(newClaim.amount).toLocaleString()}` },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-xs text-gray-500">{row.label}</span>
                    <span className={`text-xs font-semibold ${row.mono ? "font-mono text-blue-600" : "text-gray-800"}`}>{row.value}</span>
                  </div>
                ))}
              </div>
              <button onClick={onClose} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition">Done</button>
            </div>
          )}

          {step === "form" && (
            <div className="flex flex-col gap-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5">{error}</div>}

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Hospital / Clinic Name <span className="text-red-500">*</span></label>
                <input className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="e.g. Apollo Hospital, New Delhi"
                  value={form.hospital} onChange={e => setForm({ ...form, hospital: e.target.value })} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Treatment Type <span className="text-red-500">*</span></label>
                <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition"
                  value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {["Consultation","Surgery","Hospitalization","Diagnostic","Pharmacy","Emergency","Dental","Vision"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Claim Amount (₹) <span className="text-red-500">*</span></label>
                  <input type="number" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Date of Treatment <span className="text-red-500">*</span></label>
                  <input type="date" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Description <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
                <textarea className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                  rows={3} placeholder="Brief description of the treatment..."
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              <button onClick={handleSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors text-sm">
                Submit Claim
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function PatientDashboard() {
  const navigate = useNavigate();
  const PATIENT_ID = "PAT-001";

  const [patient, setPatient]       = useState(null);
  const [claims, setClaims]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [activeTab, setActiveTab]   = useState("overview");
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [selectedClaimForEdit, setSelectedClaimForEdit] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [claimPermissions, setClaimPermissions] = useState({});
  const [showModal, setShowModal]   = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const p = await getPatient(PATIENT_ID);
      setPatient(p);
      setNeedsSetup(false);
    } catch {
      setNeedsSetup(true);
      setLoading(false);
      return;
    }
    try { const c = await getClaims(PATIENT_ID); setClaims(c); }
    catch { setClaims([]); }
    setLoading(false);
  };

  const handleSelectClaim = (claim) => {
    setSelectedClaimId(claim.id);
    setClaimPermissions(claim.claimPermissions || {});
  };

  const handleDeleteClaim = async (id) => {
    if (window.confirm("Delete this claim?")) {
      try { await deleteClaim(id); loadData(); } catch (e) { alert(e.message); }
    }
  };

  const handleRecoverClaim = async (id) => {
    try { await recoverClaim(id); loadData(); } catch (e) { alert(e.message); }
  };

  const handlePermanentDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this claim forever? This action cannot be undone.")) {
      try { await permanentDeleteClaim(id); loadData(); } catch (e) { alert(e.message); }
    }
  };

  const handleClaimPermissionChange = async (field, role, value) => {
    const newPermissions = { ...claimPermissions };
    newPermissions[field] = { ...(newPermissions[field] || {}), [role]: value };
    setClaimPermissions(newPermissions);
    try {
      await updateClaimPermissions(selectedClaimId, newPermissions);
    } catch (e) {
      alert("Failed to update permissions: " + e.message);
    }
  };

  useEffect(() => { loadData(); }, []);

   const totalClaimed = claims.filter(c => !c.isDeleted).reduce((a, c) => a + Number(c.claimData?.amount || 0), 0);
   const totalUsed     = claims.filter(c => !c.isDeleted && c.status === "Approved").reduce((a, c) => a + Number(c.claimData?.amount || 0), 0);
   const approved      = claims.filter(c => c.status === "Approved").length;
   const pending       = claims.filter(c => c.status === "Pending" || c.status === "Under Review").length;
   const coverAmount   = Number(patient?.coverAmount || 500000);
   // Show utilization based on claimed amount (not just approved) to detect overages
   const coverPct      = Math.min(150, Math.round((totalClaimed / (coverAmount || 1)) * 100)); // Cap at 150% for display

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Sidebar ── */}
      <aside className="fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-100 flex flex-col z-30">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">MedClaim</p>
              <p className="text-xs text-gray-400">Patient Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4">
          {[
            { id: "overview", label: "Overview", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
            { id: "claims",   label: "My Claims", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
            { id: "profile",  label: "Profile",   icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-colors ${
                activeTab === t.id ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}>
              {t.icon} {t.label}
              {t.id === "claims" && pending > 0 && (
                <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full">{pending}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
              {patient?.name?.[0]?.toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-gray-800 truncate">{patient?.name}</p>
              <p className="text-xs text-gray-400 truncate">{patient?.email}</p>
            </div>
          </div>
          <button onClick={() => navigate("/")}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Page Content ── */}
      <main className="ml-56 flex-1 p-8">

         {/* ── OVERVIEW ── */}
         {activeTab === "overview" && (
           <div className="max-w-5xl space-y-8">
             <div className="mb-6">
               <h1 className="text-2xl font-bold text-gray-900">Good morning, {patient?.name?.split(" ")[0]} 👋</h1>
               <p className="text-gray-500 text-sm mt-1">Here's a summary of your insurance and claims activity.</p>
             </div>

             {needsSetup && (
               <div className="mb-8">
                 <PatientProfileForm 
                   patientId={PATIENT_ID} 
                   initialPatient={patient} 
                   onSaved={loadData} 
                   isSetup={true} 
                 />
               </div>
             )}

             <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total Claims",   value: claims.length, sub: "All time",               color: "text-gray-900"    },
                { label: "Approved",       value: approved,       sub: "Successfully processed", color: "text-emerald-600" },
                { label: "Under Review",   value: pending,        sub: "Awaiting decision",      color: "text-amber-600"   },
                { label: "Amount Claimed", value: `₹${(totalClaimed/1000).toFixed(1)}K`, sub: "Total submitted", color: "text-blue-600" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <p className="text-xs text-gray-500 mb-2">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Coverage Utilization</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{patient?.plan || "Health Insurance Plan"}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    coverPct < 50 ? "bg-emerald-50 text-emerald-700" : coverPct < 80 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                  }`}>{coverPct}% Used</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                  <div className={`h-2 rounded-full transition-all duration-700 ${
                    coverPct < 50 ? "bg-emerald-500" : coverPct < 80 ? "bg-amber-500" : "bg-red-500"
                  }`} style={{ width: `${coverPct}%` }} />
                </div>
   <div className="flex justify-between text-xs text-gray-500">
      <span>Used: <strong className="text-gray-800">₹{totalUsed.toLocaleString()}</strong></span>
      <span>Remaining: <strong className="text-gray-800">₹{(coverAmount - totalClaimed).toLocaleString()}</strong></span>
      <span>Total: <strong className="text-gray-800">₹{coverAmount.toLocaleString()}</strong></span>
   </div>
              </div>

              <div className="bg-blue-600 rounded-xl p-6 flex flex-col justify-between shadow-sm">
                <div>
                  <h3 className="font-semibold text-white text-sm">Submit a Claim</h3>
                  <p className="text-blue-200 text-xs mt-1">Securely verified with ZK Proof.</p>
                </div>
                <button onClick={() => setShowModal(true)}
                  className="mt-4 w-full bg-white text-blue-700 font-semibold py-2.5 rounded-lg text-sm hover:bg-blue-50 transition-colors">
                  New Claim →
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm">Recent Claims</h3>
                <button onClick={() => setActiveTab("claims")} className="text-xs text-blue-600 hover:underline">View all →</button>
              </div>
              {claims.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-sm">No claims yet. Click "New Claim" to get started.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-6 py-3 text-left">Claim ID</th>
                      <th className="px-6 py-3 text-left">Hospital</th>
                      <th className="px-6 py-3 text-left">Type</th>
                      <th className="px-6 py-3 text-left">Date</th>
                      <th className="px-6 py-3 text-right">Amount</th>
                      <th className="px-6 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                   <tbody className="divide-y divide-gray-50">
                      {claims.filter(c => !c.isDeleted).reverse().slice(0, 4).map(c => (
                        <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3.5 font-mono text-xs text-blue-600 font-semibold">{c.id}</td>
                          <td className="px-6 py-3.5 text-gray-800 font-medium">{c.claimData?.hospital || "-"}</td>
                          <td className="px-6 py-3.5 text-gray-500">{c.claimData?.type || "-"}</td>
                          <td className="px-6 py-3.5 text-gray-500">{c.claimData?.date || "-"}</td>
                          <td className="px-6 py-3.5 text-right font-semibold text-gray-900">₹{Number(c.claimData?.amount || 0).toLocaleString()}</td>
                           <td className="px-6 py-3.5 text-center">
                             <button onClick={() => handleDeleteClaim(c.id)} className="text-xs text-red-600 hover:underline font-semibold">Delete</button>
                           </td>
                          <td className="px-6 py-3.5 text-center"><StatusBadge status={c.status} /></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
              {selectedClaimId && (
                <ClaimDetailView 
                  claim={claims.find(c => c.id === selectedClaimId)} 
                  onCancel={() => setSelectedClaimId(null)}
                  onUpdatePermissions={handleClaimPermissionChange}
                />
              )}
            </div>
          </div>
        )}
        {/* ── MY CLAIMS ── */}
        {activeTab === "claims" && (
          <div className="max-w-5xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Claims</h1>
                <p className="text-gray-500 text-sm mt-1">All submitted claims and their current status.</p>
              </div>
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                New Claim
              </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {claims.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-sm font-medium">No claims found</p>
                  <p className="text-xs mt-1">Submit your first claim using the button above.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                      <tr>
                        <th className="px-6 py-3.5 text-left">S.No</th>
                        <th className="px-6 py-3.5 text-left">Claim ID</th>
                        <th className="px-6 py-3.5 text-left">Hospital</th>
                        <th className="px-6 py-3.5 text-left">Treatment</th>
                        <th className="px-6 py-3.5 text-left">Date</th>
                        <th className="px-6 py-3.5 text-right">Amount</th>
                        <th className="px-6 py-3.5 text-center">ZK Status</th>
                        <th className="px-6 py-3.5 text-center">Status</th>
                        <th className="px-6 py-3.5 text-center">Actions</th>
                      </tr>
                    </thead>
                     <tbody className="divide-y divide-gray-50">
                       {claims.filter(c => !c.isDeleted).reverse().map(c => (
                         <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                           <td className="px-6 py-4 text-gray-800 font-medium">{c.serialNumber || "-"}</td>
                           <td className="px-6 py-4 font-mono text-xs text-blue-600 font-semibold cursor-pointer hover:underline" onClick={() => handleSelectClaim(c)}>{c.id}</td>
                           <td className="px-6 py-4 text-gray-800 font-medium">{c.claimData?.hospital || "-"}</td>
                           <td className="px-6 py-4 text-gray-500">{c.claimData?.type || "-"}</td>
                           <td className="px-6 py-4 text-gray-500">{c.claimData?.date || "-"}</td>
                           <td className="px-6 py-4 text-right font-semibold text-gray-900">₹{Number(c.claimData?.amount || 0).toLocaleString()}</td>
                           <td className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                {c.zkVerified ? <span className="text-xs text-emerald-700 font-medium">✓ Verified</span> : <span className="text-xs text-gray-400">—</span>}
                                <span className="text-[9px] font-mono text-gray-400 truncate max-w-[80px]">{c.zkProofHash?.slice(0, 8)}...</span>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-center"><StatusBadge status={c.status} /></td>
                            <td className="px-6 py-4 text-center flex items-center justify-center gap-3">
                              <button onClick={() => { setSelectedClaimForEdit(c); setShowEditModal(true); }} className="text-xs text-blue-600 hover:underline font-semibold">Edit</button>
                              <button onClick={() => handleDeleteClaim(c.id)} className="text-xs text-red-600 hover:underline font-semibold">Delete</button>
                            </td>
                         </tr>
                       ))}
                     </tbody>

                 </table>
               )}
             </div>

             {/* ── Deleted Claims Section ── */}
             {claims.some(c => c.isDeleted) && (
               <div className="mt-12">
                 <div className="flex items-center gap-2 mb-4">
                   <h2 className="text-lg font-bold text-gray-900">Deleted Claims</h2>
                   <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
                     {claims.filter(c => c.isDeleted).length}
                   </span>
                 </div>
                 <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                   <table className="w-full text-sm">
                     <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                       <tr>
                         <th className="px-6 py-3.5 text-left">Claim ID</th>
                         <th className="px-6 py-3.5 text-left">Hospital</th>
                         <th className="px-6 py-3.5 text-left">Treatment</th>
                         <th className="px-6 py-3.5 text-right">Amount</th>
                         <th className="px-6 py-3.5 text-center">Status</th>
                         <th className="px-6 py-3.5 text-center">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                       {claims.filter(c => c.isDeleted).reverse().map(c => (
                         <tr key={c.id} className="bg-gray-50/50 hover:bg-gray-50 transition-colors">
                           <td className="px-6 py-4 font-mono text-xs text-gray-400">{c.id}</td>
                           <td className="px-6 py-4 text-gray-500">{c.claimData?.hospital || "-"}</td>
                           <td className="px-6 py-4 text-gray-500">{c.claimData?.type || "-"}</td>
                           <td className="px-6 py-4 text-right text-gray-500">₹{Number(c.claimData?.amount || 0).toLocaleString()}</td>
                           <td className="px-6 py-4 text-center"><StatusBadge status={c.status} /></td>
                                <td className="px-6 py-4 text-center flex items-center justify-center gap-3">
                                  <button onClick={() => handleRecoverClaim(c.id)} className="text-xs text-blue-600 hover:underline font-semibold">Recover</button>
                                  <button onClick={() => handlePermanentDelete(c.id)} className="text-xs text-red-600 hover:underline font-semibold">Delete Forever</button>
                                </td>

                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
             )}
           </div>
          )}
          {/* ── PROFILE ── */}
        {activeTab === "profile" && patient && (
          <div className="max-w-6xl space-y-6">
            {needsSetup ? (
              <PatientProfileForm 
                patientId={PATIENT_ID} 
                initialPatient={patient} 
                onSaved={loadData} 
                isSetup={false} 
              />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Profile & Sharing</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your personal information and control who can see your data hashes.</p>
                  </div>
                  <button 
                    onClick={() => setNeedsSetup(true)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium"
                  >
                    Edit Profile
                  </button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Personal Information</h3>
                    <div className="space-y-3">
                      {profileFields.slice(0, 4).map((field) => (
                        <div key={field.key} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                          <span className="text-xs text-gray-500">{field.label}</span>
                          <span className="text-xs font-semibold text-gray-800">{String(patient[field.key] || "-")}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Insurance Details</h3>
                    <div className="space-y-3">
                      {profileFields.slice(4).map((field) => (
                        <div key={field.key} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                          <span className="text-xs text-gray-500">{field.label}</span>
                          <span className="text-xs font-semibold text-gray-800">{String(patient[field.key] || "-")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <ConsentMatrix 
                  fields={profileFields} 
                  permissions={patient.permissions || defaultPermissions(profileFields, false)}
                  values={patient}
                  caption="Select which fields the Hospital and Insurance company can see as hashes."
                  onChange={(field, role, value) => {
                    setPatient(prev => ({
                      ...prev,
                      permissions: {
                        ...prev.permissions,
                        [field]: { ...(prev.permissions?.[field] || {}), [role]: value }
                      }
                    }));
                  }}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900">Current profile hashes</h3>
                    <div className="grid gap-3">
                      {profileFields.map(field => (
                        patient.hashedProfile?.[field.key] && (
                          <div key={field.key} className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                            <div className="text-[10px] font-bold uppercase text-gray-400">{field.label}</div>
                            <div className="text-xs font-mono text-blue-600 break-all">{patient.hashedProfile[field.key]}</div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Visibility Summary</h3>
                    <div className="space-y-2">
                      {profileFields.map(field => (
                        <div key={field.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <span className="text-xs text-gray-600">{field.label}</span>
                          <div className="flex gap-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${patient.permissions?.[field.key]?.hospital ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"}`}>Hospital</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${patient.permissions?.[field.key]?.insurance ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"}`}>Insurance</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={async () => {
                      try {
                        await savePatient({ id: PATIENT_ID, ...patient, permissions: patient.permissions });
                        await loadData();
                        alert("Sharing settings saved!");
                      } catch (e) { alert("Save failed: " + e.message); }
                    }}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Save Sharing Settings
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>

       {showModal && <NewClaimModal patientId={PATIENT_ID} onClose={() => setShowModal(false)} onSuccess={loadData} />}
       {showEditModal && <EditClaimModal claim={selectedClaimForEdit} onClose={() => setShowEditModal(false)} onSuccess={loadData} />}
     </div>
   );
 }
