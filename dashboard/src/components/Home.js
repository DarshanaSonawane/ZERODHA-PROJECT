import React, { useState } from "react";

import Dashboard from "./Dashboard";
import TopBar from "./TopBar";
import Login from "./Login";
import Signup from "./Signup";
import { useAuth } from "./AuthContext";

const Home = () => {
  const { user } = useAuth();
  const [view, setView] = useState("login"); // "login" | "signup"

  if (!user) {
    return view === "signup" ? (
      <Signup onSwitchToLogin={() => setView("login")} />
    ) : (
      <Login onSwitchToSignup={() => setView("signup")} />
    );
  }

  return (
    <>
      <TopBar />
      <Dashboard />
    </>
  );
};

export default Home;