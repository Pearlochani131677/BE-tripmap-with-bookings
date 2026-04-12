import React, { useState } from "react";

export default function Profile() {
  const [profile, setProfile] = useState({
    name: "Traveler",
    budget: "Medium",
    style: "Explorer",
    favorites: "Beaches, Cafes, Nature"
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 p-12">
      <h1 className="text-4xl font-bold text-center mb-8">
        Traveler Profile
      </h1>

      <div className="max-w-xl mx-auto bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl">
        <label className="block mb-4">
          Name
          <input
            className="w-full p-2 rounded text-black mt-1"
            value={profile.name}
            onChange={e => setProfile({ ...profile, name: e.target.value })}
          />
        </label>

        <label className="block mb-4">
          Budget Preference
          <select
            className="w-full p-2 rounded text-black mt-1"
            value={profile.budget}
            onChange={e =>
              setProfile({ ...profile, budget: e.target.value })
            }
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </label>

        <label className="block mb-4">
          Travel Style
          <select
            className="w-full p-2 rounded text-black mt-1"
            value={profile.style}
            onChange={e =>
              setProfile({ ...profile, style: e.target.value })
            }
          >
            <option>Relaxed</option>
            <option>Balanced</option>
            <option>Explorer</option>
          </select>
        </label>

        <label className="block mb-6">
          Favorite Activities
          <input
            className="w-full p-2 rounded text-black mt-1"
            value={profile.favorites}
            onChange={e =>
              setProfile({ ...profile, favorites: e.target.value })
            }
          />
        </label>

        <button className="w-full bg-purple-500 py-3 rounded-lg font-bold hover:bg-purple-600 transition">
          Save Profile
        </button>
      </div>
    </div>
  );
}