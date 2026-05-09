require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const mongoose = require("mongoose");
const { generateProof, verifyProof, extractChecksFromProof } = require("./zkp_snark");

const app = express();
app.use(cors({ 
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : true, 
  credentials: true 
}));
app.use(express.json());

const PORT = Number(process.env.PORT || 3001);
const MONGO_URI = process.env.MONGO_URI;

// ─── SCHEMAS ────────────────────────────────────────────────────────────────

const patientSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  profile: { type: Object, required: true },
  permissions: { type: Object, default: {} },
  hashedProfile: { type: Object, default: {} },
  updatedAt: { type: String },
  isDeleted: { type: Boolean, default: false },
});

const claimSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  patientId: { type: String, required: true },
  hospital: String,
  type: String,
  date: String,
  amount: Number,
  coverAmount: Number,
  description: String,
  profileSnapshot: Object,
  hashedProfile: Object,
  profilePermissions: Object,
  claimSnapshot: Object,
  hashedClaim: Object,
  claimPermissions: Object,
  status: { type: String, default: "Pending" },
  hospitalVerified: { type: Boolean, default: false },
  zkVerified: { type: Boolean, default: false },
  zkProofHash: String,
  zkProof: Object,
  checks: Object,
  insuranceChecks: Object,
  autoDecision: String,
  submittedAt: String,
  isDeleted: { type: Boolean, default: false },
});

const Patient = mongoose.model("Patient", patientSchema);
const Claim = mongoose.model("Claim", claimSchema);

// ─── HELPERS ────────────────────────────────────────────────────────────────

const COVERED_TREATMENTS = [
  "surgery", "consultation", "hospitalization", "emergency",
  "diagnostic", "pharmacy", "lab", "radiology", "physiotherapy",
  "dental", "maternity", "mental health", "rehabilitation",
];
const CLAIM_WINDOW_DAYS = 90;
const PROFILE_FIELDS = ["name", "age", "blood", "phone", "email", "insuranceId", "plan", "coverAmount"];
const CLAIM_FIELDS = ["hospital", "type", "date", "amount", "description"];

function hashField(field, value) {
  return `sha256:${crypto.createHash("sha256").update(`${field}:${String(value ?? "")}`).digest("hex")}`;
}

function buildPermissionEntry(input = {}) {
  return { hospital: Boolean(input.hospital), insurance: Boolean(input.insurance) };
}

function buildPermissions(fields, incoming = {}, fallback = false) {
  const permissions = {};
  for (const field of fields) {
    permissions[field] = buildPermissionEntry(incoming[field] || { hospital: fallback, insurance: fallback });
  }
  return permissions;
}

function buildHashedFields(fields, values = {}) {
  const hashed = {};
  for (const field of fields) {
    hashed[field] = hashField(field, values[field] ?? "");
  }
  return hashed;
}

function sanitizePatientForOwner(patient) {
  return {
    id: patient.id,
    ...patient.profile,
    permissions: patient.permissions,
    hashedProfile: patient.hashedProfile,
  };
}

function toRoleData(fields, hashedFields, permissions, role) {
  const shared = {};
  const hidden = [];
  for (const field of fields) {
    const permission = permissions[field] || { hospital: false, insurance: false };
    if (permission[role]) {
      shared[field] = { hash: hashedFields[field], shared: true, algorithm: "sha256" };
    } else {
      hidden.push(field);
    }
  }
  return { shared, hidden };
}

function isWithinTimeLimit(claim) {
  const treatmentDate = new Date(claim.date);
  const submittedDate = new Date(claim.submittedAt);
  const daysDiff = Math.floor((submittedDate - treatmentDate) / (1000 * 60 * 60 * 24));
  return (daysDiff >= 0 && daysDiff <= CLAIM_WINDOW_DAYS) || (daysDiff < 0 && Math.abs(daysDiff) <= 30);
}

