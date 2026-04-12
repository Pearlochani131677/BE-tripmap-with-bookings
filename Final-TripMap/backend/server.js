const { recommend } = require("./ai/recommendation");
const { predictBudget } = require("./ai/budgetAI");
const { predictCrowd } = require("./ai/crowdAI");
const { generateJournal } = require("./ai/journalAI");
const { detectEmotion } = require("./ai/emotionAI");

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const axios = require("axios");
const { calculateRiskScore } = require("./healthAI");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database("memory.db");
const ACTIVITY_DB = {
  zoo: { fun: 0.9, comfort: 0.8, risk: 0.1 },
  museum: { fun: 0.7, comfort: 0.9, risk: 0.1 },
  park: { fun: 0.85, comfort: 0.7, risk: 0.1 },
  beach: { fun: 0.9, comfort: 0.6, risk: 0.3 },
  trek: { fun: 0.6, comfort: 0.2, risk: 0.8 },
  waterfall: { fun: 0.8, comfort: 0.4, risk: 0.6 },
  mall: { fun: 0.6, comfort: 0.9, risk: 0.1 },
  temple: { fun: 0.5, comfort: 0.7, risk: 0.1 },
  fort: { fun: 0.7, comfort: 0.5, risk: 0.4 },
};

function detectLanguage(text) {
  // If it contains Devanagari Unicode → Hindi
  return /[\u0900-\u097F]/.test(text) ? "hi" : "en";
}

function predictSafety(activity, childAge, health) {
  const name = activity.toLowerCase();

  let risk = 0.2;

  if (name.includes("trek") || name.includes("paragliding")) risk += 0.5;
  if (
    name.includes("water") ||
    name.includes("beach") ||
    name.includes("waterfall")
  )
    risk += 0.3;
  if (name.includes("hill") || name.includes("pass")) risk += 0.4;

  if (childAge <= 10) risk += 0.2;
  if (health.includes("asthma") || health.includes("heart")) risk += 0.3;

  return Math.min(risk, 1);
}
function dualScore(activity, childAge, health) {
  const name = activity.toLowerCase();

  let profile = { fun: 0.5, comfort: 0.5, risk: 0.3 };

  for (const key in ACTIVITY_DB) {
    if (name.includes(key)) {
      profile = ACTIVITY_DB[key];
      break;
    }
  }

  const safety = 1 - predictSafety(activity, childAge, health);

  return 0.4 * profile.fun + 0.3 * profile.comfort + 0.2 * safety + 0.1;
}
function medicalAnchors(city) {
  return {
    hospital: `Nearest City Hospital in ${city}`,
    food: `Child-friendly Restaurant in ${city}`,
  };
}
function childFriendlyRank(attractions, travelers, city) {
  const child = travelers.find((t) => Number(t.age) <= 12);

  if (!child) return attractions;

  const health = (child.health || "").toLowerCase();

  const ranked = attractions
    .map((a) => ({
      name: a,
      score: dualScore(a, Number(child.age), health),
    }))
    .filter((a) => a.score > 0.4)
    .sort((a, b) => b.score - a.score)
    .map((a) => a.name);

  const anchors = medicalAnchors(city);

  ranked.unshift(`🏥 ${anchors.hospital}`);
  ranked.push(`🍽 ${anchors.food}`);

  return ranked;
}
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    destination TEXT,
    itinerary TEXT,
    budget INTEGER,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
});

const API_KEY = process.env.OPENTRIPMAP_API_KEY;
const BASE_URL = "https://api.opentripmap.com/0.1/en/places";
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

console.log("API KEY LOADED:", API_KEY ? "YES" : "NO");

