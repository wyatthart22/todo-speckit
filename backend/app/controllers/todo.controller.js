import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleListOrNull, getAccessibleTodoOrNull } from "../authorization/authorization.js";

const Todo = db.todo;
const exports = {};

const parseId = (value) => parseInt(value, 10);

const validateTitle = (rawTitle) => {
  const title = rawTitle?.trim();

  if (!title) {
    return { error: "Todo title is required." };
  }

  if (title.length > 255) {
    return { error: "Todo title must be 255 characters or fewer." };
  }

  return { title };
};

const notFoundList = (listId) => ({ message: `List with id=${listId} not found.` });
const notFoundTodo = (todoId) => ({ message: `Todo with id=${todoId} not found.` });

exports.findAllForList = async (req, res) => {
  const listId = parseId(req.params.listId);

  if (Number.isNaN(listId)) {
    return res.status(400).send({ message: "List id is invalid." });
  }

  try {
    const list = await getAccessibleListOrNull(req, listId);

    if (!list) {
      return res.status(404).send(notFoundList(listId));
    }

    const todos = await Todo.findAll({
      where: { listId, userId: req.user.id },
      order: [
        ["completed", "ASC"],
        ["createdAt", "ASC"],
      ],
    });

    return res.send(todos);
  } catch (err) {
    logger.error(`Todo findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to load todos." });
  }
};

exports.createForList = async (req, res) => {
  const listId = parseId(req.params.listId);

  if (Number.isNaN(listId)) {
    return res.status(400).send({ message: "List id is invalid." });
  }

  const { title, error } = validateTitle(req.body.title);

  if (error) {
    return res.status(400).send({ message: error });
  }

  try {
    const list = await getAccessibleListOrNull(req, listId);

    if (!list) {
      return res.status(404).send(notFoundList(listId));
    }

    const todo = await Todo.create({
      title,
      completed: false,
      listId: list.id,
      userId: req.user.id,
    });

    return res.status(201).send(todo);
  } catch (err) {
    logger.error(`Todo create failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to create todo." });
  }
};

exports.update = async (req, res) => {
  const todoId = parseId(req.params.id);

  if (Number.isNaN(todoId)) {
    return res.status(400).send({ message: "Todo id is invalid." });
  }

  const updates = {};

  if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
    const { title, error } = validateTitle(req.body.title);

    if (error) {
      return res.status(400).send({ message: error });
    }

    updates.title = title;
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "completed")) {
    updates.completed = Boolean(req.body.completed);
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).send({ message: "Title or completed is required." });
  }

  try {
    const todo = await getAccessibleTodoOrNull(req, todoId);

    if (!todo) {
      return res.status(404).send(notFoundTodo(todoId));
    }

    await todo.update(updates);
    return res.send(todo);
  } catch (err) {
    logger.error(`Todo update failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to update todo." });
  }
};

exports.delete = async (req, res) => {
  const todoId = parseId(req.params.id);

  if (Number.isNaN(todoId)) {
    return res.status(400).send({ message: "Todo id is invalid." });
  }

  try {
    const todo = await getAccessibleTodoOrNull(req, todoId);

    if (!todo) {
      return res.status(404).send(notFoundTodo(todoId));
    }

    await todo.destroy();
    return res.status(200).send(todo);
  } catch (err) {
    logger.error(`Todo delete failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to delete todo." });
  }
};

export default exports;
