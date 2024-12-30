const express = require("express");
const { google } = require("googleapis");
const SubmitUrl = require("../models/submit-urls.js");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const serviceAccount = path.join(process.cwd(), "servicefile.json");

console.log("Resolved Path:", serviceAccount);

if (!fs.existsSync(serviceAccount)) {
  throw new Error("Service account JSON file not found in root directory");
}


// Authenticate with Google API
const auth = new google.auth.GoogleAuth({
  keyFile: serviceAccount,
  scopes: ["https://www.googleapis.com/auth/indexing"],
});
const indexing = google.indexing({ version: "v3", auth });

// Route to get all URLs from the database
router.get("/alllinks", async (req, res) => {
  try {
    const urls = await SubmitUrl.find().sort({ submittedAt: -1 }); // Sort by the most recently submitted
    res.json({ message: "URLs retrieved successfully", urls });
  } catch (error) {
    console.error("Error retrieving URLs:", error.message);
    res.status(500).json({ error: "An error occurred while fetching URLs" });
  }
});

// Route to submit URLs to the Google Indexing API
router.post("/addlinks", async (req, res) => {
  const { links } = req.body;

  if (!Array.isArray(links) || links.length === 0) {
    return res.status(400).json({ error: "Invalid links array" });
  }

  const results = [];

  for (const url of links) {
    try {
      // Submit URL to Google Indexing API
      await indexing.urlNotifications.publish({
        requestBody: {
          url,
          type: "URL_UPDATED",
        },
      });

      // Save URL with "indexed" status in MongoDB
      await SubmitUrl.create({ url, status: "indexed" });

      results.push({ url, status: "indexed" });
    } catch (error) {
      console.error(`Error indexing ${url}:`, error.message);

      // Save URL with "not indexed" status in MongoDB
      await SubmitUrl.create({ url, status: "not indexed" });

      results.push({ url, status: "not indexed", error: error.message });
    }
  }

  res.json({ message: "URLs processed", results });
});

module.exports = router;