// ---------------- SAFE API FUNCTION ----------------
async function getAttractions(city) {
  const cityKey = city
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim();

  // 1️⃣ Try local city intelligence first
  const matchedCity = Object.keys(CITY_SPOTS).find((key) =>
    cityKey.includes(key),
  );

  if (matchedCity) {
    console.log("Matched City DB:", matchedCity);
    return CITY_SPOTS[matchedCity];
  }
  {
    console.log("Using Smart City Database for:", city);
    return CITY_SPOTS[cityKey];
  }

  // 2️⃣ Try OpenTripMap API
  try {
    const geo = await axios.get(`${BASE_URL}/geoname`, {
      params: { name: city, apikey: API_KEY },
    });

    if (!geo.data || !geo.data.lat) {
      throw new Error("Geo not found");
    }

    const { lat, lon } = geo.data;

    const places = await axios.get(`${BASE_URL}/radius`, {
      params: {
        radius: 5000,
        lon,
        lat,
        limit: 20,
        apikey: API_KEY,
      },
    });

    const names = places.data.features
      .map((p) => p.properties.name)
      .filter(Boolean);

    if (names.length > 0) return names;

    throw new Error("No places found");
  } catch (err) {
    console.log("API failed — using smart fallback");

    // 3️⃣ Smart generic fallback
    return [
      "Famous City Landmark",
      "Heritage Market",
      "Cultural Street Walk",
      "Local Food Plaza",
      "Scenic Viewpoint",
    ];
  }
}

function enforceMedicalSafety(attractions, travelers, destination) {
  if (!Array.isArray(attractions)) return [];

  const place = destination.toLowerCase();
  let safeList = [...attractions];

  travelers.forEach((t) => {
    const age = Number(t.age || 0);
    const health = (t.health || "").toLowerCase();

    const riskyKeywords = [
      "paragliding",
      "trek",
      "snow",
      "rohtang",
      "ski",
      "cliff",
      "valley",
      "hiking",
      "mountain",
    ];

    const safeAlternatives = [
      "Local Cafe Street",
      "Cultural Museum",
      "Heritage Temple Visit",
      "Scenic Road Viewpoint",
      "Market Walk",
    ];

    // ASTHMA OR SENIOR
    if (health.includes("asthma") || age >= 50) {
      console.log("🏥 Medical filter active for:", t.name || "Traveler");

      safeList = safeList.filter(
        (a) => !riskyKeywords.some((r) => a.toLowerCase().includes(r)),
      );

      // Add safe alternatives if we removed too much
      if (safeList.length < 4) {
        safeList.unshift(...safeAlternatives);
      }
    }
  });

  return safeList;
}

// ---------------- API ROUTE ----------------

async function getWeather(city) {
  try {
    const geo = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: { q: city, format: "json", limit: 1 },
    });

    if (!geo.data.length) return "clear";

    const { lat, lon } = geo.data[0];

    const weather = await axios.get(`https://api.open-meteo.com/v1/forecast`, {
      params: {
        latitude: lat,
        longitude: lon,
        hourly: "precipitation_probability",
        forecast_days: 1,
      },
    });

    const rainChance = Math.max(
      ...weather.data.hourly.precipitation_probability,
    );

    return rainChance > 50 ? "rain" : "clear";
  } catch {
    return "clear";
  }
}

function applyFamilySafetyFilter(attractions, travelers, childMode) {
  let safe = [];
  let risky = [];

  const hasChild = travelers.some((t) => Number(t.age) <= 12);
  const hasSenior = travelers.some((t) => Number(t.age) >= 60);
  const hasPregnant = travelers.some((t) =>
    (t.health || "").toLowerCase().includes("pregnant"),
  );

  attractions.forEach((a) => {
    const name = a.toLowerCase();

    const danger =
      name.includes("paragliding") ||
      name.includes("trek") ||
      name.includes("ropeway") ||
      name.includes("snow") ||
      name.includes("water sports");

    if (danger && (childMode || hasChild || hasSenior || hasPregnant)) {
      risky.push(a);
    } else {
      safe.push(a);
    }
  });

  // BOOST family-friendly places
  const boosters = [];
  if (childMode || hasChild) {
    boosters.push(
      "Children's Park",
      "Toy Train Ride",
      "Zoo / Nature Interpretation Center",
      "Ice Cream Café Stop",
    );
  }

  if (hasPregnant || hasSenior) {
    boosters.push(
      "Scenic Café Viewpoint",
      "Botanical Garden Walk",
      "Medical Support Center",
    );
  }

  return [...boosters, ...safe];
}