async function hasNoDuplicate(targetClaim) {
  const duplicate = await Claim.findOne({
    id: { $ne: targetClaim.id },
    patientId: targetClaim.patientId,
    date: targetClaim.date,
    type: { $regex: new RegExp(targetClaim.type, "i") },
    amount: Number(targetClaim.amount),
    status: { $ne: "Rejected" },
  });
  return !duplicate;
}

function isTreatmentCovered(claim) {
  const normalized = (claim.type || "").toLowerCase().trim();
  return COVERED_TREATMENTS.some((item) => normalized.includes(item));
}

function isAmountWithinPolicy(claim, patient) {
  const claimAmount = Number(claim.amount);
  const coverageAmount = Number(patient?.profile?.coverAmount ?? 500000);
  return claimAmount <= coverageAmount;
}

function serializeClaimForPatient(claim) {
  return {
    id: claim.id,
    patientId: claim.patientId,
    status: claim.status,
    isDeleted: claim.isDeleted,
    autoDecision: claim.autoDecision,
    hospitalVerified: claim.hospitalVerified,
    zkVerified: claim.zkVerified,
    submittedAt: claim.submittedAt,
    profilePermissions: claim.profilePermissions,
    claimPermissions: claim.claimPermissions,
    profile: claim.profileSnapshot,
    claimData: claim.claimSnapshot,
    hashedProfile: claim.hashedProfile,
    hashedClaim: claim.hashedClaim,
    zkProofHash: claim.zkProofHash,
    zkProofSummary: claim.zkProof
      ? { publicSignals: claim.zkProof.publicSignals, statement: claim.zkProof.statement }
      : null,
    checks: claim.checks || null,
    insuranceChecks: claim.insuranceChecks || null,
  };
}

function serializeClaimForRole(claim, role, patient) {
  return {
    id: claim.id,
    patientId: claim.patientId,
    status: claim.status,
    submittedAt: claim.submittedAt,
    hospitalVerified: claim.hospitalVerified,
    zkVerified: claim.zkVerified,
    proofHash: claim.zkProofHash,
    proofStatement: claim.zkProof?.statement || null,
    publicSignals: claim.zkProof?.publicSignals || [],
    checks: role === "hospital" ? claim.checks || null : claim.insuranceChecks || claim.checks || null,
    patientConsent: {
      profile: toRoleData(PROFILE_FIELDS, claim.hashedProfile, patient?.permissions || claim.profilePermissions, role),
      claim: toRoleData(CLAIM_FIELDS, claim.hashedClaim, claim.claimPermissions, role),
    },
    patientLabel: patient?.profile?.name || claim.patientId,
  };
}

// ─── ROUTES ─────────────────────────────────────────────────────────────────

