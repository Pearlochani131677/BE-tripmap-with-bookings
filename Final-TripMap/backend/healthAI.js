const graph = require("./medicalGraph");

function calculateRiskScore(travelers, destination) {
  const city = destination.toLowerCase();
  const node = graph[city];

  if (!node) return { score: 0, warnings: [] };

  let score = 0;
  let warnings = [];

  travelers.forEach(t => {
    const health = t.health || {};

    Object.keys(health).forEach(condition => {
      if (health[condition] && node.risks.includes(condition)) {
        score += 3;
        warnings.push(
          `⚠ ${condition.toUpperCase()} risk in ${destination}: Environment may not be suitable`
        );
      }
    });
  });

  return { score, warnings, safeAlternatives: node.safeAlternatives };
}

module.exports = { calculateRiskScore };