app.post("/plan", async (req, res) => {
  try {
    const { destination, travelers, days, budget, childMode } = req.body;
    const totalPeople = travelers.length || 1;
    const totalDays = Number(days) || 1;
    const totalBudget = Number(budget) || 0;
    const MIN_PER_PERSON_PER_DAY = 800;
    const minRequired = MIN_PER_PERSON_PER_DAY * totalPeople * totalDays;

    if (totalBudget < minRequired) {
      return res.json({
        error: true,
        message: `⚠ Unrealistic budget.

Minimum required for ${totalPeople} traveler(s) for ${totalDays} days is approx ₹${minRequired}.

Your budget ₹${totalBudget} is too low for survival (food + travel).`,
      });
    }

    const staminaScore =
      travelers.reduce((s, t) => {
        return s + (t.stamina === "high" ? 3 : t.stamina === "medium" ? 2 : 1);
      }, 0) / travelers.length;

    const stamina =
      staminaScore >= 2.5 ? "high" : staminaScore >= 1.5 ? "medium" : "low";

    // ---------------- DATA ----------------
    const weather = await getWeather(destination);
    let attractions = await getAttractions(destination);
    attractions = recommend(attractions, travelers); // Feature 1
    attractions = applyFamilySafetyFilter(attractions, travelers, childMode);
    attractions = enforceMedicalSafety(attractions, travelers, destination);
    attractions = childFriendlyRank(attractions, travelers, destination);

    const medicalAI = calculateRiskScore(travelers, destination);

    if (medicalAI.score >= 3) {
      attractions.unshift(
        "Medical-Safe Walking Zone",
        "Nearby Hospital Visit Point",
        ...medicalAI.safeAlternatives,
      );
    }

    if (weather === "rain") {
      attractions.unshift(
        "Indoor Museum",
        "Local Cafe",
        "Shopping Mall",
        "Cultural Center",
      );
    }
    // ---------------- HOURLY ITINERARY ENGINE ----------------

    function costModel(activity, perPersonPerDay) {
      const name = activity.toLowerCase();

      // 🎯 Budget tiers
      let multiplier = 1;

      if (perPersonPerDay < 800)
        multiplier = 0.8; // LOW
      else if (perPersonPerDay < 2000)
        multiplier = 1.2; // MID
      else multiplier = 2; // HIGH

      if (name.includes("breakfast")) return 120 * multiplier;
      if (name.includes("lunch")) return 250 * multiplier;
      if (name.includes("dinner")) return 300 * multiplier;
      if (name.includes("cafe")) return 200 * multiplier;

      if (name.includes("museum") || name.includes("fort"))
        return 100 * multiplier;
      if (name.includes("beach") || name.includes("temple"))
        return 50 * multiplier;

      if (name.includes("mall") || name.includes("market"))
        return 300 * multiplier;
      if (name.includes("trek") || name.includes("adventure"))
        return 600 * multiplier;

      if (name.includes("taxi") || name.includes("travel"))
        return 150 * multiplier;

      return 200 * multiplier;
    }

    // function generateHourlyPlan(attractions, days, stamina, budget, destination) {
    //   const safeDays = Math.max(1, Number(days));
    //   const perPersonPerDay = budget / (safeDays * travelers.length);
    // //   if (perPersonPerDay < 800) {
    // //   // LOW BUDGET → FREE ACTIVITIES
    // //   cost = 0;
    // //   activity = "Local Street Walk / Free Viewpoint";
    // // }
    // // else if (perPersonPerDay < 1500) {
    // //   // MEDIUM
    // //   cost = 100;
    // // }
    // // else {
    // //   // HIGH
    // //   cost = 300+;
    // // }
    //   let idx = 0;

    //   return Array.from({ length: safeDays }).map((_, d) => {
    //     let schedule = [];

    //     // BREAKFAST
    // schedule.push({
    //   time: "09:00",
    //   activity: "Breakfast",
    //   cost: costModel("Breakfast", perPersonPerDay) * travelers.length
    // });

    // // PLACE
    // const activity1 = attractions[idx++ % attractions.length];
    // schedule.push({
    //   time: "10:30",
    //   activity: activity1,
    //   cost: costModel(activityName, perPersonPerDay) * travelers.length
    // });

    // // PLACE
    // const activity2 = attractions[idx++ % attractions.length];
    // schedule.push({
    //   time: "12:30",
    //   activity: activity2,
    //   cost: costModel(activity2, perPersonPerDay) * travelers.length
    // });

    // // LUNCH
    // schedule.push({
    //   time: "14:00",
    //   activity: "Lunch",
    //   cost: costModel("Lunch", perPersonPerDay) * travelers.length
    // });

    // // PLACE
    // const activity3 = attractions[idx++ % attractions.length];
    // schedule.push({
    //   time: "16:30",
    //   activity: activity3,
    //   cost: costModel(activity3, perPersonPerDay) * travelers.length
    // });

    // // PLACE
    // const activity4 = attractions[idx++ % attractions.length];
    // schedule.push({
    //   time: "18:30",
    //   activity: activity4,
    //   cost: costModel(activity4, perPersonPerDay) * travelers.length
    // });

    // // DINNER
    // schedule.push({
    //   time: "21:00",
    //   activity: "Dinner",
    //   cost: costModel("Dinner", perPersonPerDay) * travelers.length
    // });

    //     return {
    //       day: `Day ${d + 1}`,
    //       schedule
    //     };
    //   });
    // }
    // ---------------- PLAN GENERATION ----------------

    function generateHourlyPlan(
      attractions,
      days,
      stamina,
      budget,
      destination,
    ) {
      const safeDays = Math.max(1, Number(days));
      const people = travelers.length || 1;

      const totalSlotsPerDay = 7; // breakfast + 4 places + lunch + dinner
      const totalSlots = safeDays * totalSlotsPerDay;

      // 🎯 CORE LOGIC → distribute full budget
      const costPerSlot = Math.floor(budget / totalSlots);

      let idx = 0;

      return Array.from({ length: safeDays }).map((_, d) => {
        let schedule = [];

        // BREAKFAST
        schedule.push({
          time: "09:00",
          activity: "Breakfast",
          cost: Math.floor(costPerSlot * 0.8),
        });

        // PLACE 1
        const a1 = attractions[idx++ % attractions.length];
        schedule.push({
          time: "10:30",
          activity: a1,
          cost: costPerSlot,
        });

        // PLACE 2
        const a2 = attractions[idx++ % attractions.length];
        schedule.push({
          time: "12:30",
          activity: a2,
          cost: costPerSlot,
        });

        // LUNCH
        schedule.push({
          time: "14:00",
          activity: "Lunch",
          cost: Math.floor(costPerSlot * 1.5),
        });

        // PLACE 3
        const a3 = attractions[idx++ % attractions.length];
        schedule.push({
          time: "16:30",
          activity: a3,
          cost: costPerSlot,
        });

        // PLACE 4
        const a4 = attractions[idx++ % attractions.length];
        schedule.push({
          time: "18:30",
          activity: a4,
          cost: costPerSlot,
        });

        // DINNER
        schedule.push({
          time: "21:00",
          activity: "Dinner",
          cost: Math.floor(costPerSlot * 1.8),
        });

        return {
          day: `Day ${d + 1}`,
          schedule,
        };
      });
    }
    const itinerary = generateHourlyPlan(
      attractions,
      Number(days),
      stamina,
      Number(budget),
      destination,
    );

    // ---------------- FEATURE 4 ----------------
    const budgetAI = predictBudget(itinerary, budget, travelers.length, days);

    // ---------------- FEATURE 9 ----------------
    const journal = generateJournal(destination, itinerary);

    // ---------------- SAVE ----------------
    db.run(
      "INSERT INTO trips (destination, itinerary, budget) VALUES (?, ?, ?)",
      [destination, JSON.stringify(itinerary), budget],
    );

    // ---------------- RESPONSE ----------------
    console.log("FINAL ITINERARY:", itinerary);
    res.json({
      stamina,
      itinerary,
      weather,
      medical: medicalAI,
      budgetAI,
      journal,
      realisticBudget: minRequired,
    });
  } catch (err) {
    console.error("Planner error:", err);
    res.status(500).json({ error: "Planner failed" });
  }
});

