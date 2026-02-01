const express = require("express");
const { google } = require("googleapis");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());


// ==================================================
// ✅ SERVE FRONTEND (ADMIN PANEL)
// ==================================================

app.use(express.static(__dirname));

// open http://localhost:3000 OR render url
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});


// ==================================================
// ✅ HEALTH CHECK (IMPORTANT FOR RENDER)
// ==================================================
app.get("/health", (req, res) => {
  res.send("OK");
});


// ==================================================
// ✅ GOOGLE AUTH
// ==================================================
const auth = new google.auth.GoogleAuth({
  keyFile: "service-account.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SHEET_ID = "14LA-8gxbw5Ai5LBp94Iu4DSM-yx7KF0QSjjbivh3uk0";
const SHEET_NAME = "Sheet1";


// ==================================================
// ✅ USERS
// ==================================================
const USERS = {
  council1: "1234",
  council2: "abcd"
};


// ==================================================
// ✅ LOGIN API
// ==================================================
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (USERS[username] === password) {
    return res.json({ success: true });
  }

  res.json({ success: false });
});


// ==================================================
// ✅ FETCH TEAM DATA
// ==================================================
app.get("/team/:teamNo", async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:I`,
    });

    const rows = response.data.values || [];

    const team = rows.slice(1).find(r => r[0] == req.params.teamNo);

    res.json(team || []);

  } catch (err) {
    console.error("❌ FETCH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ==================================================
// ✅ UPDATE TEAM DATA
// ==================================================
app.post("/updateTeam", async (req, res) => {
  try {
    const { rowIndex, rowData } = req.body;

    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A${rowIndex}:I${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values: [rowData] },
    });

    res.json({ success: true });

  } catch (err) {
    console.error("❌ UPDATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// ==================================================
// ✅ START SERVER (IMPORTANT FIX FOR RENDER)
// ==================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("\n🚀 Server Started Successfully");
  console.log(`👉 Running on port ${PORT}\n`);
});
