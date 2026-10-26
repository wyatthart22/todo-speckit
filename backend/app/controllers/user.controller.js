import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleUserOrNull } from "../authorization/authorization.js";

const SALT_ROUNDS = 10;
const User = db.user;
const exports = {};

const requiredMessage = (label, value) => {
  if (!value?.trim()) {
    return `${label} is required.`;
  }
  return null;
};

const toProfile = (user) => ({
  id: user.id,
  fName: user.fName,
  lName: user.lName,
  email: user.email,
  username: user.username,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

exports.findOne = async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  if (Number.isNaN(userId)) {
    return res.status(400).send({ message: "User id is invalid." });
  }

  try {
    const user = await getAccessibleUserOrNull(req, userId);

    if (!user) {
      return res.status(404).send({ message: `User with id=${userId} not found.` });
    }

    return res.send(toProfile(user));
  } catch (err) {
    logger.error(`User findOne failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to load profile." });
  }
};

exports.update = async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  if (Number.isNaN(userId)) {
    return res.status(400).send({ message: "User id is invalid." });
  }

  const password = req.body.password;

  if (password !== undefined && password !== null && password !== "" && password.length < 8) {
    return res.status(400).send({ message: "Password must be at least 8 characters." });
  }

  const fName = req.body.fName?.trim();
  const lName = req.body.lName?.trim();
  const email = req.body.email?.trim();
  const username = req.body.username?.trim().toLowerCase();

  const missing =
    requiredMessage("First name", fName) ||
    requiredMessage("Last name", lName) ||
    requiredMessage("Email", email) ||
    requiredMessage("Username", username);

  if (missing) {
    return res.status(400).send({ message: missing });
  }

  try {
    const user = await getAccessibleUserOrNull(req, userId);

    if (!user) {
      return res.status(404).send({ message: `User with id=${userId} not found.` });
    }

    const takenUsername = await User.findOne({
      where: { username, id: { [Op.ne]: user.id } },
    });

    if (takenUsername) {
      return res.status(400).send({ message: "Username is already taken." });
    }

    const takenEmail = await User.findOne({
      where: { email, id: { [Op.ne]: user.id } },
    });

    if (takenEmail) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    const updates = { fName, lName, email, username };

    if (password) {
      updates.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    await user.update(updates);
    return res.send(toProfile(user));
  } catch (err) {
    logger.error(`User update failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to update profile." });
  }
};

export default exports;