// ---------------- PLACE IMAGE API (UNSPLASH) ----------------
app.get("/api/place-image", async (req, res) => {
  try {
    const place = req.query.place;

    if (!place) {
      return res.json({
        imageUrl:
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
      });
    }

    const response = await axios.get("https://api.unsplash.com/search/photos", {
      params: {
        query: place,
        per_page: 10,
      },
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });

    const imageUrl = response.data.results.length
      ? response.data.results[
          Math.floor(Math.random() * response.data.results.length)
        ].urls.regular
      : "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee";

    res.json({ imageUrl });
  } catch (error) {
    console.error("Unsplash image error:", error.message);
    res.json({
      imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    });
  }
});

// ---------------- START SERVER ----------------

// ---------------- TRIP HISTORY API ----------------
app.get("/history", (req, res) => {
  db.all("SELECT * FROM trips ORDER BY date DESC LIMIT 10", [], (err, rows) => {
    if (err) {
      console.error("History error:", err);
      return res.status(500).json({ error: "Failed to fetch history" });
    }
    res.json(rows);
  });
});

// app.post("/chat", async (req, res) => {
//   try {
//     const { message, context } = req.body;
//     const emotion = detectEmotion(message);

//     const text = message.toLowerCase();
//     const destination = (context?.destination || "").toLowerCase();

