import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPatient, getClaims, submitClaim, savePatient } from "../services/api";

// ─── Status Badge ─────────────────────────────────────────────────────────────
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

// ─── Profile Setup ────────────────────────────────────────────────────────────
function ProfileSetup({ patientId, onSaved }) {
  const [form, setForm] = useState({
    name: "", age: "", blood: "B+", phone: "",
    email: "", insuranceId: "", plan: "", coverAmount: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

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
    } catch {
      setError("Server is not running. Please start the backend: cd backend && node server.js");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-lg p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Complete Your Profile</h2>
          <p className="text-gray-500 text-sm mt-1">Fill in your details to get started</p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* Row fields */}
          {[
            { label: "Full Name",       key: "name",        type: "text",   placeholder: "e.g. John Smith",       req: true  },
            { label: "Email Address",   key: "email",       type: "email",  placeholder: "john@example.com",      req: true  },
            { label: "Phone Number",    key: "phone",       type: "text",   placeholder: "+91 00000 00000",       req: false },
            { label: "Insurance ID",    key: "insuranceId", type: "text",   placeholder: "e.g. INS-2024-XXXX",   req: true  },
            { label: "Insurance Plan",  key: "plan",        type: "text",   placeholder: "e.g. Gold Health Plan", req: false },
            { label: "Sum Insured (₹)", key: "coverAmount", type: "number", placeholder: "e.g. 500000",          req: false },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                {f.label} {f.req && <span className="text-red-500">*</span>}
              </label>
              <input type={f.type} placeholder={f.placeholder} value={form[f.key]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Age</label>
              <input type="number" placeholder="e.g. 28" value={form.age}
                onChange={e => setForm({ ...form, age: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Blood Group</label>
              <select value={form.blood} onChange={e => setForm({ ...form, blood: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition">
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <button onClick={handleSave} disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60 text-sm mt-1">
            {loading ? "Saving..." : "Save & Continue →"}
          </button>
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

  useEffect(() => { loadData(); }, []);

  const totalClaimed = claims.reduce((a, c) => a + Number(c.amount), 0);
  const approved     = claims.filter(c => c.status === "Approved").length;
  const pending      = claims.filter(c => c.status === "Pending" || c.status === "Under Review").length;
  const coverAmount  = Number(patient?.coverAmount) || 500000;
  const coverPct     = Math.min(100, Math.round((totalClaimed / coverAmount) * 100));

  if (needsSetup) return <ProfileSetup patientId={PATIENT_ID} onSaved={loadData} />;

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
          <div className="max-w-5xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Good morning, {patient?.name?.split(" ")[0]} 👋</h1>
              <p className="text-gray-500 text-sm mt-1">Here's a summary of your insurance and claims activity.</p>
            </div>

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
                  <span>Used: <strong className="text-gray-800">₹{totalClaimed.toLocaleString()}</strong></span>
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
                    {[...claims].reverse().slice(0, 4).map(c => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3.5 font-mono text-xs text-blue-600 font-semibold">{c.id}</td>
                        <td className="px-6 py-3.5 text-gray-800 font-medium">{c.hospital}</td>
                        <td className="px-6 py-3.5 text-gray-500">{c.type}</td>
                        <td className="px-6 py-3.5 text-gray-500">{c.date}</td>
                        <td className="px-6 py-3.5 text-right font-semibold text-gray-900">₹{Number(c.amount).toLocaleString()}</td>
                        <td className="px-6 py-3.5 text-center"><StatusBadge status={c.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                      <th className="px-6 py-3.5 text-left">Claim ID</th>
                      <th className="px-6 py-3.5 text-left">Hospital</th>
                      <th className="px-6 py-3.5 text-left">Treatment</th>
                      <th className="px-6 py-3.5 text-left">Date</th>
                      <th className="px-6 py-3.5 text-right">Amount</th>
                      <th className="px-6 py-3.5 text-center">ZK Verified</th>
                      <th className="px-6 py-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[...claims].reverse().map(c => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-blue-600 font-semibold">{c.id}</td>
                        <td className="px-6 py-4 text-gray-800 font-medium">{c.hospital}</td>
                        <td className="px-6 py-4 text-gray-500">{c.type}</td>
                        <td className="px-6 py-4 text-gray-500">{c.date}</td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">₹{Number(c.amount).toLocaleString()}</td>
                        <td className="px-6 py-4 text-center">
                          {c.zkVerified
                            ? <span className="text-xs text-emerald-700 font-medium">✓ Verified</span>
                            : <span className="text-xs text-gray-400">—</span>}
                        </td>
                        <td className="px-6 py-4 text-center"><StatusBadge status={c.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── PROFILE ── */}
        {activeTab === "profile" && patient && (
          <div className="max-w-2xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-500 text-sm mt-1">Your personal and insurance information.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                {patient.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">{patient.name}</h2>
                <p className="text-gray-500 text-sm">{patient.email}</p>
                <div className="flex gap-2 mt-2">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium px-2.5 py-1 rounded-md">Active Policy</span>
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium px-2.5 py-1 rounded-md">🔐 ZKP Enabled</span>
                </div>
              </div>
              <button onClick={() => setNeedsSetup(true)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium">
                Edit
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Personal Information</h3>
                {[
                  { label: "Full Name",   value: patient.name },
                  { label: "Age",         value: patient.age ? `${patient.age} years` : "—" },
                  { label: "Blood Group", value: patient.blood || "—" },
                  { label: "Phone",       value: patient.phone || "—" },
                ].map(d => (
                  <div key={d.label} className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-500">{d.label}</span>
                    <span className="text-xs font-semibold text-gray-800">{d.value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Insurance Details</h3>
                {[
                  { label: "Insurance ID", value: patient.insuranceId },
                  { label: "Plan",         value: patient.plan || "—" },
                  { label: "Sum Insured",  value: `₹${Number(patient.coverAmount||0).toLocaleString()}` },
                  { label: "Balance",      value: `₹${(coverAmount - totalClaimed).toLocaleString()}` },
                ].map(d => (
                  <div key={d.label} className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-500">{d.label}</span>
                    <span className="text-xs font-semibold text-gray-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {showModal && <NewClaimModal patientId={PATIENT_ID} onClose={() => setShowModal(false)} onSuccess={loadData} />}
    </div>
  );
}