import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import db from "../models/index.js";
import authConfig from "../config/auth.config.js";
import logger from "../config/logger.js";

const SALT_ROUNDS = 10;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const User = db.user;
const Session = db.session;

const exports = {};

const requiredMessage = (label, value) => {
  if (!value?.trim()) {
    return `${label} is required.`;
  }
  return null;
};

const toAuthPayload = (user, token) => ({
  userId: user.id,
  username: user.username,
  email: user.email,
  fName: user.fName,
  lName: user.lName,
  role: user.role,
  token,
});

const createSession = async (user) => {
  const token = jwt.sign({ id: user.id }, authConfig.secret, { expiresIn: 86400 });
  await Session.create({
    token,
    email: user.email,
    expirationDate: new Date(Date.now() + SESSION_TTL_MS),
    userId: user.id,
  });
  return token;
};

const reuseOrCreateSession = async (user) => {
  const existing = await Session.findOne({
    where: {
      userId: user.id,
      expirationDate: { [Op.gt]: new Date() },
      token: { [Op.ne]: "" },
    },
  });

  if (existing) {
    return existing.token;
  }

  return createSession(user);
};

exports.register = async (req, res) => {
  const fName = req.body.fName?.trim();
  const lName = req.body.lName?.trim();
  const email = req.body.email?.trim();
  const username = req.body.username?.trim().toLowerCase();
  const password = req.body.password;

  const missing =
    requiredMessage("First name", fName) ||
    requiredMessage("Last name", lName) ||
    requiredMessage("Email", email) ||
    requiredMessage("Username", username) ||
    requiredMessage("Password", password);

  if (missing) {
    return res.status(400).send({ message: missing });
  }

  if (password.length < 8) {
    return res.status(400).send({ message: "Password must be at least 8 characters." });
  }

  try {
    const takenUsername = await User.findOne({ where: { username } });
    if (takenUsername) {
      return res.status(400).send({ message: "Username is already taken." });
    }

    const takenEmail = await User.findOne({ where: { email } });
    if (takenEmail) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    const user = await User.create({
      fName,
      lName,
      email,
      username,
      password: await bcrypt.hash(password, SALT_ROUNDS),
      role: "worker",
    });

    const token = await createSession(user);
    return res.status(201).send(toAuthPayload(user, token));
  } catch (err) {
    logger.error(`Register failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to register." });
  }
};

exports.login = async (req, res) => {
  const username = req.body.username?.trim().toLowerCase();
  const password = req.body.password;

  const missing = requiredMessage("Username", username) || requiredMessage("Password", password);
  if (missing) {
    return res.status(400).send({ message: missing });
  }

  try {
    const user = await User.unscoped().findOne({ where: { username } });
    const passwordMatches = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !passwordMatches) {
      return res.status(401).send({ message: "Invalid username or password." });
    }

    const token = await reuseOrCreateSession(user);
    return res.status(200).send(toAuthPayload(user, token));
  } catch (err) {
    logger.error(`Login failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to sign in." });
  }
};

exports.logout = async (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.split(" ")[1];

  try {
    await Session.update({ token: "" }, { where: { token } });
    return res.status(200).send({ message: "Signed out." });
  } catch (err) {
    logger.error(`Logout failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to sign out." });
  }
};

export default exports;