//     // ---------------- LANGUAGE DETECTION ----------------
//     const isHindi =
//       /[\u0900-\u097F]/.test(message) ||
//       /\b(kya|mujhe|jaana|leke|chahiye|hai|nahi|me|mein)\b/i.test(message);

//     // ---------------- CLIMATE LOGIC ----------------
//     function climate(city) {
//       if (
//         city.includes("mumbai") ||
//         city.includes("goa") ||
//         city.includes("chennai") ||
//         city.includes("kochi")
//       ) return "coastal";

//       if (
//         city.includes("manali") ||
//         city.includes("shimla") ||
//         city.includes("nainital")
//       ) return "hill";

//       if (
//         city.includes("delhi") ||
//         city.includes("amritsar") ||
//         city.includes("jaipur")
//       ) return "north";

//       return "normal";
//     }

//     const placeClimate = climate(destination);

//     // ---------------- CLOTHING HANDLER (NO AI USED) ----------------
//     if (
//       text.includes("sweater") ||
//       text.includes("jacket") ||
//       text.includes("kapde") ||
//       text.includes("leke") ||
//       text.includes("clothes")
//     ) {
//       let reply = "";

//       if (isHindi) {
//         if (placeClimate === "coastal") {
//           reply =
//             "NO.\nMumbai ka weather zyada tar garam aur humid hota hai.\nTip: Raat ke liye halki jacket ya raincoat kaafi hota hai.";
//         } else if (placeClimate === "hill") {
//           reply =
//             "YES.\nHill stations par subah aur raat ko kaafi thand hoti hai.\nTip: Garam sweater aur jacket zaroor le jaana.";
//         } else if (placeClimate === "north") {
//           reply =
//             "YES.\nNorth India me winter me kaafi thand hoti hai.\nTip: Woolen sweater aur full-sleeve kapde le jaana.";
//         } else {
//           reply =
//             "NO.\nYahan weather usually moderate hota hai.\nTip: Halki jacket rakhna safe option hai.";
//         }
//       } else {
//         if (placeClimate === "coastal") {
//           reply =
//             "NO.\nThe weather is mostly warm and humid.\nTip: A light jacket or raincoat is enough for evenings.";
//         } else if (placeClimate === "hill") {
//           reply =
//             "YES.\nHill areas have cold mornings and chilly nights.\nTip: Carry a warm sweater and jacket.";
//         } else if (placeClimate === "north") {
//           reply =
//             "YES.\nNorth India can be very cold in winter.\nTip: Carry woolen clothes and layers.";
//         } else {
//           reply =
//             "NO.\nThe climate is generally moderate.\nTip: A light jacket is a safe option.";
//         }
//       }

