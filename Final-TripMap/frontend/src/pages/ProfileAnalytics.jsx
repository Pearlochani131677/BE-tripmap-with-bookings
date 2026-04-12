import React from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ProfileAnalytics({ travelers = [] }) {
  if (!travelers.length) return null;

  const likesCount = {};
  const dislikesCount = {};

  travelers.forEach(t => {
    if (t.likes) {
      t.likes.split(",").forEach(l => {
        const key = l.trim().toLowerCase();
        if (!key) return;
        likesCount[key] = (likesCount[key] || 0) + 1;
      });
    }

    if (t.dislikes) {
      t.dislikes.split(",").forEach(d => {
        const key = d.trim().toLowerCase();
        if (!key) return;
        dislikesCount[key] = (dislikesCount[key] || 0) + 1;
      });
    }
  });

  const chartData = {
    labels: Object.keys(likesCount),
    datasets: [
      {
        label: "Likes Trend",
        data: Object.values(likesCount),
        backgroundColor: [
          "#8b5cf6",
          "#22c55e",
          "#f97316",
          "#3b82f6",
          "#ec4899"
        ]
      }
    ]
  };

  return (
    <div className="max-w-4xl mx-auto bg-white/10 p-6 rounded-2xl mb-6">
      <h2 className="text-2xl font-bold mb-4">
        📊 Traveler Preference Analytics
      </h2>

      {Object.keys(likesCount).length === 0 ? (
        <p className="text-gray-300">
          Enter likes & dislikes to see group preference trends
        </p>
      ) : (
        <div className="max-w-sm mx-auto">
          <Pie data={chartData} />
        </div>
      )}
    </div>
  );
}
