const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const ROOM_SIZES = [6, 8, 16, 32, 64, 100];
const CRAB_PRESETS = [
  { id: "rocket", name: "Rocket", color: "#ff6e5d", emoji: "🦀", number: 1 },
  { id: "bubbles", name: "Bubbles", color: "#65c7ff", emoji: "🦀", number: 2 },
  { id: "lucky", name: "Lucky", color: "#71d49b", emoji: "🦀", number: 3 },
  { id: "goldie", name: "Goldie", color: "#f7c85c", emoji: "🦀", number: 4 },
  { id: "sleepy", name: "Sleepy", color: "#b887ff", emoji: "🦀", number: 5 },
  { id: "chaos", name: "Chaos", color: "#ff995a", emoji: "🦀", number: 6 },
];
const CRAB_COLORS = ["#65e0d1", "#ffb45c", "#ff7b87", "#8db8ff", "#c795ff", "#7de0a0", "#f3d36b", "#7ed7e8"];
const CRABS = [...CRAB_PRESETS, ...Array.from({ length: 94 }, (_, index) => { const number = index + 7; return { id: `crab-${number}`, name: `Coral ${String(number).padStart(2, "0")}`, color: CRAB_COLORS[index % CRAB_COLORS.length], emoji: "🦀", number }; })];
const rooms = new Map();
const subscribers = new Map();
const now = () => Date.now();
const makeId = (bytes = 8) => crypto.randomBytes(bytes).toString("hex");
const makeCode = () => crypto.randomBytes(3).toString("hex").toUpperCase();
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const cleanName = (value) => String(value || "").trim().slice(0, 20);
const getRoom = (code) => rooms.get(String(code || "").toUpperCase());
const getPlayer = (room, sessionId) => room?.players.find((player) => player.sessionId === sessionId);

function sendJson(res, status, payload) { res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }); res.end(JSON.stringify(payload)); }
function sendError(res, status, message) { sendJson(res, status, { error: message }); }
async function readJson(req) { let raw = ""; for await (const chunk of req) raw += chunk; try { return raw ? JSON.parse(raw) : {}; } catch { return {}; } }

function createRoom(nickname, requestedMaxPlayers = 6) {
  let code = makeCode(); while (rooms.has(code)) code = makeCode();
  const sessionId = makeId(12);
  const parsedMaxPlayers = Number(requestedMaxPlayers);
  const maxPlayers = ROOM_SIZES.includes(parsedMaxPlayers) ? parsedMaxPlayers : 6;
  const room = { code, maxPlayers, hostSessionId: sessionId, phase: "lobby", createdAt: now(), lastActivity: now(), players: [{ sessionId, nickname, crab: "rocket", ready: false, joinedAt: now(), online: true }], race: null, wins: {} };
  rooms.set(code, room); return { room, sessionId };
}

function snapshot(room, sessionId) {
  const me = getPlayer(room, sessionId);
  return { room: { code: room.code, maxPlayers: room.maxPlayers, hostSessionId: room.hostSessionId, phase: room.phase, players: room.players.map((player) => ({ ...player })), race: room.race ? { ...room.race, lanes: room.race.lanes.map((lane) => ({ ...lane })) } : null, wins: { ...room.wins }, updatedAt: now() }, sessionId, me: me ? { crab: me.crab, ready: me.ready, isHost: room.hostSessionId === sessionId } : null };
}

function broadcast(room) {
  room.lastActivity = now();
  for (const subscriber of subscribers.get(room.code) || []) {
    try { subscriber.res.write(`data: ${JSON.stringify(snapshot(room, subscriber.sessionId))}\n\n`); } catch { /* closed connection */ }
  }
}

