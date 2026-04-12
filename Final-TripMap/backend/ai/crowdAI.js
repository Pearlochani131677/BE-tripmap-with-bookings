function predictCrowd(place) {
  const busyKeywords = ["market", "temple", "beach", "mall"];
  const lowKeywords = ["museum", "garden", "lake"];

  const name = place.toLowerCase();

  if (busyKeywords.some(k => name.includes(k))) return "HIGH";
  if (lowKeywords.some(k => name.includes(k))) return "LOW";

  return "MEDIUM";
}

module.exports = { predictCrowd };
