function predictBudget(itinerary, totalBudget) {
  let estimated = 0;
  let food = 0;
  let travel = 0;
  let activities = 0;

  itinerary.forEach(day => {
    day.schedule.forEach(slot => {
      const cost = slot.cost || 0;
      const name = slot.activity.toLowerCase();

      estimated += cost;

      if (
        name.includes("breakfast") ||
        name.includes("lunch") ||
        name.includes("dinner")
      ) {
        food += cost;
      } else if (name.includes("taxi") || name.includes("travel")) {
        travel += cost;
      } else {
        activities += cost;
      }
    });
  });

  return {
    estimated,
    breakdown: {
      food,
      travel,
      activities
    },
    status:
      estimated > totalBudget
        ? "OVER_BUDGET"
        : estimated < totalBudget * 0.8
        ? "UNDERUTILIZED"
        : "OPTIMAL"
  };
}

module.exports = { predictBudget };