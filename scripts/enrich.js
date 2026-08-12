const PROMPT = (rows) => `Du er en dansk madvareekspert. For hver vare nedenfor:
- Split sammensatte varer ("X eller Y") i separate varer.
- Tilføj felterne: category (dansk madkategori), servingIdea (kort), labels (fx Dansk, Økologisk, ASC, MSC).
Svar KUN med et JSON-array af objekter med felterne: name, category, servingIdea, labels.
Varer: ${JSON.stringify(rows.map(r => r.name))}`;

export async function enrichRows(baseRows, { callClaude }) {
  if (baseRows.length === 0) return [];
  let parsed;
  try {
    parsed = JSON.parse(await callClaude(PROMPT(baseRows)));
    if (!Array.isArray(parsed)) throw new Error("not an array");
  } catch {
    return baseRows.map(r => ({ ...r, category: "Ukategoriseret", servingIdea: "", labels: [] }));
  }
  // Attach enrichment back to the originating base row by name prefix match.
  return parsed.map(p => {
    const base = baseRows.find(b => p.name?.startsWith(b.name) || b.name?.startsWith(p.name)) ?? baseRows[0];
    return {
      ...base,
      name: p.name ?? base.name,
      category: p.category ?? "Ukategoriseret",
      servingIdea: p.servingIdea ?? "",
      labels: Array.isArray(p.labels) ? p.labels : [],
    };
  });
}

// Real Claude caller used by run.js (not exercised in unit tests).
export function makeClaudeCaller({ apiKey, model }) {
  return async function callClaude(prompt) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text ?? "";
  };
}
