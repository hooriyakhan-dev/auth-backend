const router = require("express").Router();
const Expense = require("../models/Expense");
const protect = require("../middleware/auth");

router.use(protect); // every route below needs a logged-in user

const pick = (b) => ({
  title: b.title, amount: Number(b.amount), type: b.type,
  category: b.category, date: b.date, note: b.note,
});

// GET /api/expenses  -> only THIS user's items
router.get("/", async (req, res) => {
  const items = await Expense.find({ user: req.user._id }).sort({ date: -1, createdAt: -1 });
  res.json({ items });
});

// POST /api/expenses
router.post("/", async (req, res) => {
  try {
    const data = pick(req.body);
    if (!data.title || !data.amount) return res.status(400).json({ message: "Title and amount are required" });
    const item = await Expense.create({ ...data, user: req.user._id });
    res.status(201).json({ item });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /api/expenses/:id
router.put("/:id", async (req, res) => {
  try {
    const item = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, pick(req.body), { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json({ item });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE /api/expenses/:id
router.delete("/:id", async (req, res) => {
  try {
    const item = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
