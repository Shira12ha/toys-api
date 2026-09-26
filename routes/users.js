const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const {
  UserModel,
  validateUser,
  validateLogin
} = require("../models/userModel");

const router = express.Router();

// הרשמה
router.post("/", async (req, res) => {
  const validation = validateUser(req.body);

  if (validation.error) {
    return res.status(400).json({
      msg: validation.error.details[0].message
    });
  }

  const data = validation.value;

  if (Buffer.byteLength(data.password, "utf8") > 72) {
    return res.status(400).json({
      msg: "Password must not exceed 72 bytes"
    });
  }

  try {
    const existingUser = await UserModel.findOne({
      email: data.email
    });

    if (existingUser) {
      return res.status(409).json({
        msg: "Email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = new UserModel({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: "USER"
    });

    await user.save();

    res.status(201).json({
      msg: "User created successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        msg: "Email already exists"
      });
    }

    res.status(500).json({
      msg: "Error creating user"
    });
  }
});

// התחברות
router.post("/login", async (req, res) => {
  const validation = validateLogin(req.body);

  if (validation.error) {
    return res.status(400).json({
      msg: validation.error.details[0].message
    });
  }

  const data = validation.value;

  if (Buffer.byteLength(data.password, "utf8") > 72) {
    return res.status(400).json({
      msg: "Password must not exceed 72 bytes"
    });
  }

  try {
    const user = await UserModel.findOne({
      email: data.email
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        msg: "Email or password is incorrect"
      });
    }

    const passwordValid = await bcrypt.compare(
      data.password,
      user.password
    );

    if (!passwordValid) {
      return res.status(401).json({
        msg: "Email or password is incorrect"
      });
    }

    const token = jwt.sign(
      { _id: user._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
        algorithm: "HS256"
      }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({
      msg: "Error logging in"
    });
  }
});

module.exports = router;