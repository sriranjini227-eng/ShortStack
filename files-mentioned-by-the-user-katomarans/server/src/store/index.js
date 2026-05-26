const crypto = require("crypto");
const mongoose = require("mongoose");
const connectDb = require("../config/db");
const Link = require("../models/Link");
const User = require("../models/User");

let mode = "memory";
const memory = {
  users: [],
  links: []
};

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

async function initStore() {
  if (process.env.MEMORY_DB === "true") {
    mode = "memory";
    console.warn("Using in-memory demo storage because MEMORY_DB=true");
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
    console.warn("MongoDB unavailable. Using in-memory demo storage for this run.");
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
  return normalizeMemoryLink(clone(link));
}

async function deleteLinkForUser(id, userId) {
  if (mode === "mongo") return Link.findOneAndDelete({ _id: id, user: userId });

  const index = memory.links.findIndex((item) => item._id === id && item.user === userId);
  if (index === -1) return null;
  const [deleted] = memory.links.splice(index, 1);
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
