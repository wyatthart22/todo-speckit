/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { bearer, createList, registerUser, syncTestDatabase } from "./helpers.js";

describe("Feature 2 — Todo List Management", () => {
  let userA;
  let userB;

  beforeEach(async () => {
    await syncTestDatabase();
    ({ res: userA } = await registerUser());
    ({ res: userB } = await registerUser({
      username: "jsmith",
      email: "jsmith@example.com",
      fName: "John",
      lName: "Smith",
    }));
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      const { res } = await createList(userA.body.token, { name: "Groceries" });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: expect.any(Number),
        name: "Groceries",
        userId: userA.body.userId,
      });
    });

    it("User creates a list with an empty name", async () => {
      const { res } = await createList(userA.body.token, { name: "   " });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "List name is required." });
      expect(await db.list.count()).toBe(0);
    });

    it("User creates a list with a name that is too long", async () => {
      const { res } = await createList(userA.body.token, { name: "x".repeat(101) });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "List name must be 100 characters or fewer." });
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      await createList(userA.body.token, { name: "Work" });
      await createList(userA.body.token, { name: "Personal" });

      const res = await request(app).get("/todo/lists").set(bearer(userA.body.token));

      expect(res.status).toBe(200);
      expect(res.body.map((list) => list.name)).toEqual(["Personal", "Work"]);
    });

    it("User cannot see another user's lists", async () => {
      await createList(userA.body.token, { name: "Groceries" });
      await createList(userB.body.token, { name: "Secret Project" });

      const res = await request(app).get("/todo/lists").set(bearer(userA.body.token));

      expect(res.status).toBe(200);
      expect(res.body.every((list) => list.userId === userA.body.userId)).toBe(true);
      expect(res.body.map((list) => list.name)).not.toContain("Secret Project");
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      const { res: created } = await createList(userA.body.token, { name: "Groceries" });

      const res = await request(app)
        .put(`/todo/lists/${created.body.id}`)
        .set(bearer(userA.body.token))
        .send({ name: "Shopping" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: created.body.id,
        name: "Shopping",
        userId: userA.body.userId,
      });
    });

    it("User deletes a list", async () => {
      const { res: created } = await createList(userA.body.token, { name: "Groceries" });

      const res = await request(app)
        .delete(`/todo/lists/${created.body.id}`)
        .set(bearer(userA.body.token));

      expect([200, 204]).toContain(res.status);
      expect(await db.list.findByPk(created.body.id)).toBeNull();
    });
  });

  describe("US-2.5 — Private lists only", () => {
    it("User attempts to rename another user's list", async () => {
      const { res: created } = await createList(userB.body.token, { name: "Secret Project" });

      const res = await request(app)
        .put(`/todo/lists/${created.body.id}`)
        .set(bearer(userA.body.token))
        .send({ name: "Hijacked" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: `List with id=${created.body.id} not found.` });

      const stored = await db.list.findByPk(created.body.id);
      expect(stored.name).toBe("Secret Project");
    });

    it("User attempts to delete another user's list", async () => {
      const { res: created } = await createList(userB.body.token, { name: "Secret Project" });

      const res = await request(app)
        .delete(`/todo/lists/${created.body.id}`)
        .set(bearer(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: `List with id=${created.body.id} not found.` });
      expect(await db.list.findByPk(created.body.id)).not.toBeNull();
    });

    it("Client cannot assign a list to another user on create", async () => {
      const { res } = await createList(userA.body.token, {
        name: "Groceries",
        userId: 999,
      });

      expect(res.status).toBe(201);
      expect(res.body.userId).toBe(userA.body.userId);
      expect(res.body.userId).not.toBe(999);
    });

    it("Unauthenticated API request to lists", async () => {
      const res = await request(app).get("/todo/lists");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });
  });
});
