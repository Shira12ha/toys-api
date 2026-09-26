
require("dotenv").config();

const express = require("express");
const { connectDB } = require("./db/mongoConnect");
const { configRoutes } = require("./routes/configRoutes");

const app = express();

app.use(express.json());

configRoutes(app);

app.use((req, res) => {
  res.status(404).json({ msg: "Route not found" });
});

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ msg: "Invalid JSON" });
  }

  console.error(err);
  res.status(500).json({ msg: "Server error" });
});

// Connect to MongoDB once
let dbPromise;

function ensureDB() {
  if (!process.env.JWT_SECRET) {
    return Promise.reject(
      new Error("JWT_SECRET is missing")
    );
  }

  if (!dbPromise) {
    dbPromise = connectDB().catch((err) => {
      dbPromise = null;
      throw err;
    });
  }

  return dbPromise;
}

// Vercel
if (process.env.VERCEL) {
  module.exports = async (req, res) => {
    try {
      await ensureDB();
      return app(req, res);
    } catch (err) {
      console.error("Server error:", err);
      return res.status(500).json({
        msg: "Server error"
      });
    }
  };
} else {
  // Local development
  ensureDB()
    .then(() => {
      const port = process.env.PORT || 3001;

      app.listen(port, () => {
        console.log(
          "Server running on port " + port
        );
      });
    })
    .catch((err) => {
      console.error(
        "Server could not start:",
        err
      );
      process.exit(1);
    });

  module.exports = app;
}
