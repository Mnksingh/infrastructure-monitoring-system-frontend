import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  // Mode: "login" | "register" | "forgot"
  const [mode, setMode] = useState("login");

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [forgotResult, setForgotResult] = useState(null);

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
    setForgotResult(null);
  };

  const handleModeChange = (newMode) => {
    resetForm();
    setMode(newMode);
  };

  // 1. Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("https://infrastructure-monitoring-system-0yjf.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password })
      });

      if (!response.ok) {
        throw new Error("Invalid username or password");
      }

      const token = await response.text();
      localStorage.setItem("token", token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Public Viewer Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("https://infrastructure-monitoring-system-0yjf.onrender.com/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setSuccess("Viewer account created successfully! Logging you in...");

      // Automatically log in newly created user
      const loginRes = await fetch("https://infrastructure-monitoring-system-0yjf.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password })
      });

      if (loginRes.ok) {
        const token = await loginRes.text();
        localStorage.setItem("token", token);
        setTimeout(() => navigate("/dashboard"), 1200);
      } else {
        setTimeout(() => setMode("login"), 1500);
      }
    } catch (err) {
      setError(err.message || "Failed to register viewer account");
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setForgotResult(null);

    if (!username.trim()) {
      setError("Please enter your username or registered email.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("https://infrastructure-monitoring-system-0yjf.onrender.com/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }

      setSuccess(data.message || "Password reset token generated.");
      setForgotResult(data);
    } catch (err) {
      setError(err.message || "Error processing forgot password request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Portal Header */}
        <div className="login-header">
          <div className="gov-emblem">🏛️</div>
          <h2>MoSPI PAIMANA</h2>
          <p className="login-subtitle">
            Infrastructure Monitoring & Governance Portal
          </p>
          <div className="gov-badge-tag">Government of India</div>
        </div>

        {/* Auth Mode Tabs */}
        <div className="auth-tab-bar">
          <button
            type="button"
            className={`auth-tab-btn ${mode === "login" ? "active" : ""}`}
            onClick={() => handleModeChange("login")}
          >
            Officer / Admin Login
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === "register" ? "active" : ""}`}
            onClick={() => handleModeChange("register")}
          >
            Public Viewer Signup
          </button>
        </div>

        {/* Alerts */}
        {error && <div className="auth-alert alert-error">{error}</div>}
        {success && <div className="auth-alert alert-success">{success}</div>}

        {/* TAB 1: LOGIN */}
        {mode === "login" && (
          <form className="auth-form-vertical" onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username / Officer Email</label>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-row-between">
              <button
                type="button"
                className="btn-text"
                onClick={() => handleModeChange("forgot")}
              >
                Forgot Password?
              </button>
            </div>

            <button type="submit" className="btn-auth-primary" disabled={loading}>
              {loading ? "Authenticating..." : "Sign In →"}
            </button>

            <div className="auth-footer-notice mt-3">
              <p>
                Authorized personnel and public citizens can access the system according to assigned RBAC privileges.
              </p>
            </div>
          </form>
        )}

        {/* TAB 2: PUBLIC VIEWER REGISTRATION */}
        {mode === "register" && (
          <form className="auth-form-vertical" onSubmit={handleRegister}>
            <div className="role-notice-card">
              <span className="notice-icon">ℹ️</span>
              <div className="notice-text">
                <strong>Public Viewer Account</strong>
                <p>
                  Signup grants instant read-only citizen access to infrastructure portfolios, project timelines, and expenditure trends.
                </p>
              </div>
            </div>

            <div className="form-group">
              <label>Desired Username / Email</label>
              <input
                type="text"
                placeholder="e.g. citizen_user or email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password (min 6 characters)</label>
              <input
                type="password"
                placeholder="Create a secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-auth-primary" disabled={loading}>
              {loading ? "Creating Account..." : "Create Viewer Account"}
            </button>

            <div className="text-center mt-3">
              <button
                type="button"
                className="btn-text"
                onClick={() => handleModeChange("login")}
              >
                Already have an account? Sign in here
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: FORGOT PASSWORD */}
        {mode === "forgot" && (
          <form className="auth-form-vertical" onSubmit={handleForgotPassword}>
            <div className="form-group">
              <label>Account Username or Email</label>
              <input
                type="text"
                placeholder="Enter your registered username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-auth-primary" disabled={loading}>
              {loading ? "Generating Link..." : "Request Password Reset Link"}
            </button>

            {forgotResult && forgotResult.resetUrl && (
              <div className="reset-token-box mt-3">
                <span className="reset-token-title">🔑 Secure Reset Link Generated:</span>
                <p className="reset-token-desc">
                  In a production environment, this link is delivered via email. You can click or copy it directly below to proceed:
                </p>
                <div className="reset-link-action">
                  <a
                    href={forgotResult.resetUrl}
                    className="btn-sm btn-primary reset-direct-btn"
                  >
                    Open Password Reset Page →
                  </a>
                </div>
              </div>
            )}

            <div className="text-center mt-3">
              <button
                type="button"
                className="btn-text"
                onClick={() => handleModeChange("login")}
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;