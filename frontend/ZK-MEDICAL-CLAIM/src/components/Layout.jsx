import { Link, useLocation } from "react-router-dom";

function Layout({ children, role }) {
  const location = useLocation();

  const linkClass = (path) =>
    `block hover:text-blue-400 ${
      location.pathname === path ? "text-blue-400 font-semibold" : ""
    }`;

  return (
    <div className="flex min-h-screen">
      
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-6">
        <h2 className="text-xl font-bold mb-6">ZK Medical</h2>

        <ul className="space-y-3">

          {/* Dashboard */}
          <li>
            <Link to={`/${role}`} className={linkClass(`/${role}`)}>
              Dashboard
            </Link>
          </li>

          {/* PATIENT */}
          {role === "patient" && (
            <>
              <li>
                <Link to="/patient/submit" className={linkClass("/patient/submit")}>
                  Submit Claim
                </Link>
              </li>
              <li>
                <Link to="/patient/history" className={linkClass("/patient/history")}>
                  History
                </Link>
              </li>
            </>
          )}

          {/* HOSPITAL */}
          {role === "hospital" && (
            <li>
              <Link to="/hospital/claims" className={linkClass("/hospital/claims")}>
                Patient Claims
              </Link>
            </li>
          )}

          {/* INSURANCE */}
          {role === "insurance" && (
            <>
              <li>
                <Link to="/insurance/claims" className={linkClass("/insurance/claims")}>
                  All Claims
                </Link>
              </li>
              <li>
                <Link to="/insurance/approve" className={linkClass("/insurance/approve")}>
                  Approve / Reject
                </Link>
              </li>
            </>
          )}

        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-100 p-10">{children}</div>
    </div>
  );
}

export default Layout;
