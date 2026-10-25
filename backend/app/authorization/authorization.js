import db from "../models/index.js";

const SESSION_INCLUDE = [{ model: db.user, as: "user" }];

export async function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).send({ message: "Unauthorized! No token provided." });
  }

  const session = await db.session.findOne({
    where: { token },
    include: SESSION_INCLUDE,
  });

  if (!session?.user || new Date(session.expirationDate) < new Date()) {
    return res.status(401).send({ message: "Unauthorized! Invalid or expired token." });
  }

  req.user = {
    id: session.user.id,
    role: session.user.role,
  };

  return next();
}

export async function getAccessibleListOrNull(req, listId) {
  return db.list.findOne({
    where: { id: listId, userId: req.user.id },
  });
}
