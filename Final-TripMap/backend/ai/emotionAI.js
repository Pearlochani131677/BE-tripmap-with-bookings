function detectEmotion(text) {
  text = text.toLowerCase();

  if (text.includes("tired") || text.includes("stress")) return "STRESSED";
  if (text.includes("excited") || text.includes("happy")) return "HAPPY";
  if (text.includes("worried") || text.includes("scared")) return "ANXIOUS";

  return "NEUTRAL";
}

module.exports = { detectEmotion };
