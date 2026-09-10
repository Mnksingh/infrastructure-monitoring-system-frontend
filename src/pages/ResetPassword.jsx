import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation, Link } from "react-router-dom";

export default function ResetPassword({ isOfficerSetup = false }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isSetup = isOfficerSetup || location.pathname.includes("setup-officer");
  const tokenFromUrl = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token.trim()) {
      setError("Authorization token is missing or invalid.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const endpoint = isSetup
      ? "https://infrastructure-monitoring-system-0yjf.onrender.com/api/auth/setup-officer"
      : "https://infrastructure-monitoring-system-0yjf.onrender.com/api/auth/reset-password";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ token: token.trim(), newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update password");
      }

      setSuccess(
        isSetup
          ? "Officer account setup successfully completed! Redirecting to login..."
          : "Password has been successfully reset! Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err) {
      setError(err.message || "Error processing your request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="gov-emblem">🏛️</div>
          <h2>{isSetup ? "Officer Account Activation" : "Set New Password"}</h2>
          <p className="login-subtitle">
            {isSetup
              ? "MoSPI PAIMANA • Infrastructure Monitoring Platform"
              : "Secure Government Credentials Recovery"}
          </p>
        </div>

        {error && <div className="auth-alert alert-error">{error}</div>}
        {success && <div className="auth-alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form-vertical">
          {!tokenFromUrl && (
            <div className="form-group">
              <label>Security Token / Reset Code</label>
              <input
                type="text"
                placeholder="Paste your reset token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>New Password (minimum 6 characters)</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-auth-primary" disabled={loading}>
            {loading
              ? "Saving..."
              : isSetup
              ? "Activate Officer Account"
              : "Reset Password"}
          </button>

          <div className="auth-links mt-3 text-center">
            <Link to="/login" className="auth-link">
              ← Return to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
