import express from 'express';
import DailyEntry from '../models/DailyEntry.js';

const router = express.Router();

// ✅ GET: Unique customers list
router.get('/', async (req, res) => {
  try {
    const entries = await DailyEntry.find();

    const customerMap = new Map();
    for (let entry of entries) {
      if (!customerMap.has(entry.srNo)) {
        customerMap.set(entry.srNo, entry.name);
      }
    }

    const customers = Array.from(customerMap, ([srNo, name]) => ({ srNo, name }));
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// ✅ POST: Add new customer
router.post('/', async (req, res) => {
  try {
    const { srNo, name } = req.body;
    const exists = await DailyEntry.findOne({ srNo, name });
    if (exists) return res.json({ message: "Customer already exists." });

    const dummy = new DailyEntry({
      srNo,
      name,
      date: new Date().toISOString().split('T')[0],
      items: [
        {
          itemName: "Customer Created",
          price: 0,
          costPrice: 0,
          quantity: 1,
          total: 0,
        },
      ],
      totalAmount: 0,
      paidAmount: 0,
      paymentStatus: "Paid",
    });

    await dummy.save();
    res.json({ success: true, message: "Customer created." });
  } catch (err) {
    console.error("Customer creation failed:", err);
    res.status(500).json({ error: "Failed to create customer" });
  }
});

// ✅ PUT: Update customer name by srNo
router.put('/:srNo', async (req, res) => {
  try {
    const { srNo } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });

    await DailyEntry.updateMany({ srNo }, { name });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update customer" });
  }
});

// ✅ DELETE: Delete customer and all their entries
router.delete('/:srNo', async (req, res) => {
  try {
    const { srNo } = req.params;
    await DailyEntry.deleteMany({ srNo });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete customer" });
  }
});

// ✅ POST: Add payment to a customer
router.post('/:srNo/payment', async (req, res) => {
  try {
    const { srNo } = req.params;
    const { amount } = req.body;

    const entry = await DailyEntry.findOne({ srNo }).sort({ date: -1 });
    if (!entry) return res.status(404).json({ error: "Customer not found" });

    entry.paidAmount += amount;
    const udhar = entry.totalAmount - entry.paidAmount;
    entry.paymentStatus = udhar <= 0 ? "Paid" : "Unpaid";
    entry.udhar = udhar;

    await entry.save();

    res.json({ success: true, message: "Payment added", entry, udhar });
  } catch (err) {
    res.status(500).json({ error: "Failed to add payment" });
  }
});

export default router;
