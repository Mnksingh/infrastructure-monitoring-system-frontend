import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { PhysicalProgressTrendChart, FinancialExpenditureTrendChart } from "../components/TrendCharts";

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

function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Edit project info
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  // Sub-resource modals/forms
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    reportedDate: new Date().toISOString().split("T")[0],
    plannedPhysicalProgressPct: "",
    actualPhysicalProgressPct: "",
    remarks: ""
  });

  const [showFinancialForm, setShowFinancialForm] = useState(false);
  const [financialForm, setFinancialForm] = useState({
    reportedDate: new Date().toISOString().split("T")[0],
    cumulativeExpenditure: "",
    plannedExpenditureToDate: "",
    newExpenditure: ""
  });

  const [refreshingRisk, setRefreshingRisk] = useState(false);

  // ML Risk Prediction state (XGBoost v2 + SHAP)
  const [mlPrediction, setMlPrediction] = useState(null);
  const [predictingRisk, setPredictingRisk] = useState(false);
  const [predictionError, setPredictionError] = useState("");

  // Project deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [deleteProjectError, setDeleteProjectError] = useState("");

  const role = getUserRole();
  const username = getUsername();

  const isViewer = role === "VIEWER";
  const isAdmin = role === "ADMIN";
  const isOfficer = role === "OFFICER";
  const canModify = isAdmin || isOfficer;

  useEffect(() => {
    loadProject();
  }, [id]);

  function loadProject() {
    const token = localStorage.getItem("token");

    fetch(`https://infrastructure-monitoring-system-0yjf.onrender.com/api/projects/${id}/summary`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => {
        if (!response.ok) {
          if (response.status === 403) {
            throw new Error("Access Denied: You are not assigned to view this project.");
          }
          throw new Error("Failed to load project details");
        }
        return response.json();
      })
      .then((result) => {
        setData(result);
        setError("");
      })
      .catch((err) => setError(err.message));
  }

  function startEditing() {
    setFormData({
      name: data.project.name,
      state: data.project.state,
      implementingAgency: data.project.implementingAgency,
      originalCost: data.project.originalCost,
      revisedCost: data.project.revisedCost,
      startDate: data.project.startDate,
      originalCompletion: data.project.originalCompletion,
      revisedCompletion: data.project.revisedCompletion
    });
    setMessage("");
    setEditing(true);
  }

  function handleChange(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });
  }

  function handleUpdate(event) {
    event.preventDefault();
    const token = localStorage.getItem("token");

    fetch(`https://infrastructure-monitoring-system-0yjf.onrender.com/api/projects/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...formData,
        originalCost: Number(formData.originalCost),
        revisedCost: formData.revisedCost ? Number(formData.revisedCost) : null
      })
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to update project");
        }
        return response.json();
      })
      .then(() => {
        setMessage("Project information updated successfully.");
        setEditing(false);
        loadProject();
      })
      .catch((err) => setError(err.message));
  }

  function handleAddMilestone(event) {
    event.preventDefault();
    const token = localStorage.getItem("token");

    fetch(`https://infrastructure-monitoring-system-0yjf.onrender.com/api/projects/${id}/milestones`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        reportedDate: milestoneForm.reportedDate,
        plannedPhysicalProgressPct: Number(milestoneForm.plannedPhysicalProgressPct),
        actualPhysicalProgressPct: Number(milestoneForm.actualPhysicalProgressPct),
        remarks: milestoneForm.remarks
      })
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to record milestone");
        }
        return response.json();
      })
      .then(() => {
        setMessage("Physical progress milestone recorded successfully.");
        setShowMilestoneForm(false);
        setMilestoneForm({
          reportedDate: new Date().toISOString().split("T")[0],
          plannedPhysicalProgressPct: "",
          actualPhysicalProgressPct: "",
          remarks: ""
        });
        loadProject();
      })
      .catch((err) => setError(err.message));
  }

  function handleAddFinancial(event) {
    event.preventDefault();
    const token = localStorage.getItem("token");

    fetch(`https://infrastructure-monitoring-system-0yjf.onrender.com/api/projects/${id}/financials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        reportedDate: financialForm.reportedDate,
        cumulativeExpenditure: Number(financialForm.cumulativeExpenditure),
        plannedExpenditureToDate: Number(financialForm.plannedExpenditureToDate),
        newExpenditure: financialForm.newExpenditure ? Number(financialForm.newExpenditure) : null
      })
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to record financial entry");
        }
        return response.json();
      })
      .then(() => {
        setMessage("Financial expenditure snapshot recorded successfully.");
        setShowFinancialForm(false);
        setFinancialForm({
          reportedDate: new Date().toISOString().split("T")[0],
          cumulativeExpenditure: "",
          plannedExpenditureToDate: "",
          newExpenditure: ""
        });
        loadProject();
      })
      .catch((err) => setError(err.message));
  }

  function handleRefreshRisk() {
    setRefreshingRisk(true);
    const token = localStorage.getItem("token");

    fetch(`https://infrastructure-monitoring-system-0yjf.onrender.com/api/projects/${id}/risk/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to re-evaluate risk rules");
        }
        return response.json();
      })
      .then(() => {
        setMessage("Risk assessment rules refreshed successfully.");
        loadProject();
      })
      .catch((err) => setError(err.message))
      .finally(() => setRefreshingRisk(false));
  }

  function handleRunMlPrediction() {
    setPredictingRisk(true);
    setPredictionError("");
    const token = localStorage.getItem("token");

    fetch(`https://infrastructure-monitoring-system-0yjf.onrender.com/api/projects/${id}/risk-prediction`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("ML Risk Prediction failed. Ensure FastAPI risk service is running.");
        }
        return response.json();
      })
      .then((result) => {
        setMlPrediction(result);
        setMessage("ML Risk Prediction evaluated successfully via FastAPI XGBoost model.");
      })
      .catch((err) => {
        setPredictionError(err.message);
      })
      .finally(() => {
        setPredictingRisk(false);
      });
  }

  function handleResolveAlert(alertId) {
    const token = localStorage.getItem("token");

    fetch(`https://infrastructure-monitoring-system-0yjf.onrender.com/api/alerts/${alertId}/resolve`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to resolve alert");
        }
        return response.json();
      })
      .then(() => {
        setMessage("Alert marked as resolved.");
        loadProject();
      })
      .catch((err) => setError(err.message));
  }

  function handleDeleteProject() {
    setDeletingProject(true);
    setDeleteProjectError("");
    const token = localStorage.getItem("token");

    fetch(`https://infrastructure-monitoring-system-0yjf.onrender.com/api/projects/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to delete project. Admin authorization required.");
        }
        navigate("/projects");
      })
      .catch((err) => {
        setDeleteProjectError(err.message);
        setDeletingProject(false);
      });
  }

  if (error && !data) {
    return (
      <div className="page-container">
        <div className="access-denied-card">
          <div className="denied-icon">🚫</div>
          <h3>Access Restricted</h3>
          <p>{error}</p>
          <button
            onClick={() => navigate("/projects")}
            className="btn-primary mt-3"
          >
            ← Return to Projects Catalog
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading infrastructure project details...</div>
      </div>
    );
  }

  const project = data.project;
  const milestone = data.latestProgress;
  const financial = data.latestFinancial;
  const risk = data.latestRisk;
  const alerts = data.activeAlerts || [];
  const milestonesHistory = data.milestones || (milestone ? [milestone] : []);
  const financialsHistory = data.financialRecords || (financial ? [financial] : []);

  // Compute max absolute SHAP contribution for bar scaling
  const maxShapContrib = mlPrediction?.explanations?.length
    ? Math.max(...mlPrediction.explanations.map((e) => Math.abs(e.contribution || 0)), 0.01)
    : 1;

  return (
    <div className="page-container">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link to="/projects">← Back to Projects Catalog</Link>
        <span className="divider">/</span>
        <span>{project.name}</span>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2>{project.name}</h2>
          <p className="page-sub">
            Agency: <strong>{project.implementingAgency}</strong> | State: <strong>{project.state}</strong>
            {project.officer && !isViewer && (
              <span> | Assigned Officer: <strong>{project.officer.username}</strong></span>
            )}
          </p>
        </div>

        <div className="action-buttons">
          {/* Controls visible only to Officer & Admin */}
          {canModify && !editing && (
            <>
              <button onClick={startEditing} className="btn-secondary">
                Edit Information
              </button>
              <button onClick={() => setShowMilestoneForm(true)} className="btn-primary">
                + Record Progress
              </button>
              <button onClick={() => setShowFinancialForm(true)} className="btn-primary">
                + Record Financial
              </button>
            </>
          )}

          {/* ML & Risk Refresh triggers for Officer & Admin */}
          {!isViewer && (
            <>
              <button
                onClick={handleRunMlPrediction}
                disabled={predictingRisk}
                className="btn-primary"
                style={{
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  boxShadow: "0 2px 8px rgba(37,99,235,0.3)"
                }}
              >
                {predictingRisk ? "Analyzing 21 Features..." : "⚡ Run AI Risk Prediction"}
              </button>
              <button
                onClick={handleRefreshRisk}
                disabled={refreshingRisk}
                className="btn-outline"
              >
                {refreshingRisk ? "Evaluating..." : "↻ Refresh Risk"}
              </button>
            </>
          )}

          {/* Delete Project strictly Admin only */}
          {isAdmin && (
            <button
              onClick={() => {
                setDeleteProjectError("");
                setShowDeleteModal(true);
              }}
              className="btn-danger"
            >
              Delete Project
            </button>
          )}
        </div>
      </div>

      {message && <div className="auth-alert alert-success mb-3">{message}</div>}

      {/* Viewer Notice Banner */}
      {isViewer && (
        <div className="viewer-info-banner mb-4">
          <span className="viewer-banner-icon">👁️</span>
          <div>
            <strong>Citizen Transparency View:</strong> You have read-only access to this project&apos;s physical progress, financial allocations, and historical trend milestones.
          </div>
        </div>
      )}

      {/* Modal / Inline form for Milestone Progress */}
      {showMilestoneForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Record Physical Progress Milestone</h3>
            <form onSubmit={handleAddMilestone}>
              <label>
                Reported Date:
                <input
                  type="date"
                  value={milestoneForm.reportedDate}
                  onChange={(e) =>
                    setMilestoneForm({ ...milestoneForm, reportedDate: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Planned Physical Progress (%):
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="e.g. 45.0"
                  value={milestoneForm.plannedPhysicalProgressPct}
                  onChange={(e) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      plannedPhysicalProgressPct: e.target.value
                    })
                  }
                  required
                />
              </label>
              <label>
                Actual Physical Progress (%):
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="e.g. 38.5"
                  value={milestoneForm.actualPhysicalProgressPct}
                  onChange={(e) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      actualPhysicalProgressPct: e.target.value
                    })
                  }
                  required
                />
              </label>
              <label>
                Remarks / Observations:
                <textarea
                  rows="3"
                  placeholder="Explain status, execution bottlenecks, or site conditions..."
                  value={milestoneForm.remarks}
                  onChange={(e) =>
                    setMilestoneForm({ ...milestoneForm, remarks: e.target.value })
                  }
                />
              </label>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  Save Milestone
                </button>
                <button
                  type="button"
                  onClick={() => setShowMilestoneForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal / Inline form for Financial Snapshot */}
      {showFinancialForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Record Financial Expenditure Snapshot</h3>
            <form onSubmit={handleAddFinancial}>
              <label>
                Reported Date:
                <input
                  type="date"
                  value={financialForm.reportedDate}
                  onChange={(e) =>
                    setFinancialForm({ ...financialForm, reportedDate: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Cumulative Expenditure (₹ Cr):
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Total funds spent to date"
                  value={financialForm.cumulativeExpenditure}
                  onChange={(e) =>
                    setFinancialForm({
                      ...financialForm,
                      cumulativeExpenditure: e.target.value
                    })
                  }
                  required
                />
              </label>
              <label>
                Planned Expenditure to Date (₹ Cr):
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Budgeted expenditure to date"
                  value={financialForm.plannedExpenditureToDate}
                  onChange={(e) =>
                    setFinancialForm({
                      ...financialForm,
                      plannedExpenditureToDate: e.target.value
                    })
                  }
                  required
                />
              </label>
              <label>
                New Expenditure this Period (₹ Cr):
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Disbursed in current period"
                  value={financialForm.newExpenditure}
                  onChange={(e) =>
                    setFinancialForm({
                      ...financialForm,
                      newExpenditure: e.target.value
                    })
                  }
                />
              </label>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  Save Financial Record
                </button>
                <button
                  type="button"
                  onClick={() => setShowFinancialForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Basic Info Form */}
      {editing && (
        <div className="detail-card mb-4">
          <h3>Edit Project Details</h3>
          <form onSubmit={handleUpdate} className="grid-form">
            <label>
              Project Name:
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              State:
              <input
                type="text"
                name="state"
                value={formData.state || ""}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Implementing Agency:
              <input
                type="text"
                name="implementingAgency"
                value={formData.implementingAgency || ""}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Original Cost (₹ Cr):
              <input
                type="number"
                name="originalCost"
                value={formData.originalCost || ""}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Revised Cost (₹ Cr):
              <input
                type="number"
                name="revisedCost"
                value={formData.revisedCost || ""}
                onChange={handleChange}
              />
            </label>
            <label>
              Start Date:
              <input
                type="date"
                name="startDate"
                value={formData.startDate || ""}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Original Completion Date:
              <input
                type="date"
                name="originalCompletion"
                value={formData.originalCompletion || ""}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Revised Completion Date:
              <input
                type="date"
                name="revisedCompletion"
                value={formData.revisedCompletion || ""}
                onChange={handleChange}
              />
            </label>
            <div className="form-actions-full">
              <button type="submit" className="btn-primary">
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of detail sections */}
      <div className="details-grid">
        {/* Basic Info */}
        <div className="detail-card">
          <h3>Project Specifications</h3>
          <div className="info-list">
            <div className="info-item">
              <span className="info-label">Current Status:</span>
              <span
                className={`badge ${
                  project.currentStatus === "DELAYED"
                    ? "badge-status-delayed"
                    : project.currentStatus === "COMPLETED"
                    ? "badge-status-completed"
                    : "badge-status-ontrack"
                }`}
              >
                {project.currentStatus || "ON_TRACK"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">State:</span>
              <span>{project.state}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Agency:</span>
              <span>{project.implementingAgency}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Original Budget:</span>
              <span>₹{Number(project.originalCost || 0).toLocaleString()} Cr</span>
            </div>
            <div className="info-item">
              <span className="info-label">Revised Budget:</span>
              <span>₹{Number(project.revisedCost || project.originalCost || 0).toLocaleString()} Cr</span>
            </div>
            <div className="info-item">
              <span className="info-label">Sanction Date:</span>
              <span>{project.startDate}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Original Target Date:</span>
              <span>{project.originalCompletion}</span>
            </div>
            {project.revisedCompletion && (
              <div className="info-item">
                <span className="info-label">Revised Target Date:</span>
                <span className="text-warning">{project.revisedCompletion}</span>
              </div>
            )}
            {project.officer && !isViewer && (
              <div className="info-item">
                <span className="info-label">Assigned Officer:</span>
                <span>👤 {project.officer.username}</span>
              </div>
            )}
          </div>
        </div>

        {/* Latest Progress Snapshot Card */}
        <div className="detail-card">
          <h3>Physical Execution Snapshot</h3>
          {milestone ? (
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Actual Progress:</span>
                <strong>{milestone.actualPhysicalProgressPct || milestone.actualPercent}%</strong>
              </div>
              <div className="info-item">
                <span className="info-label">Planned Target:</span>
                <span>{milestone.plannedPhysicalProgressPct || milestone.plannedPercent}%</span>
              </div>
              <div className="info-item">
                <span className="info-label">Reported Date:</span>
                <span>{milestone.reportedDate}</span>
              </div>
              <div className="progress-cell mt-2 span-2">
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, milestone.actualPhysicalProgressPct || milestone.actualPercent || 0)
                      )}%`
                    }}
                  />
                </div>
              </div>
              {milestone.remarks && (
                <div className="info-item span-2 text-muted text-sm mt-1">
                  <em>&ldquo;{milestone.remarks}&rdquo;</em>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted">No milestone snapshots recorded yet.</p>
          )}
        </div>

        {/* Latest Financial Snapshot Card */}
        <div className="detail-card">
          <h3>Financial Utilization Snapshot</h3>
          {financial ? (
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Cumulative Spend:</span>
                <strong>₹{Number(financial.cumulativeExpenditure || 0).toLocaleString()} Cr</strong>
              </div>
              <div className="info-item">
                <span className="info-label">Planned Target:</span>
                <span>₹{Number(financial.plannedExpenditureToDate || 0).toLocaleString()} Cr</span>
              </div>
              <div className="info-item">
                <span className="info-label">Reported Date:</span>
                <span>{financial.reportedDate}</span>
              </div>
            </div>
          ) : (
            <p className="text-muted">No financial records logged yet.</p>
          )}
        </div>

        {/* AI / ML Risk Prediction (Hidden strictly for Viewer) */}
        {!isViewer && (
          <div className="detail-card card-highlight" style={{ gridColumn: "span 2" }}>
            <div className="card-header-flex">
              <div>
                <h3>AI Risk Prediction & SHAP Explainability</h3>
                <span className="subtext">
                  {mlPrediction?.model_version
                    ? `Model: XGBoost ${mlPrediction.model_version} with TreeSHAP Contributions`
                    : "FastAPI XGBoost v2 Prediction Service"}
                </span>
              </div>
              {mlPrediction && (
                <span
                  className={`badge badge-risk-${mlPrediction.risk_level?.toLowerCase()}`}
                  style={{ fontSize: "13px", padding: "6px 14px" }}
                >
                  {mlPrediction.risk_level} RISK ({(mlPrediction.risk_probability * 100).toFixed(2)}%)
                </span>
              )}
            </div>

            <div className="ml-prediction-content" style={{ marginTop: "14px" }}>
              {predictionError && (
                <div className="auth-alert alert-error mb-3">{predictionError}</div>
              )}

              {mlPrediction ? (
                <div>
                  <div className="ml-kpi-row">
                    <div className="ml-kpi-box">
                      <span className="kpi-title">Risk Probability</span>
                      <span className="kpi-value">
                        {(mlPrediction.risk_probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="ml-kpi-box">
                      <span className="kpi-title">Decision Threshold</span>
                      <span className="kpi-value">{(mlPrediction.threshold * 100).toFixed(0)}%</span>
                    </div>
                    <div className="ml-kpi-box">
                      <span className="kpi-title">Overdue Indicator</span>
                      <span className="kpi-value">
                        {mlPrediction.features_extracted?.is_overdue === 1 ? "⚠️ YES" : "✅ NO"}
                      </span>
                    </div>
                    <div className="ml-kpi-box">
                      <span className="kpi-title">Progress Slippage</span>
                      <span className="kpi-value">
                        {Number(mlPrediction.features_extracted?.progress_slippage || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* SHAP Feature Contributions */}
                  {mlPrediction.explanations && mlPrediction.explanations.length > 0 && (
                    <div className="shap-section mt-4">
                      <div className="shap-header">
                        <h4>Top Risk Drivers (TreeSHAP Feature Attribution)</h4>
                        <span className="text-muted text-xs">
                          Positive values push risk higher; negative values reduce predicted delay risk
                        </span>
                      </div>
                      <div className="shap-bars-list mt-2">
                        {mlPrediction.explanations.map((exp, idx) => {
                          const contrib = exp.contribution || 0;
                          const isPositive = contrib > 0;
                          const widthPct = Math.min(100, Math.max(5, (Math.abs(contrib) / maxShapContrib) * 100));

                          return (
                            <div key={idx} className="shap-bar-row">
                              <div className="shap-label-col">
                                <span className="feature-name">{exp.feature}</span>
                                <span className="feature-val">
                                  {typeof exp.value === "number" ? exp.value.toFixed(2) : exp.value}
                                </span>
                              </div>
                              <div className="shap-visual-col">
                                <div className="shap-bar-track">
                                  <div
                                    className={`shap-bar-fill ${isPositive ? "bar-danger" : "bar-success"}`}
                                    style={{ width: `${widthPct}%` }}
                                  />
                                </div>
                              </div>
                              <div className="shap-num-col">
                                <span className={isPositive ? "text-danger" : "text-success"}>
                                  {isPositive ? `+${contrib.toFixed(3)}` : contrib.toFixed(3)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Early Warning Flags */}
                  {mlPrediction.early_warning_flags && mlPrediction.early_warning_flags.length > 0 && (
                    <div className="early-warning-box mt-3">
                      <span className="warning-title">⚠️ Early Warning Indicators:</span>
                      <ul className="warning-list">
                        {mlPrediction.early_warning_flags.map((flag, idx) => (
                          <li key={idx}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* AI Recommendations */}
                  {mlPrediction.recommendations && mlPrediction.recommendations.length > 0 && (
                    <div className="recommendations-box mt-3">
                      <span className="rec-title">💡 Automated Mitigation Recommendations:</span>
                      <ul className="rec-list">
                        {mlPrediction.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="ml-placeholder-box">
                  <p>
                    Run the XGBoost machine learning model to extract 21 temporal & operational features and analyze risk drivers.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rule-Based Risk Assessment (Hidden for Viewer) */}
        {!isViewer && (
          <div className="detail-card">
            <h3>Heuristic Risk Assessment</h3>
            {risk ? (
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Risk Band:</span>
                  <span className={`badge badge-risk-${risk.riskBand?.toLowerCase()}`}>
                    {risk.riskBand}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Calculated Probability:</span>
                  <span>{risk.riskProbability ? (risk.riskProbability * 100).toFixed(1) + "%" : "N/A"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Assessed At:</span>
                  <span>{risk.assessedAt}</span>
                </div>
                {risk.topFeatures && (
                  <div className="info-item span-2">
                    <span className="info-label">Key Drivers:</span>
                    <span>{risk.topFeatures}</span>
                  </div>
                )}
                {risk.recommendation && (
                  <div className="info-item span-2">
                    <span className="info-label">Protocol Action:</span>
                    <p className="rec-text">{risk.recommendation}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted">No heuristic risk assessment recorded.</p>
            )}
          </div>
        )}

        {/* Internal Active Alerts (Hidden strictly for Viewer) */}
        {!isViewer && (
          <div className="detail-card">
            <div className="card-header-flex">
              <h3>Internal Project Alerts</h3>
              <span className="badge-alert-count">Active: {alerts.length}</span>
            </div>

            {alerts.length > 0 ? (
              <div className="alerts-mini-list mt-3">
                {alerts.map((al) => (
                  <div key={al.id} className="alert-item-compact">
                    <div className="alert-meta">
                      <span className={`badge badge-severity-${al.severity?.toLowerCase()}`}>
                        {al.severity}
                      </span>
                      <span className="alert-time">{al.createdAt}</span>
                    </div>
                    <p className="alert-msg">{al.message}</p>
                    {canModify && (
                      <button
                        onClick={() => handleResolveAlert(al.id)}
                        className="btn-sm btn-outline mt-1"
                      >
                        ✓ Mark Resolved
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted mt-2">No active alerts for this project.</p>
            )}
          </div>
        )}
      </div>

      {/* Progress & Trend Visualizations (Visible to All including Viewer) */}
      <section className="mt-4">
        <h3 className="section-title">Execution Trends & Progress Trajectory</h3>
        <div className="charts-grid mt-3">
          <PhysicalProgressTrendChart milestones={milestonesHistory} />
          <FinancialExpenditureTrendChart financialRecords={financialsHistory} />
        </div>
      </section>

      {/* Historical Milestones Logs (Visible to All) */}
      <section className="mt-4">
        <div className="section-header">
          <h3>Physical Progress Milestone History</h3>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reported Date</th>
                <th>Planned Progress</th>
                <th>Actual Progress</th>
                <th>Variance (Slippage)</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {milestonesHistory.map((m, idx) => {
                const actual = m.actualPhysicalProgressPct || m.actualPercent || 0;
                const planned = m.plannedPhysicalProgressPct || m.plannedPercent || 0;
                const variance = actual - planned;

                return (
                  <tr key={idx}>
                    <td>{m.reportedDate}</td>
                    <td>{planned}%</td>
                    <td>
                      <strong>{actual}%</strong>
                    </td>
                    <td>
                      <span className={variance < 0 ? "text-danger" : "text-success"}>
                        {variance > 0 ? `+${variance.toFixed(1)}%` : `${variance.toFixed(1)}%`}
                      </span>
                    </td>
                    <td>{m.remarks || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Historical Financial Records (Visible to All) */}
      <section className="mt-4 mb-4">
        <div className="section-header">
          <h3>Financial Expenditure History</h3>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reported Date</th>
                <th>Cumulative Spend (₹ Cr)</th>
                <th>Planned Target (₹ Cr)</th>
                <th>Periodic Spend (₹ Cr)</th>
              </tr>
            </thead>
            <tbody>
              {financialsHistory.map((f, idx) => (
                <tr key={idx}>
                  <td>{f.reportedDate}</td>
                  <td>
                    <strong>₹{Number(f.cumulativeExpenditure || 0).toLocaleString()} Cr</strong>
                  </td>
                  <td>₹{Number(f.plannedExpenditureToDate || 0).toLocaleString()} Cr</td>
                  <td>
                    {f.newExpenditure
                      ? `₹${Number(f.newExpenditure).toLocaleString()} Cr`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Delete Confirmation Modal (Admin only) */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Confirm Project Deletion</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowDeleteModal(false)}
              >
                ✕
              </button>
            </div>
            {deleteProjectError && (
              <div className="auth-alert alert-error">{deleteProjectError}</div>
            )}
            <p className="mt-2">
              Are you sure you want to permanently delete project:
              <br />
              <strong>{project.name}</strong> (ID: {project.id})?
            </p>
            <p className="text-danger text-sm mt-1">
              ⚠️ This will delete all milestones, financial snapshots, risk assessments, and active alerts.
            </p>
            <div className="modal-actions mt-4">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingProject}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDeleteProject}
                disabled={deletingProject}
              >
                {deletingProject ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDetails;
