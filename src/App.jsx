import { useEffect, useState } from "react";
import {
  Link,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Projects from "./pages/Projects";
import Alerts from "./pages/Alerts";
import ProjectDetails from "./pages/ProjectDetails";
import Login from "./pages/Login";
import CreateProject from "./pages/CreateProject";
import ResetPassword from "./pages/ResetPassword";

import "./App.css";

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

function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const isViewer = role === "VIEWER";
  const isAdmin = role === "ADMIN";
  const isOfficer = role === "OFFICER";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setRole(getUserRole());

    Promise.all([
      fetch("https://infrastructure-monitoring-system-0yjf.onrender.com/api/dashboard/summary", {
        headers: { Authorization: "Bearer " + token }
      }).then((res) => (res.ok ? res.json() : null)),
      fetch("https://infrastructure-monitoring-system-0yjf.onrender.com/api/dashboard/projects", {
        headers: { Authorization: "Bearer " + token }
      }).then((res) => (res.ok ? res.json() : []))
    ])
      .then(([summaryData, projectsData]) => {
        setSummary(summaryData);
        setProjects(projectsData || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [navigate]);

  if (loading || !summary) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading dashboard overview...</div>
      </div>
    );
  }

  const getRiskClass = (band) => {
    switch (band?.toUpperCase()) {
      case "HIGH":
        return "badge-risk-high";
      case "MEDIUM":
        return "badge-risk-medium";
      case "LOW":
        return "badge-risk-low";
      default:
        return "badge-risk-unknown";
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2>
            {isOfficer ? "Officer Management Dashboard" : "Executive Portfolio Overview"}
          </h2>
          <p className="page-sub">
            {isViewer
              ? "Citizen Transparency Portal • Ministry of Statistics and Programme Implementation"
              : "Government of India • Ministry of Statistics and Programme Implementation (MoSPI)"}
          </p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate("/projects")} className="btn-secondary">
            View All Projects →
          </button>
          {isAdmin && (
            <button onClick={() => navigate("/create-project")} className="btn-primary">
              + Create Project
            </button>
          )}
        </div>
      </div>

      {/* Viewer Welcome Notice */}
      {isViewer && (
        <div className="viewer-info-banner mb-4">
          <span className="viewer-banner-icon">👁️</span>
          <div>
            <strong>Citizen Transparency View:</strong> Welcome to the public monitoring portal. View overall project health, physical completion milestones, and capital utilization across sectors.
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <section className="summary-cards">
        <div
          className="card"
          onClick={() => navigate("/projects")}
          style={{ cursor: "pointer" }}
        >
          <h3>Total Projects</h3>
          <p className="number">{summary.totalProjects || 0}</p>
          <span className="card-hint">Tracked via PAIMANA</span>
        </div>

        <div
          className="card delayed"
          onClick={() => navigate("/projects")}
          style={{ cursor: "pointer" }}
        >
          <h3>Delayed Projects</h3>
          <p className="number">{summary.delayedProjects || 0}</p>
          <span className="card-hint">Physical progress lagging</span>
        </div>

        {/* Sensitive KPI Cards strictly hidden from Viewer */}
        {!isViewer ? (
          <>
            <div
              className="card risk"
              onClick={() => navigate("/projects")}
              style={{ cursor: "pointer" }}
            >
              <h3>High Risk Projects</h3>
              <p className="number">{summary.highRiskProjects || 0}</p>
              <span className="card-hint">Predicted by AI / Risk Rules</span>
            </div>

            <div
              className="card alert"
              onClick={() => navigate("/alerts")}
              style={{ cursor: "pointer" }}
            >
              <h3>Active Alerts</h3>
              <p className="number">{summary.activeAlerts || 0}</p>
              <span className="card-hint">Requires immediate action</span>
            </div>
          </>
        ) : (
          <div
            className="card"
            onClick={() => navigate("/projects")}
            style={{ cursor: "pointer" }}
          >
            <h3>Total Capital Allocated</h3>
            <p className="number">
              ₹{Number(summary.totalExpenditure || 0).toLocaleString()} Cr
            </p>
            <span className="card-hint">Central & State budget</span>
          </div>
        )}
      </section>

      {/* Recent Projects Table Preview */}
      <section className="projects-section mt-4">
        <div className="section-header">
          <div>
            <h3>Monitored Projects Snapshot</h3>
            <p className="page-sub">
              Quick view of high-priority infrastructure investments
            </p>
          </div>
          <Link to="/projects" className="btn-link">
            Open Full Projects Catalog ({projects.length}) →
          </Link>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Physical Progress</th>
                <th>Status</th>
                {!isViewer && <th>Risk Band</th>}
                {!isViewer && <th>Active Alerts</th>}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {projects.slice(0, 10).map((project) => (
                <tr key={project.projectId}>
                  <td>
                    <Link
                      to={"/projects/" + project.projectId}
                      className="project-link"
                    >
                      <strong>{project.projectName}</strong>
                    </Link>
                  </td>
                  <td>
                    <div className="progress-cell">
                      <span>
                        {project.actualProgress ?? 0}% / {project.plannedProgress ?? 0}%
                      </span>
                      <div className="progress-bar-bg">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${Math.min(100, project.actualProgress || 0)}%`
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        project.status === "DELAYED"
                          ? "badge-status-delayed"
                          : "badge-status-ontrack"
                      }`}
                    >
                      {project.status}
                    </span>
                  </td>

                  {!isViewer && (
                    <td>
                      <span className={`badge ${getRiskClass(project.riskBand)}`}>
                        {project.riskBand}
                      </span>
                    </td>
                  )}

                  {!isViewer && (
                    <td>
                      {project.activeAlerts > 0 ? (
                        <span className="badge-alert-count">
                          ⚠ {project.activeAlerts}
                        </span>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
                    </td>
                  )}

                  <td>
                    <button
                      onClick={() => navigate("/projects/" + project.projectId)}
                      className="btn-sm btn-outline"
                    >
                      Details →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Layout({ children }) {
  const location = useLocation();
  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/reset-password" ||
    location.pathname === "/setup-officer";

  return (
    <div className="app-layout">
      {!isAuthPage && <Navbar />}
      <main className="main-content">{children}</main>
    </div>
  );
}

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/setup-officer" element={<ResetPassword isOfficerSetup={true} />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/create-project" element={<CreateProject />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
