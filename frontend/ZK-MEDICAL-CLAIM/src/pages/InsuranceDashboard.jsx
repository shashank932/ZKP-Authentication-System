
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInsuranceClaims, verifyInsuranceClaim } from "../services/api";

function StatCard({ label, value, note }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-3 text-3xl font-bold text-slate-900">{value}</div>
      <div className="mt-2 text-xs text-slate-400">{note}</div>
    </div>
  );
}

function HashSection({ title, payload, hidden }) {
  const entries = Object.entries(payload || {});
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        <span className="text-xs text-slate-500">
          Hidden: {hidden?.length || 0}
        </span>
      </div>
      {entries.length ? (
        <div className="mt-3 space-y-3">
          {entries.map(([field, meta]) => (
            <div key={field} className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {field}
              </div>
              <div className="mt-1 break-all font-mono text-xs text-sky-700">
                {meta.hash}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 text-sm text-slate-500">No shared hashes</div>
      )}
    </div>
  );
}

function RejectionReasons({ checks, status }) {
  if (status !== "Rejected") return null;
  
  const reasons = [];
  if (!checks?.zkValid) reasons.push("ZK Proof invalid");
  if (!checks?.amountWithinLimit) reasons.push("Amount exceeds coverage");
  if (!checks?.treatmentCovered) reasons.push("Treatment not covered");
  if (!checks?.withinTimeLimit) reasons.push("Claim submitted too late");
  if (!checks?.noDuplicate) reasons.push("Duplicate claim detected");
  
  if (reasons.length === 0) return null;

  return (
    <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl">
      <p className="text-xs font-bold text-red-700 mb-1">Rejection Reasons:</p>
      <ul className="text-[11px] text-red-600 list-disc list-inside space-y-0.5">
        {reasons.map((r, i) => <li key={i}>{r}</li>)}
      </ul>
    </div>
  );
}

export default function InsuranceDashboard() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const loadClaims = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getInsuranceClaims();
      setClaims(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id) => {
    setBusyId(id);
    try {
      await verifyInsuranceClaim(id);
      await loadClaims();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId("");
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const stats = useMemo(
    () => ({
      total: claims.length,
      pending: claims.filter((c) => c.status === "Pending").length,
      approved: claims.filter((c) => c.status === "Approved").length,
      rejected: claims.filter((c) => c.status === "Rejected").length,
    }),
    [claims]
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef6ff_100%)] px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
                Insurance portal
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                Consent-aware claim review
              </h1>
            </div>

            <div className="flex gap-3">
              <button
                onClick={loadClaims}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Refresh
              </button>

              <button
                onClick={handleLogout}
                className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Claims" value={stats.total} note="Insurance queue" />
          <StatCard label="Pending" value={stats.pending} note="Awaiting final review" />
          <StatCard label="Approved" value={stats.approved} note="All checks passed" />
          <StatCard label="Rejected" value={stats.rejected} note="At least one check failed" />
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-12 text-center text-slate-500 shadow-sm">
            Loading insurance claims...
          </div>
        )}

        {!loading &&
          claims.map((claim) => (
            <div
              key={claim.id}
              className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                 <div>
                   <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Claim #{claim.serialNumber || "N/A"} (ID: {claim.id})</div>
                   <div className="mt-1 font-mono text-sm font-semibold text-sky-700">
                     {"*".repeat(12)}
                   </div>

                   <div className="mt-3 flex flex-wrap items-center gap-2">
                     <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                       claim.status === "Approved"
                         ? "bg-emerald-50 text-emerald-700"
                         : claim.status === "Rejected"
                         ? "bg-red-50 text-red-700"
                         : "bg-amber-50 text-amber-700"
                     }`}>
                       {claim.status}
                     </span>
                     <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                       Proof hash {claim.proofHash || "missing"}
                     </span>
                     {claim.status === "Pending" && (
                       <button 
                         onClick={() => handleVerify(claim.id)} 
                         disabled={busyId === claim.id}
                         className="rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                       >
                         {busyId === claim.id ? "Verifying..." : "Verify For Insurance"}
                       </button>
                     )}
                   </div>
                </div>
              </div>

               <div className="mt-5 grid gap-4 xl:grid-cols-3">
                 <div className="flex flex-col gap-4 xl:col-span-1">
                   <HashSection
                     title="Shared profile hashes"
                     payload={claim.patientConsent?.profile?.shared}
                     hidden={claim.patientConsent?.profile?.hidden}
                   />
                   <HashSection
                     title="Shared claim hashes"
                     payload={claim.patientConsent?.claim?.shared}
                     hidden={claim.patientConsent?.claim?.hidden}
                   />
                 </div>
                 <div className="flex flex-col gap-4 xl:col-span-1">
                   <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 h-full">
                     <div className="font-semibold text-slate-900">
                       Proof and policy snapshot
                     </div>
                      <div className="mt-2">
                        <div className="flex flex-col gap-1">
                          <span>Public signals: <span className="font-mono text-xs">
                            {claim.publicSignals?.join(", ") || "-"}
                          </span></span>
                          <span className="text-[10px] text-slate-400 italic">(1: Pass, 0: Fail | Order: Amount, Treatment, Time, Duplicate)</span>
                        </div>
                      </div>
                     <div className="mt-2">
                       Amount upper bound: {claim.proofStatement?.amountUpperBound || "-"}
                     </div>
                     <div className="mt-2">
                       Within bound:{" "}
                       {String(claim.proofStatement?.amountIsWithinBound ?? false)}
                     </div>
                     <div className="mt-2">
                       Hospital verified: {String(claim.hospitalVerified)}
                     </div>
                     <div className="mt-2">
                       ZK verified: {String(claim.zkVerified)}
                     </div>
                     </div>
                   </div>
                 </div>
                 <div className="flex flex-col gap-4 xl:col-span-1">
                   <RejectionReasons checks={claim.checks || claim.insuranceChecks} status={claim.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
