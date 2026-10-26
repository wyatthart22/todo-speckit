/**
 * Feature 3 — Todo List Item Management
 * Spec: features/feature-3-todo-list-item-management.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { bearer, createList, createTodo, registerUser, syncTestDatabase } from "./helpers.js";

describe("Feature 3 — Todo List Item Management", () => {
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

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      const { res: list } = await createList(userA.body.token, { name: "Groceries" });
      const { res } = await createTodo(userA.body.token, list.body.id, { title: "Buy milk" });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: expect.any(Number),
        title: "Buy milk",
        completed: false,
        userId: userA.body.userId,
        listId: list.body.id,
      });
    });

    it("User adds a todo with an empty title", async () => {
      const { res: list } = await createList(userA.body.token);
      const { res } = await createTodo(userA.body.token, list.body.id, { title: "   " });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Todo title is required." });
      expect(await db.todo.count()).toBe(0);
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("User only sees their own todos when opening items", async () => {
      const { res: listA } = await createList(userA.body.token, { name: "Work" });
      const { res: listB } = await createList(userB.body.token, { name: "Work" });
      await createTodo(userA.body.token, listA.body.id, { title: "My task" });
      await createTodo(userB.body.token, listB.body.id, { title: "Their task" });

      const res = await request(app)
        .get(`/todo/lists/${listA.body.id}/todos`)
        .set(bearer(userA.body.token));

      expect(res.status).toBe(200);
      expect(res.body.map((todo) => todo.title)).toEqual(["My task"]);
      expect(res.body.map((todo) => todo.title)).not.toContain("Their task");
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      const { res: list } = await createList(userA.body.token);
      const { res: created } = await createTodo(userA.body.token, list.body.id, { title: "Buy milk" });

      const res = await request(app)
        .put(`/todo/todos/${created.body.id}`)
        .set(bearer(userA.body.token))
        .send({ completed: true });

      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(true);
    });

    it("User marks a completed todo as incomplete", async () => {
      const { res: list } = await createList(userA.body.token);
      const { res: created } = await createTodo(userA.body.token, list.body.id, { title: "Buy milk" });
      await request(app)
        .put(`/todo/todos/${created.body.id}`)
        .set(bearer(userA.body.token))
        .send({ completed: true });

      const res = await request(app)
        .put(`/todo/todos/${created.body.id}`)
        .set(bearer(userA.body.token))
        .send({ completed: false });

      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(false);
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      const { res: list } = await createList(userA.body.token);
      const { res: created } = await createTodo(userA.body.token, list.body.id, { title: "Buy milk" });

      const res = await request(app)
        .put(`/todo/todos/${created.body.id}`)
        .set(bearer(userA.body.token))
        .send({ title: "Buy oat milk" });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Buy oat milk");
    });

    it("User deletes a todo", async () => {
      const { res: list } = await createList(userA.body.token);
      const { res: created } = await createTodo(userA.body.token, list.body.id, { title: "Buy milk" });

      const res = await request(app)
        .delete(`/todo/todos/${created.body.id}`)
        .set(bearer(userA.body.token));

      expect([200, 204]).toContain(res.status);
      expect(await db.todo.findByPk(created.body.id)).toBeNull();
    });
  });

  describe("US-3.5 — Private items only", () => {
    it("User cannot read todos in another user's list", async () => {
      const { res: listB } = await createList(userB.body.token, { name: "Secret" });
      await createTodo(userB.body.token, listB.body.id, { title: "Hidden task" });

      const res = await request(app)
        .get(`/todo/lists/${listB.body.id}/todos`)
        .set(bearer(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: `List with id=${listB.body.id} not found.` });
      expect(JSON.stringify(res.body)).not.toContain("Hidden task");
    });

    it("User attempts to add a todo to another user's list", async () => {
      const { res: listB } = await createList(userB.body.token, { name: "Secret" });

      const { res } = await createTodo(userA.body.token, listB.body.id, { title: "Intruder task" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: `List with id=${listB.body.id} not found.` });
      expect(await db.todo.count({ where: { listId: listB.body.id } })).toBe(0);
    });

    it("User attempts to rename another user's todo", async () => {
      const { res: listB } = await createList(userB.body.token);
      const { res: todoB } = await createTodo(userB.body.token, listB.body.id, { title: "Hidden task" });

      const res = await request(app)
        .put(`/todo/todos/${todoB.body.id}`)
        .set(bearer(userA.body.token))
        .send({ title: "Hijacked" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: `Todo with id=${todoB.body.id} not found.` });

      const stored = await db.todo.findByPk(todoB.body.id);
      expect(stored.title).toBe("Hidden task");
    });

    it("User attempts to delete another user's todo", async () => {
      const { res: listB } = await createList(userB.body.token);
      const { res: todoB } = await createTodo(userB.body.token, listB.body.id, { title: "Hidden task" });

      const res = await request(app)
        .delete(`/todo/todos/${todoB.body.id}`)
        .set(bearer(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: `Todo with id=${todoB.body.id} not found.` });
      expect(await db.todo.findByPk(todoB.body.id)).not.toBeNull();
    });

    it("Client cannot assign a todo to another user on create", async () => {
      const { res: list } = await createList(userA.body.token, { name: "Groceries" });
      const { res } = await createTodo(userA.body.token, list.body.id, {
        title: "Buy milk",
        userId: 999,
      });

      expect(res.status).toBe(201);
      expect(res.body.userId).toBe(userA.body.userId);
      expect(res.body.userId).not.toBe(999);
    });

    it("Unauthenticated API request for todos", async () => {
      const res = await request(app).get("/todo/lists/1/todos");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe("US-3.6 — Lists carry their items", () => {
    it("Deleting a list removes its todos", async () => {
      const { res: list } = await createList(userA.body.token, { name: "Groceries" });
      await createTodo(userA.body.token, list.body.id, { title: "Buy milk" });
      await createTodo(userA.body.token, list.body.id, { title: "Buy eggs" });

      const res = await request(app)
        .delete(`/todo/lists/${list.body.id}`)
        .set(bearer(userA.body.token));

      expect([200, 204]).toContain(res.status);
      expect(await db.todo.count({ where: { listId: list.body.id } })).toBe(0);

      const todosRes = await request(app)
        .get(`/todo/lists/${list.body.id}/todos`)
        .set(bearer(userA.body.token));

      expect(todosRes.status).toBe(404);
    });
  });
});
