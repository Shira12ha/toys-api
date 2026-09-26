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

  res.status(500).json({ msg: "Server error" });
});

async function startServer() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing");
    }

    await connectDB();

    const port = process.env.PORT || 3001;

    app.listen(port, () => {
      console.log("Server running: http://localhost:" + port);
    });
  } catch (err) {
console.error("Server could not start:", err.message);  
  process.exit(1);
  }
}

startServer();