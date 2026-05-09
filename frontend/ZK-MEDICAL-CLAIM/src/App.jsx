import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import PatientDashboard from "./pages/PatientDashboard";
import HospitalDashboard from "./pages/HospitalDashboard";
import InsuranceDashboard from "./pages/InsuranceDashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/patient" element={<PatientDashboard />} />
      <Route path="/hospital" element={<HospitalDashboard />} />
      <Route path="/insurance" element={<InsuranceDashboard />} />
    </Routes>
  );
}
export default App;
