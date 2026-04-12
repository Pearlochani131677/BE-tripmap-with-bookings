import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import ProfileAnalytics from "./ProfileAnalytics";
import jsPDF from "jspdf";
const FOOD_DB = {
  mumbai: {
    veg: ["Vada Pav", "Pav Bhaji", "Misal Pav", "Bombay Sandwich"],
    jain: ["Jain Pav Bhaji", "Jain Bhel", "Sabudana Khichdi"],
    nonveg: ["Bombil Fry", "Chicken Tikka", "Butter Chicken", "Fish Curry"]
  },

  goa: {
    veg: ["Goan Veg Thali", "Bebinca Dessert", "Poi Bread"],
    jain: ["Jain Veg Thali", "Coconut Veg Curry"],
    nonveg: ["Goan Fish Curry", "Prawn Balchao", "Chicken Cafreal"]
  },

  manali: {
    veg: ["Siddu", "Rajma Chawal", "Veg Momos"],
    jain: ["Plain Paratha", "Dal Rice", "Fruit Bowl"],
    nonveg: ["Trout Fish", "Chicken Curry", "Himalayan Mutton"]
  }
};
function getFoodSuggestions(destination, type) {
  const city = destination.toLowerCase();
  const db = FOOD_DB[city];

  if (!db) return ["Local Special Dish"];

  return db[type] || db["veg"];
}
function FloatingAIPanel({ journal, budget, itinerary }) {
  if (!journal && !itinerary) return null;

  const estimated =
  itinerary?.reduce((sum, d) => {
    return sum + d.schedule.reduce((s, slot) => s + (slot.cost || 0), 0);
  }, 0) || 0;

  const percent = Math.min(Math.round((estimated / budget) * 100), 100);

  const barColor =
    percent > 90
      ? "bg-red-500"
      : percent > 70
        ? "bg-yellow-400"
        : "bg-green-500";

  return (
    <div className="hidden lg:block fixed top-24 right-6 w-80 z-50">
      <div className="bg-black/70 backdrop-blur-xl border border-purple-400/30 rounded-2xl shadow-2xl p-4 space-y-4">
        {/* JOURNAL */}
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            📖 AI Journal
            <span className="text-xs bg-purple-500/30 px-2 py-1 rounded-full">
              Live
            </span>
          </h2>

          <div className="text-sm text-gray-200 max-h-48 overflow-y-auto mt-2 whitespace-pre-line leading-relaxed">
            {journal || "AI is waiting for your plan..."}
          </div>
        </div>

        {/* BUDGET METER */}
        <div>
          <h2 className="text-lg font-bold mb-1">💰 Budget Meter</h2>

          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
            <div
              className={`${barColor} h-3 transition-all duration-700`}
              style={{ width: `${percent}%` }}
            />
          </div>

          <p className="text-sm mt-1 text-gray-300">
            {percent}% of budget estimated used
          </p>
        </div>

        {/* AI INSIGHTS */}
        <div>
          <h2 className="text-lg font-bold mb-1">🧠 AI Insights</h2>
          <ul className="text-sm text-gray-300 list-disc pl-4 space-y-1">
            {budget < 3000 && <li>Low budget detected</li>}
            {itinerary?.length >= 3 && <li>Multi-day trip optimized</li>}
            {itinerary?.some((d) =>
              d.schedule.some((s) => s.activity.includes("🏥")),
            ) && <li>Medical safety anchors active</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

function predictCrowd(activity) {
  if (!activity) return "Unknown";

  const name = activity.toLowerCase();

  if (
    name.includes("market") ||
    name.includes("bazaar") ||
    name.includes("shopping") ||
    name.includes("temple")
  ) {
    return "High Crowd";
  }

  if (
    name.includes("beach") ||
    name.includes("park") ||
    name.includes("nature")
  ) {
    return "Medium Crowd";
  }

  if (
    name.includes("museum") ||
    name.includes("viewpoint") ||
    name.includes("cafe")
  ) {
    return "Low Crowd";
  }

  return "Medium Crowd";
}

function resolveConflicts(itinerary, travelers, budget, days, childMode) {
  let resolutions = [];
  let modified = JSON.parse(JSON.stringify(itinerary || []));

  if (!modified.length) return { modified, resolutions };

  const likes = travelers.flatMap((t) =>
    (t.likes || "")
      .toLowerCase()
      .split(",")
      .map((l) => l.trim()),
  );

  const dislikes = travelers.flatMap((t) =>
    (t.dislikes || "")
      .toLowerCase()
      .split(",")
      .map((d) => d.trim()),
  );

  // ---------------- CHILD MODE FILTER ----------------
  if (childMode) {
    const unsafe = ["trek", "paragliding", "rohtang", "snow", "adventure"];

    modified.forEach((day) => {
      day.schedule.forEach((slot) => {
        if (unsafe.some((u) => slot.activity.toLowerCase().includes(u))) {
          slot.activity = "🏥 Child-Friendly Park & Family Cafe";
          resolutions.push(
            "🧒 Child Mode: Risky activity replaced with park & family-friendly cafe",
          );
        }
      });
    });
  }

  // ---------------- LOW BUDGET + LUXURY ----------------
  if (budget < 3000 && likes.includes("luxury")) {
    modified.forEach((day) => {
      day.schedule.forEach((slot) => {
        if (slot.activity.toLowerCase().includes("cruise")) {
          slot.activity = "Scenic Viewpoint & Beach Café";
          resolutions.push(
            "⚖ Budget Conflict: Cruise replaced with Scenic Viewpoint & Café",
          );
        }
      });
    });
  }

  // ---------------- LOW STAMINA ----------------
  if (days >= 3 && travelers.some((t) => t.stamina === "low")) {
    modified.forEach((day) => {
      day.schedule.splice(2, 0, {
        time: "14:00",
        activity: "Rest & Hotel Relaxation",
        cost: 0,
      });
    });

    resolutions.push(
      "⚖ Stamina Conflict: Added rest breaks due to low stamina travelers",
    );
  }

  // ---------------- WATER CONFLICT ----------------
  if (likes.includes("water") && dislikes.includes("water")) {
    resolutions.push(
      "⚖ Water Conflict: Swimmers enjoy water while others relax at cafés & beach walks",
    );
  }

  return { modified, resolutions };
}

function exportPDF(itinerary, destination) {
  const doc = new jsPDF();
  doc.text(`AI Travel Pro — ${destination}`, 10, 10);

  let y = 20;
  itinerary.forEach((day) => {
    doc.text(day.day, 10, y);
    y += 8;

    day.schedule.forEach((s) => {
      doc.text(`- ${s.time}: ${s.activity}`, 12, y);
      y += 6;
    });
    y += 6;
  });

  doc.save("itinerary.pdf");
}
function estimateCostValue(activity) {
  if (!activity) return 0;
  const name = activity.toLowerCase();

  if (name.includes("sightseeing") || name.includes("local")) return 50;
  if (name.includes("beach")) return 20;
  if (name.includes("water") || name.includes("swim") || name.includes("boat"))
    return 500;
  if (
    name.includes("food") ||
    name.includes("cafe") ||
    name.includes("restaurant")
  )
    return 400;
  if (name.includes("temple") || name.includes("museum")) return 50;
  if (
    name.includes("market") ||
    name.includes("shopping") ||
    name.includes("bazaar")
  )
    return 0;
  if (name.includes("transport") || name.includes("ride")) return 150;
  if (
    name.includes("park") ||
    name.includes("nature") ||
    name.includes("viewpoint")
  )
    return 30;

  return 200;
}

function estimateCost(activity) {
  if (!activity) return "₹0";

  const name = activity.toLowerCase();

  // Sightseeing
  if (name.includes("sightseeing") || name.includes("local")) {
    return "₹0 – ₹100 (Entry Tickets)";
  }

  // Beach
  if (name.includes("beach")) {
    return "₹0 – ₹50 (Public Entry)";
  }

  // Water Activities
  if (
    name.includes("water") ||
    name.includes("swim") ||
    name.includes("boat")
  ) {
    return "₹300 – ₹800 (Activities)";
  }

  // Food
  if (
    name.includes("food") ||
    name.includes("cafe") ||
    name.includes("restaurant")
  ) {
    return "₹300 – ₹500 (Per Person)";
  }

  // Temple / Museum
  if (name.includes("temple") || name.includes("museum")) {
    return "₹0 – ₹100 (Donation / Ticket)";
  }

  // Markets
  if (
    name.includes("market") ||
    name.includes("shopping") ||
    name.includes("bazaar")
  ) {
    return "₹0+ (Depends on Shopping)";
  }

  // Transport
  if (
    name.includes("transport") ||
    name.includes("travel") ||
    name.includes("ride")
  ) {
    return "₹50 – ₹200 (Local Transport)";
  }

  // Nature / Park
  if (
    name.includes("park") ||
    name.includes("nature") ||
    name.includes("viewpoint")
  ) {
    return "₹0 – ₹50 (Entry Fee)";
  }

  // Default
  return "₹100 – ₹300 (Approx)";
}
function predictSpending(itinerary, budget) {
  if (!itinerary) return null;

  const estimated = itinerary.reduce((sum, day) => {
    return (
      sum +
      day.schedule.reduce((s, slot) => s + estimateCostValue(slot.activity), 0)
    );
  }, 0);

  const diff = estimated - budget;

  return {
    estimated,
    diff,
  };
}

function smartTravelTips(itinerary, travelers, destination) {
  let tips = [];

  const genders = travelers.map((t) => t.gender);
  const allText = JSON.stringify(itinerary).toLowerCase();
  const place = destination.toLowerCase();

  // Temple logic
  if (allText.includes("temple")) {
    if (genders.includes("female")) {
      tips.push(
        "🛕 Temple Visit: Ladies should wear kurti or full-length clothes and carry a dupatta/scarf.",
      );
    }
    if (genders.includes("male")) {
      tips.push(
        "🛕 Temple Visit: Gents should wear kurta or full-length traditional/formal clothing.",
      );
    }
    tips.push(
      "🛕 Remove footwear before entering temples and follow local customs.",
    );
  }

  // Beach logic
  if (allText.includes("beach")) {
    tips.push(
      "🏖 Beach Trip: Carry towel, extra clothes, slippers, sunscreen, and a water bottle.",
    );
    tips.push(
      "🏖 Avoid swimming in restricted zones and follow lifeguard flags.",
    );
  }

  // Hill station / monkeys logic
  if (
    place.includes("matheran") ||
    place.includes("hill") ||
    place.includes("mount") ||
    allText.includes("hill")
  ) {
    tips.push(
      "🏞 Hill Station: Beware of monkeys, keep food in closed bags, and wear good grip shoes.",
    );
    tips.push("🏞 Carry light jackets and rain protection.");
  }

  // Food allergies
  travelers.forEach((t) => {
    if (t.allergies) {
      tips.push(
        `🍽 ${t.name || "Traveler"} has allergies: ${t.allergies}. Inform restaurants before ordering.`,
      );
    }
  });

  return tips;
}
function medicalAdvisor(itinerary, travelers, destination) {
  let alerts = [];

  const allText = JSON.stringify(itinerary || "").toLowerCase();
  const place = destination.toLowerCase();

  travelers.forEach((t, i) => {
    const name = t.name || `Traveler ${i + 1}`;
    const age = Number(t.age || 0);
    const health = (t.health || "").toLowerCase();

    // Age-based rules
    if (age >= 50 && (allText.includes("hill") || allText.includes("trek"))) {
      alerts.push(
        `⚠ ${name}: Hilly/Trek activities restricted due to age (${age}). Consider viewpoints or cultural spots instead.`,
      );
    }

    if (age <= 12 && (allText.includes("water") || allText.includes("trek"))) {
      alerts.push(
        `⚠ ${name}: Risky activities not recommended for children. Prefer parks, beaches, and museums.`,
      );
    }

    // Health-based rules
    if (health.includes("bp") || health.includes("heart")) {
      alerts.push(
        `🫀 ${name}: Avoid high-stamina or high-altitude activities. Schedule rest breaks and carry emergency medicine.`,
      );
    }

    if (health.includes("asthma")) {
      alerts.push(
        `🌬 ${name}: Carry inhaler. Avoid dusty markets, long treks, and cold hill areas.`,
      );
    }

    if (health.includes("knee") || health.includes("joint")) {
      alerts.push(
        `🦵 ${name}: Avoid long walks and stairs. Prefer vehicle-accessible attractions.`,
      );
    }

    // Universal reminders
    if (health || age >= 50) {
      alerts.push(
        `💊 Reminder for ${name}: Carry all prescribed medicines, doctor contact, and ID card.`,
      );
    }
  });

  // Destination-based general warning
  if (place.includes("hill") || place.includes("mount")) {
    alerts.push(
      "🏔 Hill Travel: Carry warm clothes, good shoes, and stay hydrated.",
    );
  }

  return alerts;
}

/* ================= PHOTO HELPERS (UPDATED) ================= */

async function fetchDestinationImage(destination) {
  try {
    const res = await axios.get(
      `http://localhost:5000/api/place-image?place=${encodeURIComponent(
        destination + " tourism",
      )}`,
    );
    return res.data.imageUrl;
  } catch {
    return "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee";
  }
}

async function fetchActivityImage(activity, destination) {
  try {
    const res = await axios.get(
      `http://localhost:5000/api/place-image?place=${encodeURIComponent(
        `${destination} ${activity} landmark`,
      )}`,
    );
    return res.data.imageUrl;
  } catch {
    return "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee";
  }
}

export default function Planner() {
  const [travelers, setTravelers] = useState([
    {
      name: "",
      age: "",
      gender: "female",
      stamina: "medium",
      likes: "",
      dislikes: "",
      allergies: "",
    },
  ]);
  const [foodType, setFoodType] = useState("veg");
  const [childMode, setChildMode] = useState(false);
  const [journal, setJournal] = useState("");
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(2);
  const [budget, setBudget] = useState(2000);
  const [result, setResult] = useState(null);
  const [activeDay, setActiveDay] = useState(0);
  const [mapQuery, setMapQuery] = useState("");
  const [activityImages, setActivityImages] = useState({});
  const [destinationImage, setDestinationImage] = useState("");

  /* ================= LOAD ACTIVITY IMAGES (UPDATED) ================= */
  useEffect(() => {
    if (!result?.itinerary || !destination) return;

    const loadImages = async () => {
      const images = {};

      const uniqueActivities = new Set();
      result.itinerary.forEach((d) =>
        d.schedule.forEach((s) => uniqueActivities.add(s.activity)),
      );

      for (const activity of uniqueActivities) {
        const key = `${destination}-${activity}`;
        images[key] = await fetchActivityImage(activity, destination);
      }

      setActivityImages(images);
    };

    loadImages();
  }, [result, destination]);

  useEffect(() => {
    if (!destination) return;

    fetchDestinationImage(destination).then(setDestinationImage);
  }, [destination]);

  useEffect(() => {
    axios.get("http://localhost:5000/history").then((res) => {
      if (res.data.length > 0) {
        const last = res.data[0];
        setDestination(last.destination);
        setBudget(last.budget);
      }
    });
  }, []);

  const addTraveler = () => {
    if (travelers.length < 5) {
      setTravelers([...travelers, { name: "", stamina: "medium" }]);
    }
  };

  const submit = async () => {
    try {
      const res = await axios.post("http://localhost:5000/plan", {
        destination,
        travelers,
        days,
        budget,
        childMode,
      });

      const resolved = resolveConflicts(
        res.data.itinerary,
        travelers,
        budget,
        days,
        childMode,
      );

      // 🔥 THIS WAS MISSING
      setResult({
        ...res.data,
        itinerary: resolved.modified,
        resolutions: resolved.resolutions,
      });

      window.currentDestination = destination;
      window.currentBudget = budget;
      window.currentTravelers = travelers;
      window.currentItinerary = resolved.modified;

      setActiveDay(0);
      setJournal(
        "🧠 AI is writing your travel story...\n\n" + res.data.journal,
      );
    } catch (err) {
      alert("Backend not reachable. Make sure server is running.");
    }
  };

  const perDay = Math.floor(budget / days);
  const perPerson = Math.floor(budget / travelers.length || 1);
  function explainPlan(itinerary, travelers, budget, stamina) {
    let reasons = [];

    reasons.push(
      `We detected group stamina as "${stamina}" based on traveler inputs.`,
    );

    if (budget < 3000) {
      reasons.push(
        "Budget is limited — free & low-cost activities prioritized.",
      );
    } else {
      reasons.push("Budget allows paid experiences and premium activities.");
    }

    const likes = travelers.map((t) => t.likes).join(" ");
    if (likes.toLowerCase().includes("water")) {
      reasons.push("Water-based activities included due to traveler interest.");
    }

    reasons.push(
      `Itinerary is balanced across ${itinerary.length} days for comfort and variety.`,
    );

    return reasons;
  }
  function analyzePreferences(travelers) {
    const likes = travelers.flatMap((t) =>
      t.likes
        .toLowerCase()
        .split(",")
        .map((l) => l.trim()),
    );

    const dislikes = travelers.flatMap((t) =>
      t.dislikes
        .toLowerCase()
        .split(",")
        .map((d) => d.trim()),
    );

    let suggestions = [];

    if (likes.includes("water") || likes.includes("swimming")) {
      if (dislikes.includes("water") || dislikes.includes("swimming")) {
        suggestions.push(
          "🏖 Beach Visit: Some travelers can swim while others enjoy sand walks, cafes, and sunset viewpoints.",
        );
      } else {
        suggestions.push(
          "🌊 Water Activities: Jet skiing, swimming, and beach games.",
        );
      }
    }

    if (likes.includes("nature")) {
      suggestions.push("🌿 Nature Walks and Scenic Viewpoints.");
    }

    if (likes.includes("shopping")) {
      suggestions.push("🛍 Local Markets and Cultural Streets.");
    }

    return suggestions;
  }
  function nearbySuggestions(activity, destination) {
    const name = activity.toLowerCase();
    const city = destination.toLowerCase();

    const DB = {
      matheran: {
        lake: [
          "Charlotte Lake Snacks Stall",
          "Toy Train Station",
          "Forest Café",
        ],
        point: ["Panorama View Café", "Photography Spot", "Local Guide Booth"],
        park: ["Children’s Garden", "Ice Cream Vendor", "Rest Shelter"],
        hospital: ["Medical Store", "Taxi Stand", "Pharmacy"],
      },
      goa: {
        beach: ["Beach Shack Café", "Sunbed Rental", "Water Sports Desk"],
        fort: ["Heritage Guide", "Souvenir Shop", "Viewpoint Café"],
      },
    };

    const cityDB = DB[city];
    if (!cityDB) return ["Local Café", "Taxi Stand", "Tourist Help Desk"];

    for (const key in cityDB) {
      if (name.includes(key)) return cityDB[key];
    }

    return ["Tourist Help Desk", "Local Café", "Taxi Stand"];
  }
  {
    journal && (
      <div className="max-w-4xl mx-auto bg-yellow-500/20 p-6 rounded-2xl mb-6">
        <h2 className="text-2xl font-bold mb-3">📖 AI Travel Journal</h2>
        <pre className="text-gray-200 whitespace-pre-wrap">{journal}</pre>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 p-10">
      <FloatingAIPanel
        journal={journal}
        budget={budget}
        itinerary={result?.itinerary}
      />

      {/* AI JOURNAL PANEL */}
      {/* {journal && (
        <div className="max-w-4xl mx-auto bg-yellow-500/20 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-xl border border-yellow-400/30">
          <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
            📖 AI Travel Journal
            <span className="text-sm bg-yellow-400/30 px-2 py-1 rounded-full">
              Live AI
            </span>
          </h2>

          <p className="text-gray-200 whitespace-pre-line leading-relaxed">
            {journal}
          </p>
        </div>
      )} */}
      <h1 className="text-4xl font-bold mb-6 text-center">
        AI Travel Planner — Personalized Group Trip Assistant
      </h1>

      {/* INPUT CARD */}

      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl mb-10">
        <div className="mb-4">
          <label className="block mb-1 text-gray-300">
            📍 Destination City / Place
          </label>
          <input
            className="p-3 rounded text-black w-full"
            placeholder="Example: Goa, Matheran, Jaipur, Varanasi"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
          <p className="text-sm text-gray-400 mt-1">
            This helps us find real attractions and map locations
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 text-gray-300">
              🗓 Trip Duration (in Days)
            </label>
            <input
              className="p-3 rounded text-black w-full"
              type="number"
              min="1"
              placeholder="Example: 2"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
            <p className="text-sm text-gray-400 mt-1">
              We’ll create a full day-by-day & hour-by-hour plan
            </p>
          </div>

          <div>
            <label className="block mb-1 text-gray-300">
              💰 Total Group Budget (₹)
            </label>
            <input
              className="p-3 rounded text-black w-full"
              type="number"
              min="100"
              placeholder="Example: 5000"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
            />
            <p className="text-sm text-gray-400 mt-1">
              We’ll split this across food, travel & activities
            </p>
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-4">
          🧍 Traveler Details & Preferences
        </h2>
        <button
          onClick={() => setChildMode(!childMode)}
          className={`px-4 py-2 rounded mb-4 font-bold ${
            childMode ? "bg-green-500" : "bg-gray-500"
          }`}
        >
          🧒 Child-Friendly Mode: {childMode ? "ON" : "OFF"}
        </button>

        <p className="text-gray-300 mb-4">
          Enter each traveler's stamina, interests, and restrictions so the AI
          can intelligently merge preferences and resolve conflicts.
        </p>

        {travelers.map((t, i) => (
          <div key={i} className="bg-black/30 p-4 rounded-xl mb-4 space-y-3">
            <h3 className="font-bold text-purple-300">Traveler {i + 1}</h3>

            <div className="flex gap-3">
              <input
                className="p-2 rounded text-black w-full"
                placeholder="Name"
                value={t.name}
                onChange={(e) => {
                  const copy = [...travelers];
                  copy[i].name = e.target.value;
                  setTravelers(copy);
                }}
              />

              <input
                type="number"
                className="p-2 rounded text-black w-32"
                placeholder="Age"
                value={t.age}
                onChange={(e) => {
                  const copy = [...travelers];
                  copy[i].age = e.target.value;
                  setTravelers(copy);
                }}
              />
            </div>
            <select
              className="p-2 rounded text-black w-40"
              value={t.gender}
              onChange={(e) => {
                const copy = [...travelers];
                copy[i].gender = e.target.value;
                setTravelers(copy);
              }}
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
            <div>
              <label className="block mb-1 text-sm text-gray-300">
                Choose Stamina Level
              </label>
              <select
                className="p-2 rounded text-black w-full"
                value={t.stamina}
                onChange={(e) => {
                  const copy = [...travelers];
                  copy[i].stamina = e.target.value;
                  setTravelers(copy);
                }}
              >
                <option value="low">Low (Relaxed)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="high">High (Explorer)</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-300">
                Likes (comma separated)
              </label>
              <input
                className="p-2 rounded text-black w-full"
                placeholder="Beaches, Cafes, Swimming, Nature"
                value={t.likes}
                onChange={(e) => {
                  const copy = [...travelers];
                  copy[i].likes = e.target.value;
                  setTravelers(copy);
                }}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-300">
                Dislikes
              </label>
              <input
                className="p-2 rounded text-black w-full"
                placeholder="Crowds, Water activities, Spicy food"
                value={t.dislikes}
                onChange={(e) => {
                  const copy = [...travelers];
                  copy[i].dislikes = e.target.value;
                  setTravelers(copy);
                }}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-300">
                Allergies / Restrictions
              </label>
              <input
                className="p-2 rounded text-black w-full"
                placeholder="Seafood allergy, Knee pain, Religious restrictions"
                value={t.allergies}
                onChange={(e) => {
                  const copy = [...travelers];
                  copy[i].allergies = e.target.value;
                  setTravelers(copy);
                }}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-300">
                Health Issues / Conditions
              </label>
              <input
                className="p-2 rounded text-black w-full"
                placeholder="BP, Diabetes, Asthma, Knee pain, Heart condition"
                value={t.health || ""}
                onChange={(e) => {
                  const copy = [...travelers];
                  copy[i].health = e.target.value;
                  setTravelers(copy);
                }}
              />
            </div>
          </div>
        ))}

        <button
          onClick={addTraveler}
          className="bg-purple-500 px-4 py-2 rounded mb-4"
        >
          + Add Traveler
        </button>

        <button
          onClick={submit}
          className="bg-green-500 px-6 py-3 rounded block w-full font-bold hover:bg-green-600 transition"
        >
          Generate Itinerary
        </button>
      </div>

      {/* BUDGET SUMMARY */}
      {result?.resolutions?.length > 0 && (
        <div className="max-w-4xl mx-auto bg-red-500/20 p-6 rounded-2xl mb-6">
          <h2 className="text-2xl font-bold mb-3">⚖ Smart Conflict Resolver</h2>
          {result.resolutions.map((r, i) => (
            <p key={i} className="text-gray-200 mb-2">
              {r}
            </p>
          ))}
        </div>
      )}

      <ProfileAnalytics travelers={travelers} />
      {result && (
        <div className="max-w-4xl mx-auto flex gap-4 mb-6">
          <button
            className="bg-purple-500 px-4 py-2 rounded"
            onClick={() => exportPDF(result.itinerary, destination)}
          >
            📄 Export PDF
          </button>

          <a
            className="bg-green-500 px-4 py-2 rounded"
            href={`https://wa.me/?text=${encodeURIComponent(
              `My Trip to ${destination}:\n` +
                JSON.stringify(result.itinerary, null, 2),
            )}`}
            target="_blank"
          >
            📲 Share on WhatsApp
          </a>
        </div>
      )}

      {result && (
        <div className="max-w-4xl mx-auto bg-green-500/20 p-6 rounded-2xl mb-6">
          <h2 className="text-2xl font-bold mb-3">
            🧠 AI Group Intelligence Suggestions
          </h2>
          {analyzePreferences(travelers).map((s, i) => (
            <p key={i} className="text-gray-200 mb-2">
              {s}
            </p>
          ))}
        </div>
      )}
      {result && (
        <div className="max-w-4xl mx-auto bg-blue-500/20 p-6 rounded-2xl mb-6">
          <h2 className="text-2xl font-bold mb-3">🧳 Smart Travel Advisor</h2>
          {smartTravelTips(result.itinerary, travelers, destination).map(
            (t, i) => (
              <p key={i} className="text-gray-200 mb-2">
                {t}
              </p>
            ),
          )}
        </div>
      )}
      {result && (
        <div className="max-w-4xl mx-auto bg-red-500/20 p-6 rounded-2xl mb-6">
          <h2 className="text-2xl font-bold mb-3">
            🏥 Health & Safety Advisor
          </h2>

          {medicalAdvisor(result.itinerary, travelers, destination).length ===
            0 && (
            <p className="text-gray-200">
              ✅ No medical or age-based travel restrictions detected.
            </p>
          )}

          {medicalAdvisor(result.itinerary, travelers, destination).map(
            (a, i) => (
              <p key={i} className="text-gray-200 mb-2">
                {a}
              </p>
            ),
          )}
        </div>
      )}
      {result?.medical?.warnings?.length > 0 && (
        <div className="max-w-4xl mx-auto bg-red-500/20 p-6 rounded-2xl mb-6">
          <h2 className="text-2xl font-bold mb-3">🏥 Medical AI Warnings</h2>
          {result.medical.warnings.map((w, i) => (
            <p key={i} className="text-red-200 mb-2">
              {w}
            </p>
          ))}
        </div>
      )}

      {result && destinationImage && (
        <div className="max-w-4xl mx-auto mb-6">
          <img
            src={destinationImage}
            alt={destination}
            className="w-full h-72 object-cover rounded-2xl shadow-xl"
          />
        </div>
      )}

      {result && (
        <div className="max-w-4xl mx-auto bg-white/10 p-6 rounded-2xl mb-6">
          <h2 className="text-2xl font-bold mb-4">💰 Budget Summary</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-black/30 p-4 rounded-xl">
              <p className="text-gray-300">Total Budget</p>
              <p className="text-xl font-bold">₹{budget}</p>
            </div>
            <div className="bg-black/30 p-4 rounded-xl">
              <p className="text-gray-300">Per Day</p>
              <p className="text-xl font-bold">₹{perDay}</p>
            </div>
            <div className="bg-black/30 p-4 rounded-xl">
              <p className="text-gray-300">Per Person</p>
              <p className="text-xl font-bold">₹{perPerson}</p>
            </div>
          </div>
        </div>
      )}

      {/* DAY TABS */}
      {result && (
        <div className="max-w-4xl mx-auto mb-6 flex gap-2 justify-center">
          {result.itinerary.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveDay(i)}
              className={`px-5 py-2 rounded-full font-bold transition ${
                activeDay === i
                  ? "bg-purple-500"
                  : "bg-black/30 hover:bg-black/50"
              }`}
            >
              Day {i + 1}
            </button>
          ))}
        </div>
      )}
      {result && (
        <button
          onClick={() =>
            alert(
              explainPlan(
                result.itinerary,
                travelers,
                budget,
                result.stamina,
              ).join("\n\n"),
            )
          }
          className="bg-yellow-500 px-5 py-2 rounded mb-4"
        >
          🧠 Explain This Itinerary
        </button>
      )}

      {/* ITINERARY CARDS */}

      {result && (
        <div className="max-w-4xl mx-auto space-y-4">
          {result.itinerary[activeDay].schedule.map((slot, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-gradient-to-r from-purple-800/60 to-indigo-800/60 
             backdrop-blur-xl p-4 rounded-2xl shadow-2xl 
             hover:scale-[1.02] transition-all
             flex flex-col md:flex-row gap-4 items-center"
            >
              <div className="text-sm text-orange-300 mt-1">
                👥 Crowd Level: {predictCrowd(slot.activity)}
              </div>

              {activityImages[`${destination}-${slot.activity}`] && (
                <img
                  src={activityImages[`${destination}-${slot.activity}`]}
                  alt={slot.activity}
                  className="w-full md:w-44 h-32 object-cover rounded-2xl shadow-md"
                />
              )}

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-yellow-300 font-bold text-sm">
                    ⏰ {slot.time}
                  </p>

                  <span className="text-green-400 font-bold text-sm">
                      ₹{slot.cost}
                  </span>
                </div>

                <button
                  onClick={() =>
                    setMapQuery(`${slot.activity} near ${destination}`)
                  }
                  className="text-lg font-bold text-white hover:text-purple-300 transition"
                >
                  📍 {slot.activity}
                </button>
                  {/* food */}
                  {/* FOOD SUGGESTIONS */}
{/* FOOD SUGGESTIONS */}
{/* FOOD SECTION — SHOW ONLY WHEN BACKEND SENDS FOOD */}
{(slot.activity?.toLowerCase().includes("breakfast") ||
  slot.activity?.toLowerCase().includes("lunch") ||
  slot.activity?.toLowerCase().includes("dinner")) && (
  <div className="mt-2">

    <div className="flex gap-2 mb-2">
      <button onClick={()=>setFoodType("veg")}
        className="bg-green-600 px-2 py-1 rounded text-xs">Veg</button>

      <button onClick={()=>setFoodType("jain")}
        className="bg-yellow-600 px-2 py-1 rounded text-xs">Jain</button>

      <button onClick={()=>setFoodType("nonveg")}
        className="bg-red-600 px-2 py-1 rounded text-xs">Non-Veg</button>
    </div>

    <div className="text-sm text-yellow-300 font-semibold">
      🍽 {slot.activity} at {slot.place || "Local Restaurant"}
    </div>

    <div className="text-xs text-gray-300 mt-1">
      Try: {getFoodSuggestions(destination, foodType).join(", ")}
    </div>

  </div>
)} 
                <p className="text-sm text-gray-300 mt-1">
                  Nearby:{" "}
                  {nearbySuggestions(slot.activity, destination).join(", ")}
                </p>

                <div className="flex justify-between items-center mt-3">
                  <span className="text-orange-300 text-sm">
                    👥 {predictCrowd(slot.activity)}
                  </span>

                  {slot.activity.includes("🏥") && (
                    <span className="text-red-300 text-xs">Medical Safe</span>
                  )}

                  {slot.activity.includes("🍽") && (
                    <span className="text-yellow-300 text-xs">Food Anchor</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {result &&
        (() => {
          const budgetAI = result?.budgetAI;
          return (
            <div className={`max-w-4xl mx-auto p-4 rounded-xl mb-6 ${
  budgetAI?.status === "OVER_BUDGET"
    ? "bg-red-500/30"
    : "bg-green-500/30"
}`}>
  <h3 className="font-bold text-lg">
    {budgetAI?.status === "OVER_BUDGET"
      ? `⚠ Over budget by ₹${budgetAI.estimated - budget}`
      : budgetAI?.status === "UNDERUTILIZED"
      ? `💡 You are underusing budget`
      : `✅ Budget well optimized`}
  </h3>

  <p>Estimated Spend: ₹{budgetAI?.estimated}</p>

  <p className="text-sm mt-2">
    🍽 Food: ₹{budgetAI?.breakdown?.food} | 🚕 Travel: ₹{budgetAI?.breakdown?.travel} | 🎯 Activities: ₹{budgetAI?.breakdown?.activities}
  </p>
</div>
          );
        })()}

      {/* MAP PREVIEW */}
      {destination && (
        <div className="max-w-4xl mx-auto mt-10 bg-white/10 p-6 rounded-2xl">
          <h2 className="text-2xl font-bold mb-4">🗺 Location Preview</h2>
          <iframe
            className="w-full h-80 rounded-xl"
            src={`https://maps.google.com/maps?q=${mapQuery || destination}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
          />
        </div>
      )}
    </div>
  );
}
