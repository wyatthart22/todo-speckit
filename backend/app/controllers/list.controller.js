import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleListOrNull } from "../authorization/authorization.js";

const List = db.list;
const exports = {};

const parseListId = (value) => parseInt(value, 10);

const validateName = (rawName) => {
  const name = rawName?.trim();

  if (!name) {
    return { error: "List name is required." };
  }

  if (name.length > 100) {
    return { error: "List name must be 100 characters or fewer." };
  }

  return { name };
};

exports.findAll = async (req, res) => {
  try {
    const lists = await List.findAll({
      where: { userId: req.user.id },
      order: [["name", "ASC"]],
    });
    return res.send(lists);
  } catch (err) {
    logger.error(`List findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to load lists." });
  }
};

exports.create = async (req, res) => {
  const { name, error } = validateName(req.body.name);

  if (error) {
    return res.status(400).send({ message: error });
  }

  try {
    const list = await List.create({
      name,
      userId: req.user.id,
    });
    return res.status(201).send(list);
  } catch (err) {
    logger.error(`List create failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to create list." });
  }
};

exports.update = async (req, res) => {
  const listId = parseListId(req.params.listId);

  if (Number.isNaN(listId)) {
    return res.status(400).send({ message: "List id is invalid." });
  }

  const { name, error } = validateName(req.body.name);

  if (error) {
    return res.status(400).send({ message: error });
  }

  try {
    const list = await getAccessibleListOrNull(req, listId);

    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    await list.update({ name });
    return res.send(list);
  } catch (err) {
    logger.error(`List update failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to update list." });
  }
};

exports.delete = async (req, res) => {
  const listId = parseListId(req.params.listId);

  if (Number.isNaN(listId)) {
    return res.status(400).send({ message: "List id is invalid." });
  }

  try {
    const list = await getAccessibleListOrNull(req, listId);

    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    await list.destroy();
    return res.status(200).send(list);
  } catch (err) {
    logger.error(`List delete failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to delete list." });
  }
};

export default exports;
