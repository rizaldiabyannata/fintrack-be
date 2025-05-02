const request = require("supertest");
const mongoose = require("mongoose");
const index = require("../index"); // main app entry file
const Budget = require("../models/budget.model");
const Category = require("../models/category.model");
const User = require("../models/user.model");

// Mock mongoose models
jest.mock("../models/budget.model");
jest.mock("../models/category.model");
jest.mock("../models/user.model");

const token =
  "eyJhbGciOiJSUzI1NiIsImtpZCI6IjNmOWEwNTBkYzRhZTgyOGMyODcxYzMyNTYzYzk5ZDUwMjc3ODRiZTUiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiUml6YWxkaSBBYnlhbm5hdGEiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSUtRaUJqV2NuM2dnd3hMcmRpUXdJTlJtX01Ud3lIZzg3OEhjQVZiei1sVVBGcmo3Smdndz1zOTYtYyIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9maW50cmFjay0yZjYzYSIsImF1ZCI6ImZpbnRyYWNrLTJmNjNhIiwiYXV0aF90aW1lIjoxNzQ2MTA4MDc5LCJ1c2VyX2lkIjoiTmFqM0ZlYmZCYlo5Uzhjblo0d3hSVXJsNWhEMyIsInN1YiI6Ik5hajNGZWJmQmJaOVM4Y25aNHd4UlVybDVoRDMiLCJpYXQiOjE3NDYxMDgwODIsImV4cCI6MTc0NjExMTY4MiwiZW1haWwiOiJhbGRpemFyMjU1QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTAxMDEzNTExMDYzMTE0MDYxNTUxIl0sImVtYWlsIjpbImFsZGl6YXIyNTVAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoiZ29vZ2xlLmNvbSJ9fQ.qwTcdAQpesejPouWPM7fP3Cpy8L83TKrCTnitIXUPDDQnnC81W_lKhAnuPQkXbztcE8cVLCGTaOKSCio2jBOW895EoURFTUTcTYm-zMBMdMKg9C_kMT2IJsvMvnml2sruphYe3k1EUxh9-dJhIULChA7BJ7eg61arw6NdWNNN11w_iDwEcp6NO_2tylTZ4A9a_w1TIwre4wEq8-DwsiUIKknW40RSStFE1eM6agEP-y-2t2TgU3OwMHMFQ2T5s_0kKW4ATrts5VH2cYfRhyvgsgYhEUz1ftHOPvWjurzxLgcK3i0v9P9-qA9JtoAvchwWsC-MLjOu4oPbQef0HKM0g";

describe("Budget Controller", () => {
  let userMock, categoryMock;

  beforeAll(() => {
    // Mock user and category
    userMock = { uid: "Naj3FebfBbZ9S8cnZ4wxRUrl5hD3" };
    categoryMock = { name: "Food" };

    User.findOne.mockResolvedValue(userMock);
    Category.findOne.mockResolvedValue(categoryMock);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test for creating a budget
  describe("POST /api/budget", () => {
    it("should create a new budget successfully", async () => {
      // Mock the budget creation
      const budgetMock = {
        userUid: "test-uid",
        category: categoryMock._id,
        amountLimit: 1000,
      };
      Budget.prototype.save.mockResolvedValue(budgetMock);

      const response = await request(index)
        .post("/api/budget")
        .set("Authorization", `Bearer ${token}`) // simulate the token authorization
        .send({
          category: "Food",
          amountLimit: 1000,
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Budget created successfully");
      expect(response.body.budget.amountLimit).toBe(1000);
    });

    it("should return 400 if required fields are missing", async () => {
      const response = await request(index)
        .post("/api/budget")
        .set("Authorization", `Bearer ${token}`)
        .send({}); // Send an empty request

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("All fields are required");
    });
  });

  // Test for getting all budgets
  describe("GET /api/budget", () => {
    it("should return all budgets for the user", async () => {
      // Mock the budget find method
      const budgetsMock = [
        { userUid: "test-uid", category: categoryMock._id, amountLimit: 1000 },
      ];
      Budget.find.mockResolvedValue(budgetsMock);

      const response = await request(index)
        .get("/api/budget")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].amountLimit).toBe(1000);
    });

    it("should return 404 if user not found", async () => {
      User.findOne.mockResolvedValue(null); // Simulate user not found

      const response = await request(index)
        .get("/api/budget")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User id Not Found");
    });
  });

  // Test for getting budget for a specific month
  describe("POST /api/budget/monthly", () => {
    it("should calculate the total budget for the given month", async () => {
      const budgetMock = [
        { amountLimit: 1000, spentAmount: 200, endDate: "2025-06-01" },
        { amountLimit: 2000, spentAmount: 1000, endDate: "2025-06-01" },
      ];

      Budget.find.mockResolvedValue(budgetMock);

      const response = await request(index)
        .post("/api/budget/monthly")
        .set("Authorization", `Bearer ${token}`)
        .send({ category: "Food", month: "2025-06-01" });

      expect(response.status).toBe(200);
      expect(response.body.totalBudget).toBe(3000);
      expect(response.body.remainingBudgetList.length).toBe(2);
    });

    it("should return 404 if no budgets found", async () => {
      Budget.find.mockResolvedValue([]); // Simulate no budgets

      const response = await request(index)
        .post("/api/budget/monthly")
        .set("Authorization", `Bearer ${token}`)
        .send({ category: "Food", month: "2025-06-01" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("No budgets found");
    });
  });

  // Test for deleting a budget by ID
  describe("DELETE /api/budget/:id", () => {
    it("should delete the budget by ID", async () => {
      Budget.findByIdAndDelete.mockResolvedValue({ _id: "123" });

      const response = await request(index)
        .delete("/api/budget/123")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Budget deleted successfully");
    });

    it("should return 404 if the budget does not exist", async () => {
      Budget.findByIdAndDelete.mockResolvedValue(null);

      const response = await request(index)
        .delete("/api/budget/123")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Budget not found");
    });
  });
});
