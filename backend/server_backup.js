
const express = require("express");
const cors = require("cors");
const { generateProof, verifyProof } = require("./zkp_snark");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const claims = [];
const patients = [];

const COVERED_TREATMENTS = ["surgery","consultation","hospitalization","emergency","diagnostic","pharmacy","lab","radiology","physiotherapy","dental","maternity","mental health","rehabilitation"];
const CLAIM_WINDOW_DAYS = 90;

app.get("/", (req, res) => res.send("Backend running"));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.post("/api/patient", (req, res) => {
  const patient = { ...req.body, coverageAmount: Number(req.body.coverageAmount ?? req.body.coverAmount ?? 500000) };
  const existing = patients.find((p) => p.id === patient.id);
  if (existing) Object.assign(existing, patient);
  else patients.push(patient);
  res.json({ success: true, patient });
});

app.get("/api/patients", (req, res) => {
  const seen = new Map();
  for (const claim of claims) {
    if (!seen.has(claim.patientId)) {
      const patient = patients.find((p) => p.id === claim.patientId);
      seen.set(claim.patientId, {
        id: claim.patientId,
        name: patient?.name || claim.patientId,
        insuranceId: patient?.insuranceId || null,
        plan: patient?.plan || null,
        blood: patient?.blood || null,
        coverageAmount: Number(patient?.coverageAmount ?? patient?.coverAmount ?? 500000),
      });
    }
  }
  res.json([...seen.values()]);
});

app.get("/api/patient/:id", (req, res) => {
  const patient = patients.find((p) => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: "Patient not found" });
  res.json(patient);
});

app.get("/api/patient/claims/:id", (req, res) => {
  res.json(claims.filter((c) => c.patientId === req.params.id));
});

app.get("/api/claims/all", (req, res) => res.json(claims));

app.get("/api/claims/:patientId", (req, res) => {
  res.json(claims.filter((c) => c.patientId === req.params.patientId));
});

app.post("/api/claims", async (req, res) => {
  const claim = {
    id: Date.now().toString(),
    patientId: req.body.patientId,
    hospital: req.body.hospital,
    type: req.body.type,
    date: req.body.date,
    amount: Number(req.body.amount),
    description: req.body.description || "",
    status: "Pending",
    hospitalVerified: false,
    zkVerified: false,
    zkProofHash: null,
    zkProof: null,
    submittedAt: new Date().toISOString(),
  };
  try {
    const zkPacket = await generateProof(claim);
    claim.zkProof = { proof: zkPacket.proof, publicSignals: zkPacket.publicSignals, statement: zkPacket.statement };
    claim.zkProofHash = zkPacket.proofHash;
  } catch (error) {
    console.error("Failed to generate proof:", error.message);
  }
  claims.push(claim);
  res.json({ success: true, claim });
});

function calculateDaysDiff(claim) {
  const treatmentDate = new Date(claim.date);
  const submittedDate = new Date(claim.submittedAt);
  return Math.floor((submittedDate - treatmentDate) / (1000 * 60 * 60 * 24));
}

function isWithinTimeLimit(claim) {
  const daysDiff = calculateDaysDiff(claim);
  return (daysDiff >= 0 && daysDiff <= CLAIM_WINDOW_DAYS) || (daysDiff < 0 && Math.abs(daysDiff) <= 30);
}

function hasNoDuplicate(targetClaim) {
  const duplicate = claims.find(
    (c) => c.id !== targetClaim.id && c.patientId === targetClaim.patientId &&
      c.date === targetClaim.date && c.type?.toLowerCase() === targetClaim.type?.toLowerCase() &&
      Number(c.amount) === Number(targetClaim.amount) && c.status !== "Rejected"
  );
  return !duplicate;
}

function isTreatmentCovered(claim) {
  const normalized = (claim.type || "").toLowerCase().trim();
  return COVERED_TREATMENTS.some((item) => normalized.includes(item));
}

function isAmountWithinPolicy(claim, patient) {
  const claimAmount = Number(claim.amount);
  const coverageAmount = Number(patient?.coverageAmount ?? patient?.coverAmount ?? Infinity);
  return claimAmount <= coverageAmount;
}

app.post("/api/hospital/verify/:id", async (req, res) => {
  const claim = claims.find((c) => c.id === req.params.id);
  if (!claim) return res.status(404).json({ error: "Claim not found" });

  const patient = patients.find((p) => p.id === claim.patientId);

  const zkValid = await verifyProof(claim.zkProof);
  const checks = {
    zkVerified: zkValid,
    hospitalVerified: true,
    treatmentCovered: isTreatmentCovered(claim),
    amountWithinLimit: isAmountWithinPolicy(claim, patient),
    noDuplicate: hasNoDuplicate(claim),
    withinTimeLimit: isWithinTimeLimit(claim),
  };

  const autoDecision = Object.values(checks).every(Boolean) ? "Approved" : "Rejected";

  claim.zkVerified = zkValid;
  claim.hospitalVerified = true;
  claim.checks = checks;
  claim.autoDecision = autoDecision;
  claim.status = autoDecision;

  res.json({ success: true, claim, checks, autoDecision });
});

app.get("/api/insurance/claims", (req, res) => res.json(claims));

app.post("/api/insurance/verify/:id", async (req, res) => {
  const claim = claims.find((c) => c.id === req.params.id);
  if (!claim) return res.status(404).json({ error: "Claim not found" });

  const patient = patients.find((p) => p.id === claim.patientId);

  const zkValid = await verifyProof(claim.zkProof);
  const checks = {
    hospitalVerified: claim.hospitalVerified === true,
    zkValid: zkValid,
    treatmentCovered: isTreatmentCovered(claim),
    amountWithinLimit: isAmountWithinPolicy(claim, patient),
    noDuplicate: hasNoDuplicate(claim),
    withinTimeLimit: isWithinTimeLimit(claim),
  };

  const autoDecision = Object.values(checks).every(Boolean) ? "Approved" : "Rejected";

  claim.zkVerified = zkValid;
  claim.insuranceChecks = checks;
  claim.status = autoDecision;

  res.json({ success: true, claim, checks, autoDecision });
});

app.post("/api/insurance/decision/:id", (req, res) => {
  const claim = claims.find((c) => c.id === req.params.id);
  if (!claim) return res.status(404).json({ error: "Claim not found" });
  claim.status = req.body.decision;
  res.json({ success: true, claim });
});

app.patch("/api/claims/:id/status", (req, res) => {
  const claim = claims.find((c) => c.id === req.params.id);
  if (!claim) return res.status(404).json({ error: "Claim not found" });
  claim.status = req.body.status;
  res.json({ success: true, claim });
});

app.get("/api/debug/proof/:id", async (req, res) => {
  const claim = claims.find((c) => c.id === req.params.id);
  if (!claim) return res.status(404).json({ error: "Claim not found" });
  if (!claim.zkProof) return res.json({ hasProof: false });
  const valid = await verifyProof(claim.zkProof);
  res.json({ hasProof: true, proofHash: claim.zkProofHash, publicSignals: claim.zkProof.publicSignals, statement: claim.zkProof.statement, isValid: valid });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