//       return res.json({ reply });
//     }

//     // ---------------- FALLBACK TO AI ----------------
// const systemPrompt = `
// You are a helpful travel assistant.

// User Emotion: ${emotion}

// Keep answers short and practical.
// Use destination context if available.

// Destination: ${destination}
// `;

//     const response = await fetch("http://localhost:11434/api/generate", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         model: "tinyllama",
//         prompt: systemPrompt + "\nUser: " + message,
//         stream: false,
//         temperature: 0.3
//       })
//     });

//     const data = await response.json();
//     res.json({ reply: data.response || "Try again please." });

//   } catch (err) {
//     console.error("AI Error:", err);
//     res.status(500).json({
//       reply: "AI service band hai. Backend aur Ollama check karo."
//     });
//   }
// });

app.post("/chat", async (req, res) => {
  try {
    const { message = "", context = {} } = req.body;

    // ---------------- SAFE CONTEXT ----------------
    const destination = (context.destination || "").toLowerCase();

    // ---------------- EMOTION ----------------
    let emotion = "neutral";
    try {
      emotion = detectEmotion(message);
    } catch {}

    const text = message.toLowerCase();

    // ---------------- LANGUAGE DETECTION ----------------
    const isHindi =
      /[\u0900-\u097F]/.test(message) ||
      /\b(kya|mujhe|jaana|leke|chahiye|hai|nahi|me|mein|kapde|sweater|jacket)\b/i.test(
        message,
      );

    // ---------------- CLIMATE LOGIC ----------------
    function climate(city) {
      if (
        city.includes("mumbai") ||
        city.includes("goa") ||
        city.includes("chennai") ||
        city.includes("kochi")
      )
        return "coastal";

      if (
        city.includes("manali") ||
        city.includes("shimla") ||
        city.includes("nainital")
      )
        return "hill";

      if (
        city.includes("delhi") ||
        city.includes("amritsar") ||
        city.includes("jaipur")
      )
        return "north";

      return "normal";
    }

    const placeClimate = climate(destination);

    // ---------------- CLOTHING HANDLER (FAST RESPONSE, NO AI) ----------------
    if (
      text.includes("sweater") ||
      text.includes("jacket") ||
      text.includes("kapde") ||
      text.includes("leke") ||
      text.includes("clothes")
    ) {
      let reply = "";

      if (isHindi) {
        if (placeClimate === "coastal") {
          reply =
            "नहीं।\nमुंबई जैसे तटीय शहरों में मौसम आमतौर पर गर्म और आर्द्र रहता है।\nसलाह: शाम के लिए हल्की जैकेट या रेनकोट पर्याप्त है।";
        } else if (placeClimate === "hill") {
          reply =
            "हाँ।\nपहाड़ी इलाकों में सुबह और रात को काफी ठंड होती है।\nसलाह: गर्म स्वेटर और जैकेट जरूर साथ रखें।";
        } else if (placeClimate === "north") {
          reply =
            "हाँ।\nउत्तर भारत में सर्दियों के दौरान मौसम ठंडा रहता है।\nसलाह: ऊनी कपड़े और लेयरिंग करें।";
        } else {
          reply =
            "नहीं।\nयहाँ मौसम आमतौर पर सामान्य रहता है।\nसलाह: हल्की जैकेट रखना सुरक्षित विकल्प है।";
        }
      } else {
        if (placeClimate === "coastal") {
          reply =
            "NO.\nThe weather is usually warm and humid in coastal cities.\nTip: A light jacket or raincoat is enough for evenings.";
        } else if (placeClimate === "hill") {
          reply =
            "YES.\nHill areas have cold mornings and chilly nights.\nTip: Carry a warm sweater and jacket.";
        } else if (placeClimate === "north") {
          reply =
            "YES.\nNorth India can be cold in winter.\nTip: Carry woolen clothes and layers.";
        } else {
          reply =
            "NO.\nThe climate is generally moderate.\nTip: A light jacket is a safe option.";
        }
      }

      return res.json({ reply });
    }

    // ---------------- FALLBACK TO AI ----------------
    const systemPrompt = `
You are a strict and practical travel assistant.

Context:
Destination: ${destination || "unknown"}

User Emotion: ${emotion}

Answer properly.
`;

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "tinyllama",
prompt: `
You are a travel assistant.

Answer this question directly.

Give transport options with price and time.

Question: ${message}
`,
        stream: false,
        temperature: 0.1,
      }),
    });

    const data = await response.json();

    return res.json({
      reply: data.response || "Please try again.",
    });
  } catch (err) {
    console.error("AI CHAT ERROR:", err);
    return res.status(500).json({
      reply: "⚠ AI service band hai. Backend aur Ollama check karo.",
    });
  }
});

