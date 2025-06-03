/**
 * api/submit-scheduler.js
 * CORS-enabled Vercel proxy that forwards scheduler submissions to Zapier.
 */

module.exports = async (req, res) => {
  // 1) Always send CORS headers so the browser’s preflight and POST succeed
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 2) If this is an OPTIONS (preflight) request, respond immediately
  if (req.method === "OPTIONS") {
    return res.status(204).end(); // No body needed
  }

  // 3) Parse the JSON body from the landing page
  let body;
  try {
    body = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", chunk => (data += chunk));
      req.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
      req.on("error", err => reject(err));
    });
  } catch (e) {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  // 4) Forward the same JSON body to Zapier’s catch hook
  try {
    const zapierRes = await fetch(
      "https://hooks.zapier.com/hooks/catch/6263073/2vtpd0d/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!zapierRes.ok) {
      const text = await zapierRes.text();
      return res.status(500).json({ error: "Zapier error", details: text });
    }

    // 5) On success, respond with success (still including CORS)
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Forwarding error", message: err.message });
  }
};
