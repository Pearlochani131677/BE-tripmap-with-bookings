import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/history").then(res => {
      setTrips(res.data);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 p-12">
      <h1 className="text-4xl font-bold mb-8 text-center">
        📊 Trip Comparison Dashboard
      </h1>

      <div className="max-w-5xl mx-auto grid gap-6">
        {trips.map((t, i) => (
          <div
            key={i}
            className="bg-white/10 p-6 rounded-xl shadow-lg"
          >
            <h2 className="text-2xl font-bold">
              📍 {t.destination}
            </h2>
            <p className="text-gray-300">
              Budget: ₹{t.budget}
            </p>
            <p className="text-gray-400">
              Date: {new Date(t.date).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