const CITY_SPOTS = {
  mumbai: [
    "Gateway of India",
    "Marine Drive",
    "Juhu Beach",
    "Sanjay Gandhi National Park",
    "Elephanta Caves",
    "Bandra-Worli Sea Link",
    "Chhatrapati Shivaji Maharaj Terminus",
  ],

  pune: [
    "Shaniwar Wada",
    "Sinhagad Fort",
    "Aga Khan Palace",
    "Pataleshwar Cave Temple",
    "Parvati Hill",
    "Vetal Tekdi",
    "FC Road Street Market",
  ],

  lonavala: [
    "Bhushi Dam",
    "Lion’s Point",
    "Rajmachi Fort",
    "Karla Caves",
    "Tiger’s Leap",
    "Lonavala Lake",
  ],

  matheran: [
    "Panorama Point",
    "Echo Point",
    "Charlotte Lake",
    "Louisa Point",
    "Monkey Point",
    "One Tree Hill",
  ],

  nashik: [
    "Trimbakeshwar Temple",
    "Sula Vineyards",
    "Pandavleni Caves",
    "Ramkund Ghat",
    "Anjaneri Hills",
  ],

  aurangabad: [
    "Ajanta Caves",
    "Ellora Caves",
    "Bibi Ka Maqbara",
    "Daulatabad Fort",
    "Panchakki",
  ],

  alibaug: [
    "Alibaug Beach",
    "Kashid Beach",
    "Murud-Janjira Fort",
    "Nagaon Beach",
    "Varsoli Beach",
  ],

  ratnagiri: [
    "Ganpatipule Beach",
    "Ratnadurg Fort",
    "Jaigad Fort",
    "Thibaw Palace",
    "Aare-Ware Beach Road",
  ],

  mahableshwar: [
    "Arthur’s Seat",
    "Elephant’s Head Point",
    "Venna Lake",
    "Mapro Garden",
    "Wilson Point",
    "Lingmala Waterfall",
  ],

  kolhapur: [
    "Mahalaxmi Temple",
    "Rankala Lake",
    "Panhala Fort",
    "New Palace Museum",
    "Jyotiba Temple",
  ],

  nagpur: [
    "Deekshabhoomi",
    "Ambazari Lake",
    "Maharaj Bagh",
    "Futala Lake",
    "Ramtek Temple",
  ],

  satara: [
    "Kaas Plateau (Valley of Flowers)",
    "Thoseghar Waterfalls",
    "Ajinkyatara Fort",
    "Sajjangad Fort",
  ],

  sindhudurg: [
    "Tarkarli Beach",
    "Sindhudurg Fort",
    "Devbag Beach",
    "Malvan Marine Sanctuary",
    "Rock Garden",
  ],

  shirdi: [
    "Sai Baba Temple",
    "Dwarkamai",
    "Chavadi",
    "Lendi Garden",
    "Shani Shingnapur",
  ],

  amravati: [
    "Chikhaldara Hill Station",
    "Gawilgarh Fort",
    "Melghat Tiger Reserve",
    "Bhima Kund Waterfall",
  ],
  manali: [
    "Solang Valley",
    "Rohtang Pass",
    "Hadimba Devi Temple",
    "Old Manali Cafe Street",
    "Jogini Waterfalls",
    "Vashisht Hot Springs",
    "Mall Road Manali",
    "Paragliding Point",
    "Snow Point",
  ],
  goa: [
    "Baga Beach",
    "Calangute Beach",
    "Anjuna Beach",
    "Dudhsagar Waterfalls",
    "Fort Aguada",
    "Basilica of Bom Jesus",
    "Chapora Fort",
    "Cruise on Mandovi River",
    "Scuba Diving at Grande Island",
  ],

  amritsar: [
    "Golden Temple",
    "Jallianwala Bagh",
    "Wagah Border Ceremony",
    "Durgiana Temple",
    "Rambagh Gardens",
    "Partition Museum",
    "Heritage Street Walk",
    "Local Punjabi Food Street",
  ],
};
// ================= BOOKING FEATURE =================

