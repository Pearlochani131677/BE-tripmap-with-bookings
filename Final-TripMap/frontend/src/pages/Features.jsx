import React from "react";

const features = [
  {
    title: "🧠 AI Group Intelligence",
    desc: "Merges preferences of up to 5 travelers and resolves conflicts by generating split-activity plans."
  },
  {
    title: "💰 Budget-Aware Planning",
    desc: "Automatically allocates budget across food, transport, and daily activities."
  },
  {
    title: "⏰ Hour-by-Hour Itinerary",
    desc: "Generates time-slot based plans based on stamina and trip duration."
  },
  {
    title: "🌍 Real Location Data",
    desc: "Uses OpenTripMap API to fetch real attractions."
  },
  {
    title: "📊 Memory System",
    desc: "Stores traveler preferences and trip history."
  },
  {
    title: "🗺 Maps Integration",
    desc: "Visualize attractions on interactive maps."
  }
];

export default function Features() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 p-12">
      <h1 className="text-5xl font-bold text-center mb-12">
        Platform Features
      </h1>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {features.map((f, i) => (
          <div
            key={i}
            className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-xl hover:scale-105 transition"
          >
            <h2 className="text-2xl font-bold mb-3">{f.title}</h2>
            <p className="text-gray-300">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}