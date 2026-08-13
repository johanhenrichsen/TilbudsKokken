const PROMPT = (rows) => `Du er en dansk madvareekspert. For hver vare nedenfor:
- Split sammensatte varer ("X eller Y") i separate varer.
- Tilføj felterne: category (dansk madkategori), servingIdea (kort), labels (fx Dansk, Økologisk, ASC, MSC).
- Bevar det originale i-felt (source index) for hver vare. Split-varianter af samme vare skal alle have SAMME i-felt som den originale vare.
Svar KUN med et JSON-array af objekter med felterne: i (number, source index), name, category, servingIdea, labels.
Varer: ${JSON.stringify(rows.map((r, i) => ({ i, name: r.name })))}`;

// Claude often wraps JSON in markdown fences or a sentence of preamble.
// Pull out the JSON array so JSON.parse doesn't choke on the surrounding text.
export function extractJsonArray(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("[");
  const end = body.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return null;
  return body.slice(start, end + 1);
}

export async function enrichRows(baseRows, { callClaude }) {
  if (baseRows.length === 0) return [];
  let parsed;
  try {
    parsed = JSON.parse(extractJsonArray(await callClaude(PROMPT(baseRows))));
    if (!Array.isArray(parsed)) throw new Error("not an array");
  } catch {
    return baseRows.map(r => ({ ...r, category: "Ukategoriseret", servingIdea: "", labels: [] }));
  }
  // Attach enrichment back to the originating base row by explicit index.
  return parsed.map(p => {
    const base = Number.isInteger(p.i) && p.i >= 0 && p.i < baseRows.length
      ? baseRows[p.i]
      : { store: baseRows[0]?.store ?? "", price: null, currency: null, weight: "", unit: "", validFrom: null, validTo: null, catalogId: baseRows[0]?.catalogId ?? null };
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
