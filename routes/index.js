const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    msg: "Toys API is running",
    documentation: "See README.md"
  });
});

module.exports = router;