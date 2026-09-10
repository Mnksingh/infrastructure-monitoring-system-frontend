import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi (NCT)",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

const INFRASTRUCTURE_TYPES = [
  "Roads & Highways",
  "Railways",
  "Power & Renewable Energy",
  "Urban Development & Smart Cities",
  "Ports & Shipping",
  "Civil Aviation",
  "Water Resources & Irrigation",
  "Petroleum & Natural Gas",
  "Telecommunications",
  "Healthcare Infrastructure",
  "Industrial Corridors & SEZ",
  "Mining & Minerals"
];

const COMMON_AGENCIES = [
  "NHAI (National Highways Authority of India)",
  "RVNL (Rail Vikas Nigam Limited)",
  "CPWD (Central Public Works Department)",
  "NTPC (National Thermal Power Corporation)",
  "PWD (State Public Works Department)",
  "IRCON International",
  "GAIL (India) Limited",
  "NHPC Limited",
  "BHEL (Bharat Heavy Electricals Limited)",
  "DFCCIL (Dedicated Freight Corridor)",
  "MMRDA (Mumbai Metro/Urban Dev)",
  "AAI (Airports Authority of India)",
  "NBCC (India) Limited",
  "Other / Custom Agency"
];

function CreateProject() {
  const navigate = useNavigate();

  // Reference data
  const [ministries, setMinistries] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [ministryId, setMinistryId] = useState("");
  const [infrastructureType, setInfrastructureType] = useState(INFRASTRUCTURE_TYPES[0]);
  const [state, setState] = useState(INDIAN_STATES[0]);
  const [implementingAgency, setImplementingAgency] = useState(COMMON_AGENCIES[0]);
  const [customAgency, setCustomAgency] = useState("");

  const [originalCost, setOriginalCost] = useState("");
  const [revisedCost, setRevisedCost] = useState("");

  const [startDate, setStartDate] = useState("");
  const [originalCompletion, setOriginalCompletion] = useState("");
  const [revisedCompletion, setRevisedCompletion] = useState("");
  const [currentStatus, setCurrentStatus] = useState("ON_TRACK");

  // Officer Assignment State: "existing" | "new"
  const [assignmentMode, setAssignmentMode] = useState("existing");
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [newOfficerEmail, setNewOfficerEmail] = useState("");

  // Submitting state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successInfo, setSuccessInfo] = useState(null);

  useEffect(() => {
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    setLoadingData(true);
    const token = localStorage.getItem("token");

    try {
      // Fetch Ministries
      const minRes = await fetch("https://infrastructure-monitoring-system-0yjf.onrender.com/api/ministries", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (minRes.ok) {
        const minData = await minRes.json();
        setMinistries(minData);
        if (minData.length > 0) {
          setMinistryId(minData[0].id.toString());
        }
      }

      // Fetch Officers
      const offRes = await fetch("https://infrastructure-monitoring-system-0yjf.onrender.com/api/auth/officers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (offRes.ok) {
        const offData = await offRes.json();
        setOfficers(offData);
        if (offData.length > 0) {
          setSelectedOfficerId(offData[0].id.toString());
        }
      }
    } catch (err) {
      console.error("Error loading reference data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessInfo(null);

    // Validation
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }
    if (!ministryId) {
      setError("Please select a Ministry.");
      return;
    }
    if (!originalCost || Number(originalCost) <= 0) {
      setError("Original cost must be a positive number.");
      return;
    }
    if (!startDate) {
      setError("Start date is required.");
      return;
    }
    if (!originalCompletion) {
      setError("Original completion date is required.");
      return;
    }

    if (assignmentMode === "new" && !newOfficerEmail.trim()) {
      setError("Please enter the email/username of the new officer to invite.");
      return;
    }

    const token = localStorage.getItem("token");
    setSubmitting(true);

    const agencyValue =
      implementingAgency === "Other / Custom Agency"
        ? customAgency.trim() || "State Agency"
        : implementingAgency;

    let payload = {
      name: name.trim(),
      ministryId: Number(ministryId),
      state,
      implementingAgency: agencyValue,
      originalCost: Number(originalCost),
      revisedCost: revisedCost ? Number(revisedCost) : Number(originalCost),
      startDate,
      originalCompletionDate: originalCompletion,
      revisedCompletionDate: revisedCompletion || originalCompletion,
      currentStatus
    };

    if (assignmentMode === "existing" && selectedOfficerId) {
      payload.officerId = Number(selectedOfficerId);
    } else if (assignmentMode === "new" && newOfficerEmail.trim()) {
      payload.officerEmail = newOfficerEmail.trim();
    }

    try {
      // 1. If new officer mode, invite them first or let backend auto-link
      let inviteResult = null;
      if (assignmentMode === "new") {
        const inviteRes = await fetch("https://infrastructure-monitoring-system-0yjf.onrender.com/api/auth/invite-officer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ username: newOfficerEmail.trim() })
        });
        if (inviteRes.ok) {
          inviteResult = await inviteRes.json();
        }
      }

      // 2. Create Project
      const response = await fetch("https://infrastructure-monitoring-system-0yjf.onrender.com/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create project.");
      }

      setSuccessInfo({
        project: result,
        invite: inviteResult
      });
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Create New Infrastructure Project</h2>
          <p className="page-sub">
            Government of India • Ministry of Statistics and Programme Implementation
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/projects")}
          >
            ← Back to Projects
          </button>
        </div>
      </div>

      {error && <div className="auth-alert alert-error mb-4">{error}</div>}

      {/* Success Banner & Invite Info */}
      {successInfo && (
        <div className="success-banner-card mb-4">
          <div className="success-icon">✅</div>
          <div className="success-content">
            <h3>Project Created Successfully!</h3>
            <p>
              Project <strong>{successInfo.project.name}</strong> (ID: {successInfo.project.id}) is now registered in PAIMANA.
            </p>

            {successInfo.invite && successInfo.invite.setupUrl && (
              <div className="officer-invite-result-box mt-3">
                <span className="invite-box-title">
                  📬 Secure Officer Setup Invitation Link:
                </span>
                <p className="invite-box-sub">
                  Officer <strong>{successInfo.invite.username}</strong> has been assigned. Provide this link to the officer to set their credentials:
                </p>
                <div className="invite-link-row">
                  <input
                    type="text"
                    readOnly
                    value={successInfo.invite.setupUrl}
                    className="invite-url-input"
                  />
                  <button
                    type="button"
                    className="btn-sm btn-primary"
                    onClick={() => {
                      navigator.clipboard.writeText(successInfo.invite.setupUrl);
                      alert("Officer setup link copied to clipboard!");
                    }}
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            )}

            <div className="mt-3 flex-row gap-2">
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate(`/projects/${successInfo.project.id}`)}
              >
                View Project Details →
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSuccessInfo(null);
                  setName("");
                  setOriginalCost("");
                  setRevisedCost("");
                  setStartDate("");
                  setOriginalCompletion("");
                  setRevisedCompletion("");
                  setNewOfficerEmail("");
                }}
              >
                + Add Another Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Redesigned Form */}
      {!successInfo && (
        <form className="redesigned-project-form" onSubmit={handleSubmit}>
          {/* SECTION 1: PROJECT INFORMATION */}
          <div className="form-card-section">
            <div className="section-title-row">
              <span className="section-badge">1</span>
              <div>
                <h3>Project Information</h3>
                <p className="section-desc">Basic identification, sector, and implementing agency</p>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group span-2">
                <label>Project Name <span className="req">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Delhi-Mumbai Industrial Corridor Expressway Package 4"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Ministry <span className="req">*</span></label>
                <div className="select-wrapper">
                  <select
                    value={ministryId}
                    onChange={(e) => setMinistryId(e.target.value)}
                    required
                  >
                    {ministries.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.sector || "General"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Infrastructure Type / Sector <span className="req">*</span></label>
                <div className="select-wrapper">
                  <select
                    value={infrastructureType}
                    onChange={(e) => setInfrastructureType(e.target.value)}
                    required
                  >
                    {INFRASTRUCTURE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>State / Union Territory <span className="req">*</span></label>
                <div className="select-wrapper">
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Implementing Agency <span className="req">*</span></label>
                <div className="select-wrapper">
                  <select
                    value={implementingAgency}
                    onChange={(e) => setImplementingAgency(e.target.value)}
                    required
                  >
                    {COMMON_AGENCIES.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {implementingAgency === "Other / Custom Agency" && (
                <div className="form-group span-2">
                  <label>Specify Custom Implementing Agency <span className="req">*</span></label>
                  <input
                    type="text"
                    placeholder="Enter implementing body name"
                    value={customAgency}
                    onChange={(e) => setCustomAgency(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Initial Status</label>
                <div className="select-wrapper">
                  <select
                    value={currentStatus}
                    onChange={(e) => setCurrentStatus(e.target.value)}
                  >
                    <option value="ON_TRACK">ON_TRACK (On Schedule)</option>
                    <option value="ONGOING">ONGOING (In Progress)</option>
                    <option value="DELAYED">DELAYED (Lagging Milestone)</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: PROJECT COST */}
          <div className="form-card-section">
            <div className="section-title-row">
              <span className="section-badge">2</span>
              <div>
                <h3>Project Financials & Budget</h3>
                <p className="section-desc">Sanctioned and revised capital allocations (in ₹ Crores)</p>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Original Sanctioned Cost (₹ Cr) <span className="req">*</span></label>
                <div className="input-with-unit">
                  <span className="input-unit">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 1250.50"
                    value={originalCost}
                    onChange={(e) => setOriginalCost(e.target.value)}
                    required
                  />
                  <span className="input-suffix">Cr</span>
                </div>
              </div>

              <div className="form-group">
                <label>Revised Cost (₹ Cr) <span className="text-muted">(if approved)</span></label>
                <div className="input-with-unit">
                  <span className="input-unit">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Leave empty if same as original"
                    value={revisedCost}
                    onChange={(e) => setRevisedCost(e.target.value)}
                  />
                  <span className="input-suffix">Cr</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: PROJECT TIMELINE */}
          <div className="form-card-section">
            <div className="section-title-row">
              <span className="section-badge">3</span>
              <div>
                <h3>Project Timeline & Milestones</h3>
                <p className="section-desc">Key execution lifecycle dates (individual date selectors)</p>
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label>1. Project Start Date <span className="req">*</span></label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>2. Original Completion Date <span className="req">*</span></label>
                <input
                  type="date"
                  value={originalCompletion}
                  onChange={(e) => setOriginalCompletion(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>3. Revised Target Date <span className="text-muted">(Optional)</span></label>
                <input
                  type="date"
                  value={revisedCompletion}
                  onChange={(e) => setRevisedCompletion(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: PROJECT ASSIGNMENT */}
          <div className="form-card-section">
            <div className="section-title-row">
              <span className="section-badge">4</span>
              <div>
                <h3>Project Officer Assignment</h3>
                <p className="section-desc">Designate a responsible government officer for physical & financial reporting</p>
              </div>
            </div>

            {/* Assignment Mode Toggle */}
            <div className="assignment-mode-toggle mb-3">
              <button
                type="button"
                className={`toggle-option ${assignmentMode === "existing" ? "selected" : ""}`}
                onClick={() => setAssignmentMode("existing")}
              >
                👤 Select Existing Officer
              </button>
              <button
                type="button"
                className={`toggle-option ${assignmentMode === "new" ? "selected" : ""}`}
                onClick={() => setAssignmentMode("new")}
              >
                ✉️ Invite New Officer (Secure Link)
              </button>
            </div>

            {assignmentMode === "existing" && (
              <div className="form-group">
                <label>Designated Project Officer</label>
                <div className="select-wrapper">
                  <select
                    value={selectedOfficerId}
                    onChange={(e) => setSelectedOfficerId(e.target.value)}
                  >
                    {officers.length === 0 ? (
                      <option value="">No registered officers found</option>
                    ) : (
                      officers.map((off) => (
                        <option key={off.id} value={off.id}>
                          {off.username} ({off.role})
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <span className="form-hint">
                  The officer will have exclusive operational access to update milestones and resolve alerts for this project.
                </span>
              </div>
            )}

            {assignmentMode === "new" && (
              <div className="form-group">
                <label>New Officer Email / Username <span className="req">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. officer.sharma@mospi.gov.in"
                  value={newOfficerEmail}
                  onChange={(e) => setNewOfficerEmail(e.target.value)}
                  required={assignmentMode === "new"}
                />
                <span className="form-hint">
                  A secure one-time password setup link will be generated automatically upon project creation.
                </span>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="form-actions-bar">
            <button
              type="button"
              className="btn-secondary btn-lg"
              onClick={() => navigate("/projects")}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary btn-lg"
              disabled={submitting}
            >
              {submitting ? "Deploying Project..." : "💾 Save & Deploy Project"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default CreateProject;
