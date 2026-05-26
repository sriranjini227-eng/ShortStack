const crypto = require("crypto");
const fs = require("fs/promises");
const mongoose = require("mongoose");
const path = require("path");
const connectDb = require("../config/db");
const Link = require("../models/Link");
const User = require("../models/User");

let mode = "memory";
const memory = {
  users: [],
  links: []
};
const memoryDbPath = path.join(__dirname, "..", "..", ".data", "db.json");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function asDate(value) {
  return value ? new Date(value) : null;
}

function normalizeMemoryLink(link) {
  return {
    ...link,
    createdAt: asDate(link.createdAt),
    updatedAt: asDate(link.updatedAt),
    expiresAt: asDate(link.expiresAt),
    visits: link.visits.map((visit) => ({
      ...visit,
      visitedAt: asDate(visit.visitedAt)
    }))
  };
}

async function loadMemoryDb() {
  try {
    const raw = await fs.readFile(memoryDbPath, "utf8");
    const parsed = JSON.parse(raw);
    memory.users = Array.isArray(parsed.users) ? parsed.users : [];
    memory.links = Array.isArray(parsed.links) ? parsed.links : [];
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn(`Could not load local demo database: ${error.message}`);
    }
  }
}

async function saveMemoryDb() {
  if (mode === "mongo") return;
  await fs.mkdir(path.dirname(memoryDbPath), { recursive: true });
  await fs.writeFile(memoryDbPath, JSON.stringify(memory, null, 2));
}

async function initStore() {
  if (process.env.MEMORY_DB === "true") {
    mode = "memory";
    await loadMemoryDb();
    console.warn("Using local JSON demo storage because MEMORY_DB=true");
    return;
  }

  try {
    await connectDb();
    mode = "mongo";
  } catch (error) {
    if (process.env.REQUIRE_MONGO === "true") {
      throw error;
    }

    mode = "memory";
    await loadMemoryDb();
    console.warn("MongoDB unavailable. Using local JSON demo storage for this run.");
    console.warn(error.message);
  }
}

function getId(record) {
  return record._id?.toString?.() || record._id || record.id;
}

async function findUserByEmail(email) {
  if (mode === "mongo") return User.findOne({ email });
  const user = memory.users.find((item) => item.email === email);
  return user ? clone(user) : null;
}

async function createUser({ name, email, passwordHash }) {
  if (mode === "mongo") return User.create({ name, email, passwordHash });

  const now = new Date().toISOString();
  const user = {
    _id: crypto.randomUUID(),
    name,
    email,
    passwordHash,
    createdAt: now,
    updatedAt: now
  };
  memory.users.push(user);
  await saveMemoryDb();
  return clone(user);
}

async function codeExists(code) {
  if (mode === "mongo") return Boolean(await Link.exists({ code }));
  return memory.links.some((link) => link.code === code);
}

async function findLinksByUser(userId) {
  if (mode === "mongo") return Link.find({ user: userId }).sort({ createdAt: -1 });
  return memory.links
    .filter((link) => link.user === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((link) => normalizeMemoryLink(clone(link)));
}

async function createLink({ user, originalUrl, code, expiresAt }) {
  if (mode === "mongo") return Link.create({ user, originalUrl, code, expiresAt });

  const now = new Date().toISOString();
  const link = {
    _id: crypto.randomUUID(),
    user,
    originalUrl,
    code,
    clickCount: 0,
    visits: [],
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    createdAt: now,
    updatedAt: now
  };
  memory.links.push(link);
  await saveMemoryDb();
  return normalizeMemoryLink(clone(link));
}

async function findLinkForUser(id, userId) {
  if (mode === "mongo") return Link.findOne({ _id: id, user: userId });
  const link = memory.links.find((item) => item._id === id && item.user === userId);
  return link ? normalizeMemoryLink(clone(link)) : null;
}

async function updateLinkForUser(id, userId, updates) {
  if (mode === "mongo") {
    return Link.findOneAndUpdate({ _id: id, user: userId }, updates, { new: true });
  }

  const link = memory.links.find((item) => item._id === id && item.user === userId);
  if (!link) return null;
  Object.assign(link, updates, { updatedAt: new Date().toISOString() });
  await saveMemoryDb();
  return normalizeMemoryLink(clone(link));
}

async function deleteLinkForUser(id, userId) {
  if (mode === "mongo") return Link.findOneAndDelete({ _id: id, user: userId });

  const index = memory.links.findIndex((item) => item._id === id && item.user === userId);
  if (index === -1) return null;
  const [deleted] = memory.links.splice(index, 1);
  await saveMemoryDb();
  return normalizeMemoryLink(clone(deleted));
}

async function findLinkByCode(code) {
  if (mode === "mongo") return Link.findOne({ code });
  const link = memory.links.find((item) => item.code === code);
  return link ? normalizeMemoryLink(clone(link)) : null;
}

async function recordVisit(code, visit) {
  if (mode === "mongo") {
    const link = await Link.findOne({ code });
    if (!link) return null;
    link.clickCount += 1;
    link.visits.unshift(visit);
    link.visits = link.visits.slice(0, 500);
    await link.save();
    return link;
  }

  const link = memory.links.find((item) => item.code === code);
  if (!link) return null;
  link.clickCount += 1;
  link.visits.unshift({
    ...visit,
    visitedAt: visit.visitedAt.toISOString()
  });
  link.visits = link.visits.slice(0, 500);
  link.updatedAt = new Date().toISOString();
  await saveMemoryDb();
  return normalizeMemoryLink(clone(link));
}

function getStoreMode() {
  return mode;
}

async function closeStore() {
  if (mode === "mongo") await mongoose.disconnect();
}

module.exports = {
  codeExists,
  closeStore,
  createLink,
  createUser,
  deleteLinkForUser,
  findLinkByCode,
  findLinkForUser,
  findLinksByUser,
  findUserByEmail,
  getId,
  getStoreMode,
  initStore,
  recordVisit,
  updateLinkForUser
};