function startRace(room) {
  const online = room.players.filter((player) => player.online);
  if (!online.length || online.some((player) => !player.ready)) return "Tất cả người chơi online phải sẵn sàng";
  const selected = new Map(online.map((player) => [player.crab, player]));
  const lanes = CRABS.slice(0, room.maxPlayers).sort(() => Math.random() - 0.5).map((item, laneIndex) => { const owner = selected.get(item.id); return { ...item, owner: owner ? owner.nickname : "BOT", playerSessionId: owner?.sessionId || null, progress: 0, laneIndex, factor: 0.86 + Math.random() * 0.22, wobble: Math.random() * 7, finishTime: null }; });
  room.phase = "countdown"; room.race = { raceId: makeId(10), startedAt: now() + 3000, duration: 22000, lanes }; room.players.forEach((player) => { player.ready = false; }); broadcast(room); return null;
}

function updateRace(room) {
  if (!room.race) return;
  const race = room.race; const elapsed = now() - race.startedAt;
  if (room.phase === "countdown" && elapsed >= 0) { room.phase = "racing"; broadcast(room); }
  if (room.phase !== "racing") return;
  const t = clamp(elapsed / race.duration, 0, 1);
  race.lanes.forEach((lane) => { const wave = Math.sin(elapsed / 820 + lane.wobble) * 0.018; const surge = Math.sin(elapsed / 1700 + lane.laneIndex) > 0.73 ? 0.018 : 0; const setback = Math.sin(elapsed / 1250 + lane.wobble) < -0.94 ? 0.014 : 0; lane.progress = clamp(t * lane.factor + wave + surge - setback, 0, 0.94); if (lane.progress >= 0.935 && lane.finishTime === null) lane.finishTime = elapsed; });
  if (elapsed >= race.duration || race.lanes.every((lane) => lane.finishTime !== null)) { race.lanes.forEach((lane) => { if (lane.finishTime === null) lane.finishTime = race.duration + lane.laneIndex * 50; }); race.lanes.sort((a, b) => a.finishTime - b.finishTime); race.lanes.forEach((lane, index) => { lane.progress = 0.94 + Math.min(0.05, index * 0.01); lane.rank = index + 1; }); room.phase = "results"; const winner = race.lanes[0]; if (winner?.playerSessionId) { const player = getPlayer(room, winner.playerSessionId); if (player) room.wins[player.nickname] = (room.wins[player.nickname] || 0) + 1; } }
  broadcast(room);
}

setInterval(() => { for (const room of rooms.values()) { if (room.phase === "countdown" || room.phase === "racing") updateRace(room); if (now() - room.lastActivity > 60 * 60 * 1000) rooms.delete(room.code); } }, 250);

