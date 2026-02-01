import http from "http";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");

const systemPrompt = `You are a nutrition assistant. Given weekly nutrient deficits and a goal,
return a JSON array of recommended foods. Each item must include:
- name (string)
- reason (string)
- nutrients (array of strings)
- quantity (string)
- addToCartSku (string)
Respond with ONLY valid JSON.`;

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json"
};

async function fetchGptSuggestions({ deficits, goalText }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return [
      {
        name: "Salmon",
        reason: "High in omega-3s and protein for recovery.",
        nutrients: ["Omega-3", "Protein", "Vitamin D"],
        quantity: "2 fillets",
        addToCartSku: "salmon-2pk"
      },
      {
        name: "Spinach",
        reason: "Boosts iron and magnesium to reduce fatigue.",
        nutrients: ["Iron", "Magnesium", "Vitamin K"],
        quantity: "1 large bag",
        addToCartSku: "spinach-1lb"
      },
      {
        name: "Greek Yogurt",
        reason: "Adds calcium and probiotics for gut health.",
        nutrients: ["Calcium", "Protein", "Probiotics"],
        quantity: "4 cups",
        addToCartSku: "greek-yogurt-4pk"
      }
    ];
  }

  const userPrompt = `Weekly nutrient deficits: ${JSON.stringify(deficits)}\nGoal: ${goalText}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned empty content");
  }

  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed)) {
    throw new Error("OpenAI response was not a JSON array");
  }
  return parsed;
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

async function serveStatic(req, res) {
  const urlPath = req.url === "/" ? "/index.html" : req.url;
  const filePath = path.join(publicDir, decodeURIComponent(urlPath));

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "text/plain" });
    res.end(data);
  } catch (error) {
    res.writeHead(404);
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/api/next-week-suggestions") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
        const payload = JSON.parse(body || "{}");
        const { deficits, goalText } = payload;
        if (!deficits || !goalText) {
          return sendJson(res, 400, {
            error: "deficits and goalText are required"
          });
        }

        const suggestions = await fetchGptSuggestions({ deficits, goalText });
        return sendJson(res, 200, { suggestions });
      } catch (error) {
        return sendJson(res, 500, {
          error: "Failed to fetch suggestions",
          details: error.message
        });
      }
    });
    return;
  }

  if (req.method === "GET" && req.url === "/api/cart") {
    return sendJson(res, 200, { items: [] });
  }

  return serveStatic(req, res);
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
