const assert = require("node:assert/strict");
const test = require("node:test");

test("Budget: aggregates expenses across categories accurately", () => {
  const expenses = [
    { category: "fuel", amount: 2500, currency: "INR" },
    { category: "food", amount: 1200, currency: "INR" },
    { category: "hotel", amount: 4500, currency: "INR" },
    { category: "tolls", amount: 350, currency: "INR" },
    { category: "activities", amount: 800, currency: "INR" },
  ];

  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  assert.equal(totalExpense, 9350);

  const categoryTotals = expenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {});

  assert.equal(categoryTotals.fuel, 2500);
  assert.equal(categoryTotals.hotel, 4500);
  assert.equal(categoryTotals.food, 1200);
});

test("Checklist: tracks item completion and completion percentage", () => {
  const checklist = [
    { id: "item-1", title: "Valid ID / Driver's License", completed: true },
    { id: "item-2", title: "Offline Map Pack Downloaded", completed: true },
    { id: "item-3", title: "Emergency Medical Kit", completed: false },
    { id: "item-4", title: "Phone Car Charger", completed: true },
  ];

  const completedCount = checklist.filter((i) => i.completed).length;
  const totalCount = checklist.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  assert.equal(completedCount, 3);
  assert.equal(totalCount, 4);
  assert.equal(completionPercentage, 75);
});

