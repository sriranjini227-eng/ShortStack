const express = require("express");
const crypto = require("crypto");
const requireAuth = require("../middleware/auth");
const {
  codeExists,
  createLink,
  deleteLinkForUser,
  findLinkForUser,
  findLinksByUser,
  getId,
  updateLinkForUser
} = require("../store");
const { isValidAlias, isValidUrl, normalizeUrl } = require("../utils/validators");

const router = express.Router();
const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function makeCode(length = 7) {
  return Array.from(crypto.randomBytes(length))
    .map((byte) => alphabet[byte % alphabet.length])
    .join("");
}

function toDto(link, req) {
  const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get("host")}`;
  const visits = [...link.visits].sort((a, b) => b.visitedAt - a.visitedAt);

  return {
    id: getId(link),
    originalUrl: link.originalUrl,
    code: link.code,
    shortUrl: `${baseUrl}/${link.code}`,
    createdAt: link.createdAt,
    expiresAt: link.expiresAt,
    clickCount: link.clickCount,
    lastVisitedAt: visits[0]?.visitedAt || null
  };
}

async function getUniqueCode(customAlias) {
  if (customAlias) {
    const exists = await codeExists(customAlias);
    if (exists) {
      const error = new Error("Custom alias is already in use");
      error.status = 409;
      throw error;
    }
    return customAlias;
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = makeCode();
    const exists = await codeExists(code);
    if (!exists) return code;
  }

  const error = new Error("Could not generate a unique short code");
  error.status = 500;
  throw error;
}

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const links = await findLinksByUser(req.user.id);
    return res.json({ links: links.map((link) => toDto(link, req)) });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const originalUrl = normalizeUrl(String(req.body.originalUrl || ""));
    const customAlias = String(req.body.customAlias || "").trim();
    const expiresAtRaw = req.body.expiresAt ? new Date(req.body.expiresAt) : null;

    if (!isValidUrl(originalUrl)) {
      return res.status(400).json({ message: "Enter a valid http or https URL" });
    }

    if (customAlias && !isValidAlias(customAlias)) {
      return res.status(400).json({
        message: "Custom alias must be 3-32 characters and use only letters, numbers, hyphens, or underscores"
      });
    }

    if (expiresAtRaw && Number.isNaN(expiresAtRaw.getTime())) {
      return res.status(400).json({ message: "Enter a valid expiry date" });
    }

    if (expiresAtRaw && expiresAtRaw <= new Date()) {
      return res.status(400).json({ message: "Expiry date must be in the future" });
    }

    const code = await getUniqueCode(customAlias);
    const link = await createLink({
      user: req.user.id,
      originalUrl,
      code,
      expiresAt: expiresAtRaw
    });

    return res.status(201).json({ link: toDto(link, req) });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const link = await findLinkForUser(req.params.id, req.user.id);
    if (!link) {
      return res.status(404).json({ message: "Short URL not found" });
    }

    const visits = [...link.visits]
      .sort((a, b) => b.visitedAt - a.visitedAt)
      .slice(0, 25)
      .map((visit) => ({
        visitedAt: visit.visitedAt,
        referrer: visit.referrer || "Direct",
        userAgent: visit.userAgent || "Unknown",
        ip: visit.ip || "Unknown"
      }));

    const dailyClicks = link.visits.reduce((acc, visit) => {
      const key = visit.visitedAt.toISOString().slice(0, 10);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return res.json({
      link: toDto(link, req),
      visits,
      dailyClicks: Object.entries(dailyClicks)
        .map(([date, clicks]) => ({ date, clicks }))
        .sort((a, b) => a.date.localeCompare(b.date))
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const originalUrl = normalizeUrl(String(req.body.originalUrl || ""));
    if (!isValidUrl(originalUrl)) {
      return res.status(400).json({ message: "Enter a valid http or https URL" });
    }

    const link = await updateLinkForUser(req.params.id, req.user.id, { originalUrl });

    if (!link) {
      return res.status(404).json({ message: "Short URL not found" });
    }

    return res.json({ link: toDto(link, req) });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await deleteLinkForUser(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ message: "Short URL not found" });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
