const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const snarkjs = require("snarkjs");

const WASM_PATH = path.join(__dirname, "claim_js", "claim.wasm");
const ZKEY_PATH = path.join(__dirname, "circuits", "claim_final.zkey");
const VK_PATH = path.join(__dirname, "circuits", "verification_key.json");

let verificationKeyCache;

const TREATMENT_CODES = {
  surgery: 1,
  consultation: 2,
  hospitalization: 3,
  emergency: 4,
  diagnostic: 5,
  pharmacy: 6,
  lab: 7,
  radiology: 8,
  physiotherapy: 9,
  dental: 10,
  maternity: 11,
  "mental health": 12,
  rehabilitation: 13,
};

function ensureArtifactsExist() {
  const required = [WASM_PATH, ZKEY_PATH, VK_PATH];
  for (const target of required) {
    if (!fs.existsSync(target)) {
      throw new Error(`Missing ZKP artifact: ${target}`);
    }
  }
}

function loadVerificationKey() {
  if (!verificationKeyCache) {
    ensureArtifactsExist();
    verificationKeyCache = JSON.parse(fs.readFileSync(VK_PATH, "utf8"));
  }
  return verificationKeyCache;
}

function getTreatmentCode(type) {
  const normalized = (type || "").toLowerCase().trim();
  for (const [key, code] of Object.entries(TREATMENT_CODES)) {
    if (normalized.includes(key)) return code;
  }
  return 0; // invalid = circuit mein treatmentValid = 0
}

function getDaysDiff(claimDate, submittedAt) {
  const treatment = new Date(claimDate);
  const submitted = new Date(submittedAt);
  const diff = Math.floor((submitted - treatment) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 999; // future date = invalid, circuit mein timeValid = 0
  return diff;
}

function makeProofHash(claimId, publicSignals) {
  const payload = `${claimId}:${JSON.stringify(publicSignals)}`;
  return `ZK-${crypto.createHash("sha256").update(payload).digest("hex").slice(0, 16).toUpperCase()}`;
}

async function generateProof(claim) {
  ensureArtifactsExist();

  const input = {
    amount: Math.trunc(Number(claim.amount)),
    coverAmount: Math.trunc(Number(claim.coverAmount || 500000)),
    treatmentCode: getTreatmentCode(claim.type),
    daysDiff: getDaysDiff(claim.date, claim.submittedAt),
  };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, WASM_PATH, ZKEY_PATH);

  // publicSignals = [amountValid, treatmentValid, timeValid, allValid]
  const [amountValid, treatmentValid, timeValid, allValid] = publicSignals.map(String);

  return {
    proof,
    publicSignals,
    statement: {
      amountWithinLimit: amountValid === "1",
      treatmentCovered: treatmentValid === "1",
      withinTimeLimit: timeValid === "1",
      allValid: allValid === "1",
    },
    proofHash: makeProofHash(claim.id, publicSignals),
  };
}

async function verifyProof(zkProofPacket) {
  if (!zkProofPacket?.proof || !zkProofPacket?.publicSignals) return false;

  const verificationKey = loadVerificationKey();
  const cryptographicCheck = await snarkjs.groth16.verify(
    verificationKey,
    zkProofPacket.publicSignals,
    zkProofPacket.proof
  );

  const allValid = String(zkProofPacket.publicSignals[3] ?? "0");
  return cryptographicCheck && allValid === "1";
}

function extractChecksFromProof(zkProof) {
  if (!zkProof?.publicSignals) return null;
  const [amountValid, treatmentValid, timeValid, allValid] = zkProof.publicSignals.map(String);
  return {
    amountWithinLimit: amountValid === "1",
    treatmentCovered: treatmentValid === "1",
    withinTimeLimit: timeValid === "1",
    allValid: allValid === "1",
  };
}

module.exports = { generateProof, verifyProof, extractChecksFromProof };