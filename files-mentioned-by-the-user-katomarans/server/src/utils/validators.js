function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidAlias(value) {
  return /^[a-zA-Z0-9_-]{3,32}$/.test(value);
}

function normalizeUrl(value) {
  return value.trim();
}

module.exports = {
  isValidUrl,
  isValidAlias,
  normalizeUrl
};
