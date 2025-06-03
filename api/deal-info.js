/**
 * CommonJS-compatible Vercel function with CORS and Cache-Control headers.
 * Pulls three date_offered properties from HubSpot.
 */

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  // Disable caching
  res.setHeader("Cache-Control", "no-store");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Extract dealId
  const dealId = req.query.dealid;
  const token = process.env.HUBSPOT_TOKEN;

  if (!dealId) {
    return res.status(400).json({ error: "Missing deal ID" });
  }

  // HubSpot API URL
  const url =
    `https://api.hubapi.com/crm/v3/objects/deals/${dealId}` +
    `?properties=date_offered_1,date_offered_2,date_offered_3`;

  try {
    const hubRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!hubRes.ok) {
      const text = await hubRes.text();
      return res
        .status(500)
        .json({ error: "HubSpot API error", details: text });
    }

    const data = await hubRes.json();
    const props = data.properties || {};

    return res.status(200).json({
      date1: props.date_offered_1 || null,
      date2: props.date_offered_2 || null,
      date3: props.date_offered_3 || null,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Function crash", message: err.message });
  }
};
