const steps = [
  { label: "Patient: Generate Proof", tone: "bg-[#e7f8f3] text-[#205f61]" },
  { label: "Hospital: Verify", tone: "bg-[#e8f0ff] text-[#215f85]" },
  { label: "Insurance: Accept / Reject", tone: "bg-[#e4f3f5] text-[#185658]" },
];

export default function ClaimFlow() {
  return (
    <div className="rounded-[1.7rem] border border-[#b9e3d8] bg-white/82 p-5 shadow-[0_12px_30px_rgba(18,91,82,0.08)] md:p-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2d7473]">
        Claim Flow
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold md:gap-3">
        {steps.map((step, index) => (
          <div key={step.label} className="contents">
            <span className={`rounded-full px-3.5 py-2 ${step.tone}`}>{step.label}</span>
            {index < steps.length - 1 ? (
              <span className="px-1 text-sm font-bold text-[#5d8480]" aria-hidden="true">
                →
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
