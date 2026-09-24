const requestHandler = require("../server");

module.exports = (req, res) => {
  const pathParam = req.query?.path;
  if (pathParam) {
    const path = Array.isArray(pathParam) ? pathParam.join("/") : pathParam;
    const incoming = new URL(req.url || "/", "http://localhost");
    incoming.searchParams.delete("path");
    const query = incoming.searchParams.toString();
    req.url = `/api/${String(path).replace(/^\/+/, "")}${query ? `?${query}` : ""}`;
  }
  return requestHandler(req, res);
};
