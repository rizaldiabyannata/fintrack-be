// const request = require("supertest");
// const chai = require("chai");
// const expect = chai.expect;
// const app = require("../index"); // Mengimpor aplikasi Express yang sudah diekspor

// describe("POST /api/auth", () => {
//   it("should return 400 if Firebase UID is missing", (done) => {
//     request(app)
//       .post("/api/auth")
//       .send({ token: "valid-token" })
//       .end((err, res) => {
//         expect(res.status).to.equal(400);
//         expect(res.body.message).to.equal("Firebase UID is missing");
//         done();
//       });
//   });

//   it("should return 403 if no token is provided", (done) => {
//     request(app)
//       .post("/api/auth")
//       .send({ uid: "user123", email: "user@example.com", name: "John" })
//       .end((err, res) => {
//         expect(res.status).to.equal(403);
//         expect(res.body.message).to.equal("Token is required");
//         done();
//       });
//   });

//   it("should return 403 if invalid token is provided", (done) => {
//     request(app)
//       .post("/api/auth")
//       .set("Authorization", "Bearer invalid-token")
//       .send({ uid: "user123", email: "user@example.com", name: "John" })
//       .end((err, res) => {
//         expect(res.status).to.equal(403);
//         expect(res.body.message).to.equal("Unauthorized");
//         done();
//       });
//   });

//   it("should create a new user when the user does not exist", (done) => {
//     request(app)
//       .post("/api/auth")
//       .set("Authorization", "Bearer valid-token")
//       .send({ uid: "user123", email: "user@example.com", name: "John" })
//       .end((err, res) => {
//         expect(res.status).to.equal(200);
//         expect(res.body.message).to.equal("Authenticated");
//         done();
//       });
//   });

//   it("should update last login time when the user exists", (done) => {
//     request(app)
//       .post("/api/auth")
//       .set("Authorization", "Bearer valid-token")
//       .send({ uid: "user123", email: "user@example.com", name: "John" })
//       .end((err, res) => {
//         expect(res.status).to.equal(200);
//         expect(res.body.message).to.equal("Authenticated");
//         done();
//       });
//   });
// });
