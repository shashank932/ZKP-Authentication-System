const BASE_URL = import.meta.env.VITE_API_URL || 'https://zkp-backend.vercel.app/api';

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, options);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Request failed");
  }
  return response.json();
}

export function getPatient(patientId) {
  return request(`/patient/${patientId}`);
}

export function deletePatient(patientId) {
  return request(`/patient/${patientId}`, {
    method: "DELETE",
  });
}

export function recoverPatient(patientId) {
  return request(`/patient/recover/${patientId}`, {
    method: "POST",
  });
}

export function savePatient(patientData) {
  return request("/patient", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patientData),
  });
}

export function getClaims(patientId) {
  return request(`/patient/claims/${patientId}`);
}

export function deleteClaim(claimId) {
  return request(`/claims/${claimId}`, {
    method: "DELETE",
  });
}

export function permanentDeleteClaim(claimId) {
  return request(`/claims/permanent/${claimId}`, {
    method: "DELETE",
  });
}

export function recoverClaim(claimId) {
  return request(`/claims/recover/${claimId}`, {
    method: "POST",
  });
}

export function submitClaim(claimData) {
  return request("/claims", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(claimData),
  });
}

export function updateClaimPermissions(claimId, permissions) {
  return request(`/claims/permissions/${claimId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ permissions }),
  });
}

export function updateClaim(claimId, claimData) {
  return request(`/claims/${claimId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(claimData),
  });
}

export function getHospitalClaims() {

  return request("/hospital/claims");
}

export function verifyHospitalClaim(claimId) {
  return request(`/hospital/verify/${claimId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}

export function getInsuranceClaims() {
  return request("/insurance/claims");
}

export function verifyInsuranceClaim(claimId) {
  return request(`/insurance/verify/${claimId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}
