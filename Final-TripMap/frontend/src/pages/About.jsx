import React from "react";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 p-16 text-center">
      <h1 className="text-5xl font-bold mb-8">
        About AI Travel Pro
      </h1>

      <p className="max-w-3xl mx-auto text-gray-300 text-lg mb-6">
        AI Travel Pro is a full-stack intelligent group travel planning platform
        designed as a final-year engineering project. It leverages artificial
        intelligence, real-world location data, and budget-aware scheduling
        to generate personalized, hour-by-hour travel itineraries.
      </p>

      <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Technology Stack</h2>
        <ul className="text-left text-gray-300 space-y-2">
          <li>⚛️ Frontend: React + Vite + Tailwind CSS</li>
          <li>🛠 Backend: Node.js + Express</li>
          <li>🗄 Database: SQLite (User Memory + Trip History)</li>
          <li>🌍 API: OpenTripMap (Free Location Data)</li>
          <li>🤖 AI Logic: Stamina + Budget + Preference Engine</li>
        </ul>
      </div>
    </div>
  );
}