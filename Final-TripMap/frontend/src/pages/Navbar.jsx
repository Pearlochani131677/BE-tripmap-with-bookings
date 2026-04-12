import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-black/30 backdrop-blur-md px-8 py-4 flex justify-between items-center shadow-lg">
      <h1 className="text-2xl font-bold text-purple-400">
        TripMap
      </h1>

      <div className="space-x-6 text-lg">
        <Link to="/" className="hover:text-purple-400">Home</Link>
        <Link to="/features" className="hover:text-purple-400">Features</Link>
        <Link to="/planner" className="hover:text-purple-400">Planner</Link>
        <Link to="/profile" className="hover:text-purple-400">Profile</Link>
        <Link to="/about" className="hover:text-purple-400">About</Link>
        <Link to="/dashboard">Dashboard</Link>
        <a href="/booking">Booking</a>
      </div>
    </nav>
  );
}
