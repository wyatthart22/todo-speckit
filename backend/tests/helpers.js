import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";

export const syncTestDatabase = async () => {
  await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
  await db.sequelize.sync({ force: true });
  await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
};

export const registerUser = async (overrides = {}) => {
  const body = {
    fName: "Jane",
    lName: "Doe",
    email: "jdoe@example.com",
    username: "jdoe",
    password: "password123",
    ...overrides,
  };

  const res = await request(app).post("/todo/register").send(body);
  return { res, body };
};

export const loginUser = async (overrides = {}) => {
  const body = {
    username: "jdoe",
    password: "password123",
    ...overrides,
  };

  const res = await request(app).post("/todo/login").send(body);
  return { res, body };
};

export const bearer = (token) => ({ Authorization: `Bearer ${token}` });

export const createList = async (token, body = {}) => {
  const payload = { name: "Groceries", ...body };
  const res = await request(app).post("/todo/lists").set(bearer(token)).send(payload);
  return { res, body: payload };
};
