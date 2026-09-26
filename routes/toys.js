const express = require("express");
const mongoose = require("mongoose");

const { ToyModel, validateToy } = require("../models/toyModel");
const { auth } = require("../middlewares/auth");

const router = express.Router();

// בדיקת מספר עמוד והמרתו למספר הרשומות שעליהן מדלגים
function pagination(req, res, next) {
  const pageText = req.query.skip === undefined ? "0" : req.query.skip;

  if (
    typeof pageText !== "string" ||
    !/^\d+$/.test(pageText)
  ) {
    return res.status(400).json({
      msg: "skip must be a non-negative page number"
    });
  }

  const page = Number(pageText);

  if (!Number.isSafeInteger(page * 10)) {
    return res.status(400).json({
      msg: "skip is too large"
    });
  }

  req.offset = page * 10;

  next();
}

// חיפוש טקסט רגיל, גם אם הוזנו סימנים מיוחדים
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validId(req, res, next) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({
      msg: "Invalid toy id"
    });
  }

  next();
}

// כל הצעצועים, עם אפשרות לחיפוש ולסינון לפי קטגוריה
router.get("/", pagination, async (req, res) => {
  try {
    const filter = {};

    if (req.query.category !== undefined) {
      if (typeof req.query.category !== "string") {
        return res.status(400).json({
          msg: "category must be a string"
        });
      }

      filter.category = req.query.category;
    }

    if (req.query.s !== undefined) {
      if (typeof req.query.s !== "string") {
        return res.status(400).json({
          msg: "s must be a string"
        });
      }

      const search = new RegExp(escapeRegex(req.query.s), "i");

      filter.$or = [
        { name: search },
        { info: search }
      ];
    }

    const toys = await ToyModel.find(filter)
      .sort({ _id: -1 })
      .skip(req.offset)
      .limit(10);

    res.json(toys);
  } catch (err) {
    res.status(500).json({ msg: "Error getting toys" });
  }
});

// חיפוש לפי שם או תיאור
router.get("/search", pagination, async (req, res) => {
  const text = req.query.s === undefined ? "" : req.query.s;

  if (typeof text !== "string") {
    return res.status(400).json({
      msg: "s must be a string"
    });
  }

  try {
    const search = new RegExp(escapeRegex(text), "i");

    const toys = await ToyModel.find({
      $or: [
        { name: search },
        { info: search }
      ]
    })
      .sort({ _id: -1 })
      .skip(req.offset)
      .limit(10);

    res.json(toys);
  } catch (err) {
    res.status(500).json({ msg: "Error searching toys" });
  }
});

// שליפה לפי קטגוריה
router.get("/category/:catname", pagination, async (req, res) => {
  try {
    const toys = await ToyModel.find({
      category: req.params.catname
    })
      .sort({ _id: -1 })
      .skip(req.offset)
      .limit(10);

    res.json(toys);
  } catch (err) {
    res.status(500).json({ msg: "Error getting category" });
  }
});

// ספירת כל הצעצועים
router.get("/count", async (req, res) => {
  try {
    const count = await ToyModel.countDocuments();

    res.json({ count });
  } catch (err) {
    res.status(500).json({ msg: "Error counting toys" });
  }
});

// סינון לפי טווח מחירים
router.get("/prices", pagination, async (req, res) => {
  const minText = req.query.min === undefined ? "1" : req.query.min;
  const maxText = req.query.max === undefined ? "999" : req.query.max;

  if (
    typeof minText !== "string" ||
    typeof maxText !== "string" ||
    minText.trim() === "" ||
    maxText.trim() === ""
  ) {
    return res.status(400).json({ msg: "Invalid price range" });
  }

  const min = Number(minText);
  const max = Number(maxText);

  if (
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    min < 0 ||
    max < min
  ) {
    return res.status(400).json({ msg: "Invalid price range" });
  }

  try {
    const toys = await ToyModel.find({
      price: { $gte: min, $lte: max }
    })
      .sort({ _id: -1 })
      .skip(req.offset)
      .limit(10);

    res.json(toys);
  } catch (err) {
    res.status(500).json({ msg: "Error getting toys by price" });
  }
});

// צעצוע בודד
router.get("/single/:id", validId, async (req, res) => {
  try {
    const toy = await ToyModel.findById(req.params.id);

    if (!toy) {
      return res.status(404).json({ msg: "Toy not found" });
    }

    res.json(toy);
  } catch (err) {
    res.status(500).json({ msg: "Error getting toy" });
  }
});

// הוספת צעצוע למשתמש המחובר
router.post("/", auth, async (req, res) => {
  const validation = validateToy(req.body);

  if (validation.error) {
    return res.status(400).json({
      msg: validation.error.details[0].message
    });
  }

  try {
    const toy = new ToyModel(validation.value);

    toy.user_id = req.tokenData._id;

    await toy.save();

    res.status(201).json({
      msg: "Toy added successfully",
      toy
    });
  } catch (err) {
    res.status(500).json({ msg: "Error adding toy" });
  }
});

// עריכה רק כאשר הצעצוע שייך למשתמש המחובר
router.put("/:id", auth, validId, async (req, res) => {
  const validation = validateToy(req.body);

  if (validation.error) {
    return res.status(400).json({
      msg: validation.error.details[0].message
    });
  }

  try {
    const toy = await ToyModel.findOneAndUpdate(
      {
        _id: req.params.id,
        user_id: req.tokenData._id
      },
      { $set: validation.value },
      {
        new: true,
        runValidators: true
      }
    );

    if (!toy) {
      return res.status(404).json({
        msg: "Toy not found or does not belong to you"
      });
    }

    res.json({
      msg: "Toy updated successfully",
      toy
    });
  } catch (err) {
    res.status(500).json({ msg: "Error updating toy" });
  }
});

// מחיקה רק כאשר הצעצוע שייך למשתמש המחובר
router.delete("/:id", auth, validId, async (req, res) => {
  try {
    const toy = await ToyModel.findOneAndDelete({
      _id: req.params.id,
      user_id: req.tokenData._id
    });

    if (!toy) {
      return res.status(404).json({
        msg: "Toy not found or does not belong to you"
      });
    }

    res.json({
      msg: "Toy deleted successfully",
      toy
    });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting toy" });
  }
});

module.exports = router;