const mongoose = require("mongoose");
const Joi = require("joi");

const toySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    info: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    img_url: {
      type: String,
      default: ""
    },
    price: {
      type: Number,
      min: 1,
      max: 999,
      required: true
    },
    user_id: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const ToyModel = mongoose.model("toys", toySchema);

function validateToy(toy) {
  const schema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    info: Joi.string().trim().min(2).max(500).required(),
    category: Joi.string().trim().min(2).max(100).required(),
    img_url: Joi.string()
      .uri({ scheme: ["http", "https"] })
      .allow(""),
    price: Joi.number().min(1).max(999).required()
  });

  return schema.validate(toy);
}

exports.ToyModel = ToyModel;
exports.validateToy = validateToy;