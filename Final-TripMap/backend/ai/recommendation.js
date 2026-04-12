function recommend(attractions, travelers) {
  const likes = travelers.flatMap(t =>
    (t.likes || "").toLowerCase().split(",").map(x => x.trim())
  );

  return attractions.sort((a, b) => {
    let scoreA = likes.some(l => a.toLowerCase().includes(l)) ? 1 : 0;
    let scoreB = likes.some(l => b.toLowerCase().includes(l)) ? 1 : 0;
    return scoreB - scoreA;
  });
}

module.exports = { recommend };
