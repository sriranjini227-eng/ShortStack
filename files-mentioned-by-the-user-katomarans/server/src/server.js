require("dotenv").config();

const cors = require("cors");
const express = require("express");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/auth");
const linkRoutes = require("./routes/links");
const { findLinkByCode, getStoreMode, initStore, recordVisit } = require("./store");

const app = express();
const port = process.env.PORT || 4000;

app.set("trust proxy", 1);
app.use(cors({ origin: process.env.CLIENT_URL || "http://127.0.0.1:5173" }));
app.use(express.json({ limit: "1mb" }));

app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 250,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, storage: getStoreMode() });
});

app.use("/api/auth", authRoutes);
app.use("/api/links", linkRoutes);

app.get("/:code", async (req, res, next) => {
  try {
    const link = await findLinkByCode(req.params.code);
    if (!link) {
      return res.status(404).send("Short URL not found");
    }

    if (link.expiresAt && link.expiresAt <= new Date()) {
      return res.status(410).send("This short URL has expired");
    }

    await recordVisit(req.params.code, {
      visitedAt: new Date(),
      ip: req.ip,
      userAgent: req.get("user-agent"),
      referrer: req.get("referer")
    });

    return res.redirect(302, link.originalUrl);
  } catch (error) {
    return next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  const message = status === 500 ? "Something went wrong" : error.message;
  if (status === 500) console.error(error);
  res.status(status).json({ message });
});

initStore()
  .then(() => {
    app.listen(port, () => {
      console.log(`API running at http://127.0.0.1:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
