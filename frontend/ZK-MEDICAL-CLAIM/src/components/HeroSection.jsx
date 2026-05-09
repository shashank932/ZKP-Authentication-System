import ClaimFlow from "./ClaimFlow";

const featureTags = [
  "No raw report leak",
  "Tamper-resistant proof",
  "Dual verification",
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,#effcf7_0%,#e5f8f0_32%,#d9f0e9_100%)] px-7 py-8 md:px-10 md:py-12 lg:px-12 lg:py-14">
      <div className="absolute -left-16 top-8 h-52 w-52 rounded-full bg-white/40 blur-3xl" />
      <div className="absolute right-16 top-20 h-28 w-28 rounded-full bg-[#dff6ef] blur-2xl" />
      <div className="absolute bottom-6 right-8 h-40 w-40 rounded-full bg-[#c6ece0]/75 blur-3xl" />

      <div className="relative flex h-full flex-col justify-between">
        <div>
          <div className="inline-flex items-center gap-3 rounded-full border border-[#bde6da] bg-white/80 px-4 py-2 text-sm font-semibold text-[#0f4a4b] shadow-sm">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0f7f72] text-base text-white shadow-sm">
              +
            </span>
            MedRec ZK
          </div>

          <h1 className="mt-12 max-w-2xl text-[2.7rem] font-extrabold leading-[1.05] text-[#0d4948] md:text-[3.5rem]">
            Privacy-first medical claim workflow
          </h1>

          <p className="mt-5 max-w-xl text-sm leading-7 text-[#2f6967] md:text-base">
            Patient does not share raw data. The system uses circom + snarkjs to
            generate a proof, hospital verifies it, and insurance re-verifies before
            approving or rejecting the claim.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {featureTags.map((item) => (
              <span
                key={item}
                className="rounded-full border border-[#cae8df] bg-white/85 px-4 py-2 text-xs font-semibold text-[#166765] shadow-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <ClaimFlow />
        </div>
      </div>
    </section>
  );
}
