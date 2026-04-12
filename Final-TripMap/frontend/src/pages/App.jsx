import React from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./Navbar";
import Footer from "./Footer";
import Home from "./Home";
import Features from "./Features";
import Planner from "./Planner";
import Profile from "./Profile";
import About from "./About";
import Dashboard from "./Dashboard";
import AIChatbot from "./AIChatbot";
import Booking from "./Booking";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/booking" element={<Booking />} />
        </Routes>

        <AIChatbot
          context={{
            destination: window.currentDestination || "",
            budget: window.currentBudget || 0,
            travelers: window.currentTravelers || [],
            itinerary: window.currentItinerary || [],
          }}
        />
      </div>
      <Footer />
    </div>
  );
}
