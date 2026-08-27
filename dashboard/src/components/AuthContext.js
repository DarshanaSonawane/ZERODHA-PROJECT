import React, { createContext, useContext, useState } from "react";

import api, { setAccessToken, clearAccessToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // null user = logged out. The JWT itself lives only in memory (see api.js)
  const [user, setUser] = useState(null);

  async function login(email, password) {
    const res = await api.post("/login", { email, password });
    setAccessToken(res.data.token); // keep token in memory
    setUser(res.data.user);
    return res.data.user;
  }

  async function signup(name, email, password) {
    await api.post("/signup", { name, email, password });
  }

  function logout() {
    clearAccessToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
