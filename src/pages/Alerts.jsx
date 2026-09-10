import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

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

function Alerts() {
  const role = getUserRole();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("active"); // "active", "resolved", "all"
  const [severityFilter, setSeverityFilter] = useState("ALL"); // "ALL", "HIGH", "MEDIUM", "LOW"

  useEffect(() => {
    loadAlerts();
  }, [statusFilter]);

  const loadAlerts = () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    let url = "https://infrastructure-monitoring-system-0yjf.onrender.com/api/alerts";
    if (statusFilter === "active") {
      url += "?resolved=false";
    } else if (statusFilter === "resolved") {
      url += "?resolved=true";
    }

    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Failed to load alerts");
        }
        return res.json();
      })
      .then(data => {
        setAlerts(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  const handleResolveAlert = (alertId) => {
    const token = localStorage.getItem("token");

    fetch(`https://infrastructure-monitoring-system-0yjf.onrender.com/api/alerts/${alertId}/resolve`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Failed to resolve alert");
        }
        return res.json();
      })
      .then(resolvedAlert => {
        setSuccessMessage(`Alert #${alertId} marked as resolved.`);
        setTimeout(() => setSuccessMessage(""), 4000);

        // Update list
        setAlerts(prev =>
          prev.map(a => (a.id === alertId ? resolvedAlert : a))
        );
      })
      .catch(err => {
        setError(err.message);
      });
  };

  // Filter alerts by severity
  const filteredAlerts = alerts.filter(a => {
    if (severityFilter === "ALL") return true;
    return a.severity && a.severity.toUpperCase() === severityFilter;
  });

  const getSeverityClass = (severity) => {
    switch (severity?.toUpperCase()) {
      case "HIGH":
      case "CRITICAL":
        return "badge-severity-high";
      case "MEDIUM":
        return "badge-severity-medium";
      case "LOW":
        return "badge-severity-low";
      default:
        return "badge-severity-default";
    }
  };

  const canResolve = role === "ADMIN" || role === "OFFICER";

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>Early Warning & Governance Alerts</h2>
          <p className="page-sub">
            Track automated triggers on schedule delays, expenditure spikes, and risk transitions
          </p>
        </div>
        <button onClick={loadAlerts} className="btn-secondary">
          ↻ Refresh Alerts
        </button>
      </div>

      {successMessage && (
        <div className="alert-banner success">{successMessage}</div>
      )}
      {error && (
        <div className="alert-banner error">{error}</div>
      )}

      {/* Filter Tabs & Severity Dropdown */}
      <div className="filter-card">
        <div className="tab-group">
          <button
            className={`tab-btn ${statusFilter === "active" ? "active" : ""}`}
            onClick={() => setStatusFilter("active")}
          >
            Active Alerts
          </button>
          <button
            className={`tab-btn ${statusFilter === "resolved" ? "active" : ""}`}
            onClick={() => setStatusFilter("resolved")}
          >
            Resolved History
          </button>
          <button
            className={`tab-btn ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All Alerts
          </button>
        </div>

        <div className="filter-group">
          <span className="filter-label">Severity:</span>
          {["ALL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
            <button
              key={sev}
              className={`filter-pill ${severityFilter === sev ? "active" : ""}`}
              onClick={() => setSeverityFilter(sev)}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      <div className="results-summary">
        Showing <strong>{filteredAlerts.length}</strong> alerts
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="loading-state">Loading alerts...</div>
      ) : filteredAlerts.length === 0 ? (
        <div className="empty-state">
          <h3>No {statusFilter !== "all" ? statusFilter : ""} alerts found</h3>
          <p>Projects are currently running within monitored warning thresholds.</p>
        </div>
      ) : (
        <div className="alerts-list">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`alert-card ${alert.resolved ? "alert-card-resolved" : "alert-card-active"}`}
            >
              <div className="alert-card-header">
                <div className="alert-header-left">
                  <span className={`badge ${getSeverityClass(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <Link
                    to={`/projects/${alert.projectId}`}
                    className="alert-project-title"
                  >
                    {alert.projectName || `Project #${alert.projectId}`}
                  </Link>
                </div>
                <div className="alert-header-right">
                  <span className="alert-timestamp">
                    {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : "Recently"}
                  </span>
                  {alert.resolved ? (
                    <span className="badge badge-resolved">✓ Resolved</span>
                  ) : (
                    <span className="badge badge-active">Active</span>
                  )}
                </div>
              </div>

              <div className="alert-card-body">
                <p className="alert-message">{alert.message}</p>
              </div>

              <div className="alert-card-footer">
                <div className="alert-footer-left">
                  {alert.resolved && alert.resolvedAt && (
                    <span className="subtext">
                      Resolved on: {new Date(alert.resolvedAt).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="alert-footer-actions">
                  <Link
                    to={`/projects/${alert.projectId}`}
                    className="btn-sm btn-outline"
                  >
                    View Project →
                  </Link>
                  {!alert.resolved && canResolve && (
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="btn-sm btn-success"
                    >
                      ✓ Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Alerts;
