import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../src/index.js";
import { runMigrations } from "../src/db/migrate.js";
import { seedDatabase } from "../src/db/seed.js";
describe("Security & Authorization Boundaries", () => {
  let complainantToken;
  let otherComplainantToken;
  let officerToken;
  let adminToken;
  beforeAll(async () => {
    await runMigrations();
    await seedDatabase(false);
    const res1 = await request(app).post("/api/v1/auth/login").send({ email: "rahul.student@example.com", password: "Synora@2026!" });
    complainantToken = res1.body.token;
    const res2 = await request(app).post("/api/v1/auth/login").send({ email: "dr.sunita.faculty@example.com", password: "Synora@2026!" });
    otherComplainantToken = res2.body.token;
    const res3 = await request(app).post("/api/v1/auth/login").send({ email: "officer.ab@synora.aicte.gov.in", password: "Synora@2026!" });
    officerToken = res3.body.token;
    const res4 = await request(app).post("/api/v1/auth/login").send({ email: "admin@synora.aicte.gov.in", password: "Synora@2026!" });
    adminToken = res4.body.token;
  });
  it("rejects unauthenticated requests to protected endpoints", async () => {
    const res = await request(app).get("/api/v1/complaints");
    expect(res.status).toBe(401);
  });
  it("prevents Complainant 1 from viewing Complainant 2 private case (Cross-User Isolation)", async () => {
    const res = await request(app).get("/api/v1/complaints/c1000000-0000-0000-0000-000000000002").set("Authorization", `Bearer ${complainantToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toContain("Access denied");
  });
  it("prevents Complainant from reading confidential internal investigation notes", async () => {
    const res = await request(app).get("/api/v1/complaints/c1000000-0000-0000-0000-000000000001/internal-notes").set("Authorization", `Bearer ${complainantToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toContain("Role 'complainant' is not authorized");
  });
  it("prevents Complainant from assigning cases or reassigning officers", async () => {
    const res = await request(app).post("/api/v1/complaints/c1000000-0000-0000-0000-000000000001/assignments").set("Authorization", `Bearer ${complainantToken}`).send({ bureau_id: "b1000000-0000-0000-0000-000000000001" });
    expect(res.status).toBe(403);
  });
  it("allows Case Officer to add internal investigation note", async () => {
    const res = await request(app).post("/api/v1/complaints/c1000000-0000-0000-0000-000000000002/internal-notes").set("Authorization", `Bearer ${officerToken}`).send({ note: "Reviewed institutional records. Evidence corroborated with faculty roster." });
    expect(res.status).toBe(201);
    expect(res.body.note).toContain("Reviewed institutional records");
  });
  it("rejects invalid status workflow transitions", async () => {
    const res = await request(app).post("/api/v1/complaints/c1000000-0000-0000-0000-000000000005/transitions").set("Authorization", `Bearer ${adminToken}`).send({ to_status: "CLOSED" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Invalid workflow transition");
  });
});
