import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ChangePasswordModal from "./ChangePasswordModal";

function getUserRole() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role;
  } catch {
    return null;
  }
}

function getUsername() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || payload.username;
  } catch {
    return null;
  }
}

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = getUserRole();
  const username = getUsername();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const isViewer = role === "VIEWER";

  return (
    <>
      <header className="top-nav">
        <div className="nav-brand">
          <Link to="/dashboard" className="brand-link">
            <span className="brand-icon">🏛️</span>
            <div className="brand-text">
              <strong>MoSPI PAIMANA</strong>
              <span className="brand-sub">Infrastructure Monitoring Portal</span>
            </div>
          </Link>
        </div>

        <nav className="nav-links">
          <Link
            to="/dashboard"
            className={`nav-link ${location.pathname === "/dashboard" ? "active" : ""}`}
          >
            Dashboard
          </Link>
          <Link
            to="/projects"
            className={`nav-link ${location.pathname.startsWith("/projects") ? "active" : ""}`}
          >
            Projects
          </Link>
          {/* Internal Alerts are strictly hidden from Viewer */}
          {!isViewer && (
            <Link
              to="/alerts"
              className={`nav-link ${location.pathname === "/alerts" ? "active" : ""}`}
            >
              Alerts
            </Link>
          )}
        </nav>

        <div className="nav-actions">
          {username && (
            <span className="nav-user-label" title={username}>
              👤 {username}
            </span>
          )}
          {role && (
            <span className={`role-pill role-${role.toLowerCase()}`}>
              {role}
            </span>
          )}
          <button
            onClick={() => setShowPasswordModal(true)}
            className="btn-change-pass"
            title="Change your account password"
          >
            🔑 Change Password
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </>
  );
}

export default Navbar;
