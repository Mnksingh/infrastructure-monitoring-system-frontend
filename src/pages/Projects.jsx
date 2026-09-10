import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

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

function Projects() {
  const navigate = useNavigate();
  const role = getUserRole();
  const isViewer = role === "VIEWER";
  const isAdmin = role === "ADMIN";
  const isOfficer = role === "OFFICER";

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Deletion modal state (Admin only)
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Search, filter, and sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("ALL");
  const [selectedSector, setSelectedSector] = useState("ALL");
  const [selectedMinistry, setSelectedMinistry] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedRisk, setSelectedRisk] = useState("ALL");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    fetch("https://infrastructure-monitoring-system-0yjf.onrender.com/api/projects", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load projects");
        }
        return res.json();
      })
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  const handleDeleteProject = (projectId) => {
    setDeleting(true);
    setDeleteError("");
    const token = localStorage.getItem("token");

    fetch(`https://infrastructure-monitoring-system-0yjf.onrender.com/api/projects/${projectId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to delete project. Ensure you have administrator privileges.");
        }
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        setProjectToDelete(null);
        setSuccessMessage("Project deleted successfully.");
        setTimeout(() => setSuccessMessage(""), 5000);
      })
      .catch((err) => {
        setDeleteError(err.message);
      })
      .finally(() => {
        setDeleting(false);
      });
  };

  // Extract unique filter lists from loaded data
  const states = Array.from(new Set(projects.map((p) => p.state).filter(Boolean))).sort();
  const sectors = Array.from(new Set(projects.map((p) => p.sector).filter(Boolean))).sort();
  const ministries = Array.from(new Set(projects.map((p) => p.ministryName).filter(Boolean))).sort();
  const statuses = Array.from(new Set(projects.map((p) => p.currentStatus).filter(Boolean))).sort();

  // Filter logic
  const filteredProjects = projects.filter((p) => {
    // 1. Search filter
    const matchesSearch =
      !searchTerm ||
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.implementingAgency?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ministryName?.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. State filter
    const matchesState =
      selectedState === "ALL" || (p.state && p.state.toUpperCase() === selectedState.toUpperCase());

    // 3. Sector / Infrastructure Type filter
    const matchesSector =
      selectedSector === "ALL" || (p.sector && p.sector.toUpperCase() === selectedSector.toUpperCase());

    // 4. Ministry filter
    const matchesMinistry =
      selectedMinistry === "ALL" || (p.ministryName && p.ministryName.toUpperCase() === selectedMinistry.toUpperCase());

    // 5. Status filter
    const matchesStatus =
      selectedStatus === "ALL" || (p.currentStatus && p.currentStatus.toUpperCase() === selectedStatus.toUpperCase());

    // 6. Risk filter (Officer/Admin only)
    const matchesRisk =
      isViewer ||
      selectedRisk === "ALL" ||
      (p.latestRiskBand && p.latestRiskBand.toUpperCase() === selectedRisk.toUpperCase());

    return (
      matchesSearch &&
      matchesState &&
      matchesSector &&
      matchesMinistry &&
      matchesStatus &&
      matchesRisk
    );
  });

  // Sort logic
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "name") {
      comparison = (a.name || "").localeCompare(b.name || "");
    } else if (sortBy === "progress") {
      comparison = (a.latestProgressPct || 0) - (b.latestProgressPct || 0);
    } else if (sortBy === "cost") {
      comparison = (a.revisedCost || a.originalCost || 0) - (b.revisedCost || b.originalCost || 0);
    } else if (sortBy === "status") {
      comparison = (a.currentStatus || "").localeCompare(b.currentStatus || "");
    } else if (sortBy === "state") {
      comparison = (a.state || "").localeCompare(b.state || "");
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const getRiskBadgeClass = (band) => {
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

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedState("ALL");
    setSelectedSector("ALL");
    setSelectedMinistry("ALL");
    setSelectedStatus("ALL");
    setSelectedRisk("ALL");
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>
            {isOfficer ? "My Assigned Infrastructure Projects" : "National Infrastructure Projects Catalog"}
          </h2>
          <p className="page-sub">
            {isViewer
              ? "Citizen Transparency View • Ministry of Statistics and Programme Implementation"
              : "MoSPI PAIMANA • Central Portfolio Monitoring"}
          </p>
        </div>
        <div className="header-actions">
          {isAdmin && (
            <button
              onClick={() => navigate("/create-project")}
              className="btn-primary"
            >
              + Create New Project
            </button>
          )}
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="auth-alert alert-success mb-3">{successMessage}</div>
      )}

      {/* Error Message */}
      {error && <div className="auth-alert alert-error mb-3">{error}</div>}

      {/* Viewer Notice Pill */}
      {isViewer && (
        <div className="viewer-info-banner mb-3">
          <span className="viewer-banner-icon">👁️</span>
          <div>
            <strong>Public Viewer Portal:</strong> You are viewing verified infrastructure investment data, timeline metrics, and physical progress reports.
          </div>
        </div>
      )}

      {/* 4 Core Dropdown Filters + Search Bar */}
      <div className="filter-panel-card mb-4">
        <div className="filter-search-row">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by project name, agency, state, or ministry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-field"
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchTerm("")}
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={resetFilters}
          >
            Reset Filters
          </button>
        </div>

        <div className="filter-dropdowns-grid mt-3">
          {/* 1. State Filter */}
          <div className="filter-control">
            <label>State / Region</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
            >
              <option value="ALL">All States & UTs</option>
              {states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Infrastructure Type / Sector Filter */}
          <div className="filter-control">
            <label>Infrastructure Type</label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
            >
              <option value="ALL">All Sectors</option>
              {sectors.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Ministry Filter */}
          <div className="filter-control">
            <label>Ministry</label>
            <select
              value={selectedMinistry}
              onChange={(e) => setSelectedMinistry(e.target.value)}
            >
              <option value="ALL">All Ministries</option>
              {ministries.map((min) => (
                <option key={min} value={min}>
                  {min}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Status Filter */}
          <div className="filter-control">
            <label>Project Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Risk Band Filter (Admin / Officer Only) */}
          {!isViewer && (
            <div className="filter-control">
              <label>AI Risk Band</label>
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
              >
                <option value="ALL">All Risk Levels</option>
                <option value="HIGH">HIGH Risk</option>
                <option value="MEDIUM">MEDIUM Risk</option>
                <option value="LOW">LOW Risk</option>
              </select>
            </div>
          )}

          {/* Sort By */}
          <div className="filter-control">
            <label>Sort By</label>
            <div className="flex-row gap-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Name</option>
                <option value="progress">Physical Progress</option>
                <option value="cost">Sanctioned Cost</option>
                <option value="status">Status</option>
                <option value="state">State</option>
              </select>
              <button
                type="button"
                className="btn-sort-toggle"
                onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
              >
                {sortOrder === "asc" ? "▲" : "▼"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Table & Catalog */}
      <div className="table-responsive">
        {loading ? (
          <div className="loading-state">Loading infrastructure projects...</div>
        ) : sortedProjects.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">📂</div>
            <h3>No matching projects found</h3>
            <p>Try adjusting your search criteria or resetting filters.</p>
            <button
              type="button"
              className="btn-secondary mt-2"
              onClick={resetFilters}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Ministry & Sector</th>
                <th>State</th>
                <th>Agency</th>
                <th>Cost (₹ Cr)</th>
                <th>Physical Progress</th>
                <th>Status</th>
                {/* Sensitive fields hidden from Viewer */}
                {!isViewer && <th>Risk Band</th>}
                {!isViewer && <th>Alerts</th>}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedProjects.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/projects/${p.id}`} className="project-link">
                      <strong>{p.name}</strong>
                    </Link>
                    {p.officerUsername && !isViewer && (
                      <div className="text-muted text-xs">
                        Officer: {p.officerUsername}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="ministry-cell">
                      <span>{p.ministryName || "Central Ministry"}</span>
                      {p.sector && <span className="sector-tag">{p.sector}</span>}
                    </div>
                  </td>
                  <td>{p.state || "National"}</td>
                  <td>
                    <span className="agency-pill">{p.implementingAgency || "Central Agency"}</span>
                  </td>
                  <td>
                    <div className="cost-cell">
                      <strong>₹{Number(p.revisedCost || p.originalCost || 0).toLocaleString()}</strong>
                      {p.revisedCost && p.revisedCost !== p.originalCost && (
                        <span className="text-xs text-muted">
                          (Orig: ₹{Number(p.originalCost).toLocaleString()})
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="progress-cell">
                      <span>{p.latestProgressPct ?? 0}%</span>
                      <div className="progress-bar-bg">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${Math.min(100, Math.max(0, p.latestProgressPct || 0))}%`
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        p.currentStatus === "DELAYED"
                          ? "badge-status-delayed"
                          : p.currentStatus === "COMPLETED"
                          ? "badge-status-completed"
                          : "badge-status-ontrack"
                      }`}
                    >
                      {p.currentStatus || "ON_TRACK"}
                    </span>
                  </td>

                  {/* Sensitive Columns for Officers / Admins only */}
                  {!isViewer && (
                    <td>
                      <span className={`badge ${getRiskBadgeClass(p.latestRiskBand)}`}>
                        {p.latestRiskBand || "UNKNOWN"}
                      </span>
                    </td>
                  )}

                  {!isViewer && (
                    <td>
                      {p.activeAlertsCount > 0 ? (
                        <span className="badge-alert-count">
                          ⚠ {p.activeAlertsCount}
                        </span>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
                    </td>
                  )}

                  <td>
                    <div className="action-buttons-cell">
                      <button
                        onClick={() => navigate(`/projects/${p.id}`)}
                        className="btn-sm btn-outline"
                      >
                        Details →
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => setProjectToDelete(p)}
                          className="btn-sm btn-danger-icon"
                          title="Delete Project"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Modal (Admin only) */}
      {projectToDelete && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Confirm Project Deletion</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setProjectToDelete(null)}
              >
                ✕
              </button>
            </div>
            {deleteError && (
              <div className="auth-alert alert-error">{deleteError}</div>
            )}
            <p className="mt-2">
              Are you sure you want to permanently delete project:
              <br />
              <strong>{projectToDelete.name}</strong> (ID: {projectToDelete.id})?
            </p>
            <p className="text-danger text-sm mt-1">
              ⚠️ This will remove all associated milestones, financial records, alerts, and risk assessments.
            </p>
            <div className="modal-actions mt-4">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setProjectToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => handleDeleteProject(projectToDelete.id)}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;
