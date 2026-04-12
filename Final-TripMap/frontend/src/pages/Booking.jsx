import React, { useState } from "react";
import axios from "axios";

export default function Booking() {
  // ================= STATE =================
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mode, setMode] = useState("flight");

  const [travelBudget, setTravelBudget] = useState(3000);
  const [hotelBudget, setHotelBudget] = useState(3000);

  const [days, setDays] = useState(2);
  const [travelers, setTravelers] = useState(1);

  const [result, setResult] = useState(null);

  // ✅ selection states
  const [selectedTravel, setSelectedTravel] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);

  // ================= API =================
  const search = async () => {
    try {
      const res = await axios.post("http://localhost:5000/booking", {
        from,
        to,
        mode,
        budget: travelBudget,
        days
      });

      setResult(res.data);
      setSelectedTravel(null);
      setSelectedHotel(null);
    } catch (err) {
      alert("Backend not working / route missing");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 p-10 text-white">

      {/* TITLE */}
      <h1 className="text-3xl font-bold mb-8 text-center">
        ✈️ Travel & Hotel Booking
      </h1>

      {/* ================= INPUT ================= */}
      <div className="max-w-4xl mx-auto bg-white/10 p-6 rounded-xl space-y-6">

        {/* 🚗 TRAVEL */}
        <div>
          <h2 className="text-xl font-bold mb-3">🚗 Travel Details</h2>

          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="text-sm text-gray-300">From City</label>
              <input
                className="p-2 text-black rounded w-full"
                value={from}
                onChange={e => setFrom(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-gray-300">To City</label>
              <input
                className="p-2 text-black rounded w-full"
                value={to}
                onChange={e => setTo(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-gray-300">Mode</label>
              <select
                className="p-2 text-black rounded w-full"
                value={mode}
                onChange={e => setMode(e.target.value)}
              >
                <option value="flight">Flight ✈️</option>
                <option value="train">Train 🚆</option>
                <option value="bus">Bus 🚌</option>
                <option value="car">Car 🚗</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-300">
                Travel Budget (₹)
              </label>
              <input
                type="number"
                className="p-2 text-black rounded w-full"
                value={travelBudget}
                onChange={e => setTravelBudget(Number(e.target.value))}
              />
            </div>

            <div className="col-span-2">
              <label className="text-sm text-gray-300">
                👥 Number of Travelers
              </label>
              <input
                type="number"
                className="p-2 text-black rounded w-full"
                value={travelers}
                onChange={e => setTravelers(Number(e.target.value))}
              />
            </div>

          </div>
        </div>

        {/* 🏨 HOTEL */}
        <div>
          <h2 className="text-xl font-bold mb-3">🏨 Hotel Details</h2>

          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="text-sm text-gray-300">Number of Days</label>
              <input
                type="number"
                className="p-2 text-black rounded w-full"
                value={days}
                onChange={e => setDays(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="text-sm text-gray-300">
                Hotel Budget (₹)
              </label>
              <input
                type="number"
                className="p-2 text-black rounded w-full"
                value={hotelBudget}
                onChange={e => setHotelBudget(Number(e.target.value))}
              />
            </div>

          </div>
        </div>

        {/* BUTTON */}
        <button
          onClick={search}
          className="bg-purple-500 px-6 py-3 rounded w-full font-bold hover:bg-purple-600"
        >
          🔍 Search Options
        </button>

      </div>

      {/* ================= RESULTS ================= */}
      {result && (
        <div className="max-w-4xl mx-auto mt-8 space-y-6">

          {/* 🚗 TRAVEL */}
          <div className="bg-black/30 p-5 rounded-xl">
            <h2 className="text-xl font-bold mb-3">🚗 Choose Travel</h2>

            {result.travel.map((t, i) => (
              <div
                key={i}
                className="bg-white/10 p-4 mb-3 rounded flex justify-between items-center"
              >
                <div>
                  <p className="font-bold">{t.company}</p>
                  <p className="text-sm">⏱ {t.time}</p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-green-400">₹{t.price}</p>

                  <button
                    onClick={() => setSelectedTravel(t)}
                    className="bg-purple-500 px-3 py-1 rounded text-sm mt-1"
                  >
                    Select
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 🏨 HOTEL */}
          <div className="bg-black/30 p-5 rounded-xl">
            <h2 className="text-xl font-bold mb-3">🏨 Choose Hotel</h2>

            {result.hotels.map((h, i) => (
              <div
                key={i}
                className="bg-white/10 p-4 mb-3 rounded flex justify-between items-center"
              >
                <div>
                  <p className="font-bold">{h.name}</p>
                  <p className="text-sm">₹{h.pricePerDay} / night</p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-green-400">₹{h.total}</p>

                  <button
                    onClick={() => setSelectedHotel(h)}
                    className="bg-green-500 px-3 py-1 rounded text-sm mt-1"
                  >
                    Select
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 🧾 SUMMARY */}
          {(selectedTravel || selectedHotel) && (
            <div className="bg-yellow-500/20 p-5 rounded-xl">
              <h2 className="text-xl font-bold mb-3">
                🧾 Your Selection
              </h2>

              {selectedTravel && (
                <p>
                  🚗 {selectedTravel.company} — ₹{selectedTravel.price}
                </p>
              )}

              {selectedHotel && (
                <p>
                  🏨 {selectedHotel.name} — ₹{selectedHotel.total}
                </p>
              )}

              <button className="bg-green-600 px-4 py-2 mt-3 rounded">
                ✅ Confirm Booking
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}