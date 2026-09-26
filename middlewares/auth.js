const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

function auth(req, res, next) {
  const token = req.header("x-api-key");

  if (!token) {
    return res.status(401).json({
      msg: "Token is required"
    });
  }

  try {
    const tokenData = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    if (
      !tokenData ||
      typeof tokenData !== "object" ||
      !mongoose.isObjectIdOrHexString(tokenData._id)
    ) {
      return res.status(401).json({
        msg: "Invalid token"
      });
    }

    req.tokenData = tokenData;

    next();
  } catch (err) {
    return res.status(401).json({
      msg: "Invalid or expired token"
    });
  }
}

exports.auth = auth;