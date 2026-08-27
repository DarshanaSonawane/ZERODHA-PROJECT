import React, { useState } from "react";

import { useAuth } from "./AuthContext";

const Login = ({ onSwitchToSignup }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Zerodha Dashboard</h2>
        <p className="auth-sub">Sign in to continue</p>
        <input
          className="auth-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="auth-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="auth-error">{error}</p>}
        <button className="auth-submit" type="submit" disabled={loading}>
          <span>{loading ? "Signing in…" : "Sign in"}</span>
        </button>
        <p className="auth-footer">
          Don't have an account?{" "}
          <button type="button" className="auth-link" onClick={onSwitchToSignup}>
            Sign up
          </button>
        </p>
      </form>
    </div>
  );
};

export default Login;
