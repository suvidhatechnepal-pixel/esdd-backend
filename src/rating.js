// Mirrors computeRating() in the console: any (c) on a rated question -> High;
// else any (b) -> Medium; else Low. Questions with exclude:true never count.
function computeRating(checklist, answers) {
  const rated = [];
  checklist.sections.forEach((sec) => sec.questions.forEach((q) => { if (!q.exclude) rated.push(q); }));

  let answeredCount = 0;
  const cHits = [];
  const bHits = [];
  rated.forEach((q) => {
    const ans = answers[q.id];
    if (ans && ans.option) {
      answeredCount++;
      if (ans.option === 'c') cHits.push(q.id);
      else if (ans.option === 'b') bHits.push(q.id);
    }
  });

  let tier = 'low';
  if (cHits.length) tier = 'high';
  else if (bHits.length) tier = 'medium';

  return { tier, complete: answeredCount === rated.length, answeredCount, total: rated.length, cHits, bHits };
}

module.exports = { computeRating };
