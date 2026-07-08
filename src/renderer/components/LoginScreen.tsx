import React, { useState } from "react";
import { useAuthStore } from "../store/authStore";

export function LoginScreen() {
  const [uid, setUid] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid.trim() || !password.trim()) return;
    await login(uid.trim(), password);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Manager CRM</h1>
        <p className="login-subtitle">Sign in to manage your sales pipeline</p>

        {error && (
          <div className="login-error">
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="uid">
              User ID
            </label>
            <input
              id="uid"
              type="text"
              className="form-input"
              placeholder="Enter your UID"
              value={uid}
              onChange={(e) => {
                setUid(e.target.value);
                clearError();
              }}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError();
              }}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !uid.trim() || !password.trim()}
          >
            {isLoading ? (
              <span className="spinner" style={{ width: 18, height: 18 }} />
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