function subscribe(req, res, code, sessionId) {
  const room = getRoom(code); const player = getPlayer(room, sessionId);
  if (!room || !player) { sendError(res, 404, "Phòng không tồn tại hoặc phiên đã hết hạn"); return; }
  player.online = true; res.writeHead(200, { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache", connection: "keep-alive" }); res.write(`data: ${JSON.stringify(snapshot(room, sessionId))}\n\n`);
  const set = subscribers.get(room.code) || new Set(); const subscriber = { res, sessionId }; set.add(subscriber); subscribers.set(room.code, set);
  req.on("close", () => { set.delete(subscriber); if (![...set].some((item) => item.sessionId === sessionId)) player.online = false; if (room.hostSessionId === sessionId && !player.online) { const next = room.players.filter((item) => item.online).sort((a, b) => a.joinedAt - b.joinedAt)[0]; if (next) room.hostSessionId = next.sessionId; } broadcast(room); });
}

function serveStatic(req, res) {
  const pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname); const requested = pathname === "/" ? "/index.html" : pathname; const filePath = path.join(ROOT, requested);
  if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) { sendError(res, 404, "Không tìm thấy file"); return; }
  const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".md": "text/plain; charset=utf-8" }; res.writeHead(200, { "content-type": types[path.extname(filePath)] || "application/octet-stream", "cache-control": "no-store" }); fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url, `http://${req.headers.host}`); const parts = parsed.pathname.split("/").filter(Boolean);
  if (req.method === "GET" && parts[0] === "api" && parts[1] === "stream") { subscribe(req, res, parsed.searchParams.get("code"), parsed.searchParams.get("session")); return; }
  if (parts[0] === "api" && parts[1] === "rooms") {
    const code = parts[2]?.toUpperCase(); const action = parts[3]; const body = req.method === "POST" ? await readJson(req) : {};
    if (req.method === "POST" && !code) { const nickname = cleanName(body.nickname); if (nickname.length < 2) { sendError(res, 400, "Biệt danh cần từ 2–20 ký tự"); return; } const created = createRoom(nickname, body.maxPlayers); sendJson(res, 201, snapshot(created.room, created.sessionId)); return; }
    const room = getRoom(code); if (!room) { sendError(res, 404, "Phòng không tồn tại hoặc đã hết hạn"); return; }
    if (req.method === "GET" && !action) { const sessionId = parsed.searchParams.get("session"); if (!getPlayer(room, sessionId)) { sendError(res, 403, "Phiên chơi không còn trong phòng"); return; } sendJson(res, 200, snapshot(room, sessionId)); return; }
    if (req.method === "POST" && action === "join") { const nickname = cleanName(body.nickname); if (nickname.length < 2) { sendError(res, 400, "Biệt danh cần từ 2–20 ký tự"); return; } if (room.players.length >= room.maxPlayers && !getPlayer(room, body.sessionId)) { sendError(res, 409, `Phòng đã đủ ${room.maxPlayers} người chơi`); return; } const sessionId = body.sessionId || makeId(12); let player = getPlayer(room, sessionId); if (!player) { player = { sessionId, nickname, crab: null, ready: false, joinedAt: now(), online: true }; room.players.push(player); } else { player.nickname = nickname; player.online = true; } broadcast(room); sendJson(res, 200, snapshot(room, sessionId)); return; }
    const sessionId = body.sessionId || parsed.searchParams.get("session"); const player = getPlayer(room, sessionId); if (!player) { sendError(res, 403, "Phiên chơi không còn trong phòng"); return; } player.online = true;
    if (req.method === "POST" && action === "select") { if (room.phase !== "lobby") { sendError(res, 409, "Không thể đổi cua khi cuộc đua đang chạy"); return; } const selected = CRABS.slice(0, room.maxPlayers).find((item) => item.id === body.crab); if (!selected) { sendError(res, 400, "Cua không hợp lệ cho quy mô phòng này"); return; } if (room.players.some((item) => item.sessionId !== sessionId && item.crab === selected.id)) { sendError(res, 409, "Chú cua này đã có người chọn"); return; } player.crab = selected.id; player.ready = false; broadcast(room); sendJson(res, 200, snapshot(room, sessionId)); return; }
    if (req.method === "POST" && action === "ready") { if (room.phase !== "lobby" || !player.crab) { sendError(res, 409, "Hãy chọn cua trước khi sẵn sàng"); return; } player.ready = !player.ready; broadcast(room); sendJson(res, 200, snapshot(room, sessionId)); return; }
    if (req.method === "POST" && action === "start") { if (room.hostSessionId !== sessionId) { sendError(res, 403, "Chỉ host mới có thể bắt đầu"); return; } if (room.phase !== "lobby") { sendError(res, 409, "Phòng đang có cuộc đua"); return; } const error = startRace(room); if (error) { sendError(res, 409, error); return; } sendJson(res, 200, snapshot(room, sessionId)); return; }
    if (req.method === "POST" && action === "reset") { if (room.hostSessionId !== sessionId) { sendError(res, 403, "Chỉ host mới có thể đua lại"); return; } room.phase = "lobby"; room.race = null; room.players.forEach((item) => { item.ready = false; item.crab = null; }); broadcast(room); sendJson(res, 200, snapshot(room, sessionId)); return; }
  }
  serveStatic(req, res);
});

server.listen(PORT, "0.0.0.0", () => console.log(`Crab Race running at http://localhost:${PORT}`));
