import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex flex-col justify-center items-center text-center px-10">
      <h1 className="text-6xl font-extrabold mb-6">
        TripMap
      </h1>

      <p className="max-w-2xl text-gray-200 mb-8 text-lg">
        A smart AI-powered group travel planning platform that generates
        personalized, budget-aware, stamina-based, hour-by-hour itineraries
        using real-world location data.
      </p>

      <Link
        to="/planner"
        className="bg-purple-500 px-8 py-4 rounded-full text-xl font-bold hover:bg-purple-600 transition"
      >
        Start Planning 🚀
      </Link>
    </div>
  );
}
