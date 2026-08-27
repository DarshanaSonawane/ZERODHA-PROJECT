import React, { useState } from "react";

import { useAuth } from "./AuthContext";

const Signup = ({ onSwitchToLogin }) => {
  const { signup, login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await signup(name, email, password);
      // Account created — sign straight in so the user lands in the app
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Create account</h2>
        <p className="auth-sub">Sign up to start trading</p>
        <input
          className="auth-input"
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
          minLength={6}
          required
        />
        <input
          className="auth-input"
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {error && <p className="auth-error">{error}</p>}
        <button className="auth-submit" type="submit" disabled={loading}>
          <span>{loading ? "Creating account…" : "Sign up"}</span>
        </button>
        <p className="auth-footer">
          Already have an account?{" "}
          <button type="button" className="auth-link" onClick={onSwitchToLogin}>
            Sign in
          </button>
        </p>
      </form>
    </div>
  );
};

export default Signup;
