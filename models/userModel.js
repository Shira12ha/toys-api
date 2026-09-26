const mongoose = require("mongoose");
const Joi = require("joi");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER"
    }
  },
  {
    timestamps: true
  }
);

const UserModel = mongoose.model("users", userSchema);

function validateUser(user) {
  const schema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string().min(6).max(72).required()
  });

  return schema.validate(user);
}

function validateLogin(user) {
  const schema = Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string().min(6).max(72).required()
  });

  return schema.validate(user);
}

exports.UserModel = UserModel;
exports.validateUser = validateUser;
exports.validateLogin = validateLogin;