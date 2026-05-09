const roles = [
  {
    label: "Patient Portal",
    route: "/patient",
    helper: "Create claim with zkSNARK proof",
    color: "bg-[#0f7f72] hover:brightness-105",
  },
  {
    label: "Hospital Portal",
    route: "/hospital",
    helper: "Validate treatment and proof packet",
    color: "bg-[#176f93] hover:brightness-105",
  },
  {
    label: "Insurance Portal",
    route: "/insurance",
    helper: "Independent ZK verification and decision",
    color: "bg-[#0b5457] hover:brightness-105",
  },
];

export default function RoleSelection({ onSelect }) {
  return (
    <section className="bg-white/96 px-7 py-8 md:px-9 md:py-10">
      <div className="flex h-full flex-col justify-center">
        <div className="rounded-[2rem] border border-[#e0ece7] bg-white p-6 shadow-[0_18px_48px_rgba(15,68,66,0.08)] md:p-8">
          <div className="mb-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5d8d8b]">
              Secure Access
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-[#10484a]">Choose Role</h2>
            <p className="mt-2 text-sm leading-6 text-[#567f80]">
              
            </p>
          </div>

          <div className="space-y-4">
            {roles.map((role) => (
              <button
                key={role.label}
                onClick={() => onSelect(role.route)}
                className={`w-full rounded-2xl px-5 py-5 text-left text-white shadow-md transition duration-200 hover:scale-[1.01] ${role.color}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-bold">{role.label}</p>
                    <p className="mt-1 text-xs text-white/85">{role.helper}</p>
                  </div>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg font-semibold">
                    ?
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-[#d8e8e4] bg-[#f5fbf9] p-4 shadow-sm">
            <p className="text-xs font-semibold text-[#4c7776]">Stack</p>
            <p className="mt-1 text-sm font-bold text-[#164f51]">Circom + snarkjs + Groth16</p>
            <p className="mt-2 text-xs leading-6 text-[#5b8080]">
              
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
