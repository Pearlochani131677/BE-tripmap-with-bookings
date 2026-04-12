function generateJournal(destination, itinerary) {
  let text = `My trip to ${destination} was an amazing experience.\n\n`;

  itinerary.forEach(day => {
    text += `${day.day}:\n`;
    day.schedule.forEach(s => {
      text += `- I visited ${s.activity} at ${s.time}\n`;
    });
    text += "\n";
  });

  return text;
}

module.exports = { generateJournal };
