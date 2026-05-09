import { useEffect, useState } from "react";

function HospitalDashboard() {
  const [claims, setClaims] = useState([]);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    const res = await fetch("http://localhost:3001/api/claims");
    const data = await res.json();
    setClaims(data);
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Hospital Dashboard</h1>

      <div style={{ display: "grid", gap: "20px" }}>
        {claims.map((claim) => (
          <div key={claim.id} style={{
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            background: "#fff"
          }}>
            <h3>{claim.patientName}</h3>
            <button style={{
              marginTop: "10px",
              padding: "8px 16px",
              background: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}>
              Verify Claim
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HospitalDashboard;