// 🚗 Travel Data
const TRAVEL_DB = {
  flight: [
    { company: "IndiGo", price: 3500, time: "2h" },
    { company: "Air India", price: 4200, time: "2h 30m" },
    { company: "SpiceJet", price: 3000, time: "2h" },
  ],
  train: [
    { company: "Express Train", price: 800, time: "8h" },
    { company: "Superfast", price: 1200, time: "6h" },
  ],
  bus: [
    { company: "Volvo AC", price: 900, time: "10h" },
    { company: "Sleeper Bus", price: 700, time: "11h" },
  ],
  car: [
    { company: "Self Drive", price: 2000, time: "7h" },
    { company: "Cab Rental", price: 3500, time: "7h" },
  ],
};

// 🏨 Hotel Data
const HOTEL_DB = [
  { name: "Budget Stay", pricePerDay: 1000 },
  { name: "Comfort Hotel", pricePerDay: 2500 },
  { name: "Luxury Hotel", pricePerDay: 5000 },
];

// 🎯 SINGLE API
app.post("/booking", (req, res) => {
  try {
    const { from, to, mode, budget, days } = req.body;

    if (!mode || !budget) {
      return res.status(400).json({
        error: "Mode and budget required",
      });
    }

    // 🚗 Travel options
    const travel = (TRAVEL_DB[mode] || []).filter((t) => t.price <= budget);

    // 🏨 Hotels
    let hotels = [];
    if (days) {
      hotels = HOTEL_DB.map((h) => ({
        ...h,
        total: h.pricePerDay * days,
      })).filter((h) => h.total <= budget);
    }

    res.json({
      from,
      to,
      mode,
      travel,
      hotels,
    });
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ error: "Failed" });
  }
});
app.listen(5000, () => {
  console.log("Backend running on port 5000");
});