app.get("/", (req, res) => res.send("Backend running"));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.post("/api/patient", async (req, res) => {
  try {
    const profile = {
      name: req.body.name || "",
      age: req.body.age || "",
      blood: req.body.blood || "",
      phone: req.body.phone || "",
      email: req.body.email || "",
      insuranceId: req.body.insuranceId || "",
      plan: req.body.plan || "",
      coverAmount: Number(req.body.coverAmount ?? req.body.coverageAmount ?? 500000) || 500000,
    };

    const patientData = {
      id: req.body.id,
      profile,
      permissions: buildPermissions(PROFILE_FIELDS, req.body.permissions, false),
      hashedProfile: buildHashedFields(PROFILE_FIELDS, profile),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    };

     const patient = await Patient.findOneAndUpdate(
       { id: req.body.id },
       patientData,
       { upsert: true, returnDocument: 'after' }
     );

    res.json({ success: true, patient: sanitizePatientForOwner(patient) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/patient/:id", async (req, res) => {
  try {
    const patient = await Patient.findOne({ id: req.params.id });
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json({ 
      ...sanitizePatientForOwner(patient), 
      isDeleted: patient.isDeleted 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/patient/claims/:id", async (req, res) => {
  try {
    const claims = await Claim.find({ patientId: req.params.id });
    res.json(claims.map(serializeClaimForPatient));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/claims", async (req, res) => {
  try {
    const patient = await Patient.findOne({ id: req.body.patientId });
    if (!patient) return res.status(404).json({ error: "Patient profile not found" });

    const claimSnapshot = {
      hospital: req.body.hospital || "",
      type: req.body.type || "",
      date: req.body.date || "",
      amount: Number(req.body.amount),
      description: req.body.description || "",
    };

    const claimData = {
      id: Date.now().toString(),
      patientId: req.body.patientId,
      ...claimSnapshot,
      coverAmount: patient.profile.coverAmount,
      profileSnapshot: { ...patient.profile },
      hashedProfile: buildHashedFields(PROFILE_FIELDS, patient.profile),
      profilePermissions: buildPermissions(PROFILE_FIELDS, req.body.profilePermissions || patient.permissions, false),
      claimSnapshot,
      hashedClaim: buildHashedFields(CLAIM_FIELDS, claimSnapshot),
      claimPermissions: buildPermissions(CLAIM_FIELDS, req.body.claimPermissions, false),
      status: "Pending",
      hospitalVerified: false,
      zkVerified: false,
      zkProofHash: null,
      zkProof: null,
      submittedAt: new Date().toISOString(),
    };

    try {
      const zkPacket = await generateProof(claimData);
      claimData.zkProof = {
        proof: zkPacket.proof,
        publicSignals: zkPacket.publicSignals,
        statement: zkPacket.statement,
      };
      claimData.zkProofHash = zkPacket.proofHash;

      // --- AUTOMATIC VERIFICATION START ---
      const zkValid = await verifyProof(claimData.zkProof);
      const zkChecks = extractChecksFromProof(claimData.zkProof);
      const noDup = await hasNoDuplicate(claimData);

      const checks = {
        zkVerified: zkValid,
        hospitalVerified: true, // Automated
        amountWithinLimit: zkChecks?.amountWithinLimit ?? false,
        treatmentCovered: zkChecks?.treatmentCovered ?? false,
        withinTimeLimit: zkChecks?.withinTimeLimit ?? false,
        noDuplicate: noDup,
      };

      const autoDecision = Object.values(checks).every(Boolean) ? "Approved" : "Rejected";

      claimData.zkVerified = zkValid;
      claimData.hospitalVerified = true;
      claimData.checks = checks;
      claimData.autoDecision = autoDecision;
      claimData.status = autoDecision;
      // --- AUTOMATIC VERIFICATION END ---

    } catch (error) {
      console.error("Failed to generate or verify proof:", error.message);
    }

    const claim = await Claim.create(claimData);
    res.json({ success: true, claim: serializeClaimForPatient(claim) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/hospital/claims", async (req, res) => {
  try {
    const claims = await Claim.find({ isDeleted: { $ne: true } });
    const result = await Promise.all(claims.map(async (claim) => {
      const patient = await Patient.findOne({ id: claim.patientId });
      return serializeClaimForRole(claim, "hospital", patient);
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/hospital/verify/:id", async (req, res) => {
  try {
    const claim = await Claim.findOne({ id: req.params.id });
    if (!claim) return res.status(404).json({ error: "Claim not found" });

    const patient = await Patient.findOne({ id: claim.patientId });
    const zkValid = await verifyProof(claim.zkProof);
    const zkChecks = extractChecksFromProof(claim.zkProof);

    const checks = {
      zkVerified: zkValid,
      hospitalVerified: true,
      amountWithinLimit: zkChecks?.amountWithinLimit ?? false,
      treatmentCovered: zkChecks?.treatmentCovered ?? false,
      withinTimeLimit: zkChecks?.withinTimeLimit ?? false,
      noDuplicate: await hasNoDuplicate(claim),
    };

    const autoDecision = Object.values(checks).every(Boolean) ? "Approved" : "Rejected";

    await Claim.findOneAndUpdate({ id: req.params.id }, {
      zkVerified: zkValid,
      hospitalVerified: true,
      checks,
      autoDecision,
      status: autoDecision,
    });

    const updatedClaim = await Claim.findOne({ id: req.params.id });
    res.json({ success: true, claim: serializeClaimForRole(updatedClaim, "hospital", patient), checks, autoDecision });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/insurance/claims", async (req, res) => {
  try {
    const claims = await Claim.find({ isDeleted: { $ne: true } });
    const result = await Promise.all(claims.map(async (claim) => {
      const patient = await Patient.findOne({ id: claim.patientId });
      return serializeClaimForRole(claim, "insurance", patient);
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/insurance/verify/:id", async (req, res) => {
  try {
    const claim = await Claim.findOne({ id: req.params.id });
    if (!claim) return res.status(404).json({ error: "Claim not found" });

    const patient = await Patient.findOne({ id: claim.patientId });
    const zkValid = await verifyProof(claim.zkProof);
    const zkChecks = extractChecksFromProof(claim.zkProof);

    const checks = {
      hospitalVerified: claim.hospitalVerified === true,
      zkValid,
      amountWithinLimit: zkChecks?.amountWithinLimit ?? false,
      treatmentCovered: zkChecks?.treatmentCovered ?? false,
      withinTimeLimit: zkChecks?.withinTimeLimit ?? false,
      noDuplicate: await hasNoDuplicate(claim),
    };

    const autoDecision = Object.values(checks).every(Boolean) ? "Approved" : "Rejected";

    await Claim.findOneAndUpdate({ id: req.params.id }, {
      zkVerified: zkValid,
      insuranceChecks: checks,
      status: autoDecision,
    });

    const updatedClaim = await Claim.findOne({ id: req.params.id });
    res.json({ success: true, claim: serializeClaimForRole(updatedClaim, "insurance", patient), checks, autoDecision });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/debug/proof/:id", async (req, res) => {
  try {
    const claim = await Claim.findOne({ id: req.params.id });
    if (!claim) return res.status(404).json({ error: "Claim not found" });
    if (!claim.zkProof) return res.json({ hasProof: false });

    const valid = await verifyProof(claim.zkProof);
    res.json({
      hasProof: true,
      proofHash: claim.zkProofHash,
      publicSignals: claim.zkProof.publicSignals,
      statement: claim.zkProof.statement,
      isValid: valid,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/claims/permissions/:id", async (req, res) => {
  try {
    const { permissions } = req.body;
     const claim = await Claim.findOneAndUpdate(
       { id: req.params.id },
       { claimPermissions: permissions },
       { returnDocument: 'after' }
     );
    if (!claim) return res.status(404).json({ error: "Claim not found" });
    res.json({ success: true, claim: serializeClaimForPatient(claim) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/patient/:id", async (req, res) => {
  try {
     const patient = await Patient.findOneAndUpdate(
       { id: req.params.id },
       { isDeleted: true },
       { returnDocument: 'after' }
     );
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json({ success: true, message: "Profile deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/patient/recover/:id", async (req, res) => {
  try {
     const patient = await Patient.findOneAndUpdate(
       { id: req.params.id },
       { isDeleted: false },
       { returnDocument: 'after' }
     );
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json({ success: true, message: "Profile recovered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/claims/:id", async (req, res) => {
  try {
     const claim = await Claim.findOneAndUpdate({ id: req.params.id }, { isDeleted: true }, { returnDocument: 'after' });
    if (!claim) return res.status(404).json({ error: "Claim not found" });
    res.json({ success: true, message: "Claim deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/claims/recover/:id", async (req, res) => {
  try {
     const claim = await Claim.findOneAndUpdate({ id: req.params.id }, { isDeleted: false }, { returnDocument: 'after' });
    if (!claim) return res.status(404).json({ error: "Claim not found" });
    res.json({ success: true, message: "Claim recovered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── START ───────────────────────────────────────────────────────────────────

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected!");
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Backend running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  });