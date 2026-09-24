const ROOM_SIZES = [6, 8, 16, 32, 64, 100];
const CRAB_PRESETS = [
  { id: "rocket", name: "Rocket", color: "#ff6e5d", emoji: "🦀", personality: "Không biết sợ" },
  { id: "bubbles", name: "Bubbles", color: "#65c7ff", emoji: "🦀", personality: "Lướt như gió" },
  { id: "lucky", name: "Lucky", color: "#71d49b", emoji: "🦀", personality: "Vận đỏ hôm nay" },
  { id: "goldie", name: "Goldie", color: "#f7c85c", emoji: "🦀", personality: "Tỏa sáng đúng lúc" },
  { id: "sleepy", name: "Sleepy", color: "#b887ff", emoji: "🦀", personality: "Chậm mà chắc" },
  { id: "chaos", name: "Chaos", color: "#ff995a", emoji: "🦀", personality: "Không đoán được" },
];
const CRAB_COLORS = ["#65e0d1", "#ffb45c", "#ff7b87", "#8db8ff", "#c795ff", "#7de0a0", "#f3d36b", "#7ed7e8"];
const crabs = [...CRAB_PRESETS, ...Array.from({ length: 94 }, (_, index) => { const number = index + 7; return { id: `crab-${number}`, name: `Coral ${String(number).padStart(2, "0")}`, color: CRAB_COLORS[index % CRAB_COLORS.length], emoji: "🦀", personality: "Sẵn sàng bứt phá" }; })];

const defaultState = { screen: "home", nickname: "", roomCode: "", sessionId: "", room: null, selectedCrab: null, ready: false, isHost: false };
let state = { ...defaultState, ...JSON.parse(localStorage.getItem("crab-race-state") || "{}") };
let language = localStorage.getItem("crab-race-language") || "vi";
let crabSearch = "";
let stream;
let raceViewTimer;
let toastTimer;
const app = document.querySelector("#app");

const englishReplacements = [
  ["MÔ PHỎNG LOCAL", "LOCAL DEMO"], ["Trợ giúp", "Help"], ["Chọn ngôn ngữ", "Choose language"], ["BÃI BIỂN ĐANG MỞ CỬA", "THE BEACH IS OPEN"],
  ["Chọn cua.", "Pick a crab."], ["Vào làn.", "Take a lane."], ["Đua thôi.", "Let's race."], ["Một cuộc đua vui nhộn cho hội bạn. Không cần kỹ năng, chỉ cần một biệt danh và một chút may mắn.", "A playful race for your friends. No skill required — just a nickname and a little luck."],
  ["Tạo phòng mới", "Create a room"], ["Bạn làm host. Gửi mã phòng cho mọi người cùng vào.", "You are the host. Share the room code with everyone."], ["Biệt danh của bạn", "Your nickname"], ["Số người tối đa", "Player limit"], ["6–100 cua", "6–100 crabs"], ["Tìm cua theo tên", "Search crabs by name"], ["người", "players"], ["Mở đường đua →", "Open the track →"],
  ["Vào phòng", "Join a room"], ["Đã có mã? Nhập vào đây để tham gia.", "Have a code? Enter it to join."], ["Biệt danh", "Nickname"], ["MÃ PHÒNG", "ROOM CODE"], ["Vào", "Join"], ["6 cua", "6 crabs"], ["0 áp lực", "zero pressure"], ["ĐƯỜNG ĐUA HÔM NAY", "TODAY'S TRACK"], ["SẮP BẮT ĐẦU", "STARTING SOON"], ["Ai sẽ là vua bãi biển?", "Who will rule the beach?"], ["20–30 GIÂY / TRẬN", "20–30 SEC / RACE"],
  ["PHÒNG CHỜ · REALTIME", "LOBBY · REALTIME"], ["Chọn chiến mã.", "Pick your racer."], ["Sao chép", "Copy"], ["Chọn một chú cua", "Choose a crab"], ["mỗi cua chỉ có 1 chủ", "one owner per crab"], ["ĐANG CHỌN", "SELECTED"], ["ĐÃ CÓ CHỦ", "TAKEN"], ["CÒN TRỐNG", "AVAILABLE"], ["Trong phòng", "In the room"], ["online", "online"], ["HOST", "HOST"], ["NGƯỜI CHƠI", "PLAYER"], ["chưa chọn cua", "no crab yet"], ["SẴN SÀNG", "READY"], ["ĐANG CHỜ", "WAITING"], ["Tôi đã sẵn sàng", "I am ready"], ["Bắt đầu cuộc đua →", "Start the race →"], ["Chờ host bắt đầu", "Waiting for host"], ["Bạn là host · BOT sẽ lấp các làn còn trống", "You are the host · BOTS fill empty lanes"], ["Host sẽ bắt đầu khi mọi người sẵn sàng", "The host starts when everyone is ready"], ["Realtime:", "Realtime:"], ["lựa chọn, trạng thái sẵn sàng, đếm ngược và kết quả được đồng bộ từ server cho mọi thiết bị.", "choices, ready states, countdown and results sync from the server to every device."],
  ["ĐƯỜNG ĐUA ĐANG NÓNG · SERVER SYNC", "THE TRACK IS HOT · SERVER SYNC"], ["Chạy đi, ", "Run, "], ["cua ơi!", "little crabs!"], ["ĐỒNG HỒ PHÒNG", "ROOM CLOCK"], ["ĐÍCH", "FINISH"], ["trạng thái từ server", "server state"], ["sự kiện bất ngờ", "surprise events"],
  ["CỜ VỀ ĐÍCH ĐÃ HẠ · ĐỒNG BỘ XONG", "FINISH FLAG DOWN · SYNCED"], ["Một màn ", "What a "], ["kịch tính.", "finish."], ["VUA BÃI BIỂN", "BEACH CHAMPION"], ["Về nhất cho ", "Won for "], ["Thứ tự về đích", "Finish order"], ["Đổi cua", "Change crab"], ["Đua lại →", "Race again →"], ["Chờ host đua lại", "Waiting for host"], ["Thắng của ", "Wins for "], ["trong phòng", "in this room"],
  ["Luật chơi siêu ngắn", "Quick rules"], ["Chọn một chú cua, bật sẵn sàng rồi để các chú cua tự chạy. Các làn trống sẽ do BOT điều khiển. Trận đấu kết thúc sau khoảng 20–30 giây — cua về đích đầu tiên là người thắng.", "Pick a crab, get ready, and let the crabs run. Empty lanes are controlled by BOTS. The race ends in about 20–30 seconds — the first crab to finish wins."], ["Về trang đầu", "Back to home"],
];

function translateValue(value) {
  if (language === "vi") return value;
  return englishReplacements.reduce((result, [from, to]) => result.split(from).join(to), value);
}

function translateDocument() {
  document.querySelectorAll("#app *").forEach((element) => {
    for (const attribute of ["placeholder", "aria-label"]) if (element.hasAttribute(attribute)) element.setAttribute(attribute, translateValue(element.getAttribute(attribute)));
  });
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach((node) => { if (node.parentElement?.id !== "language-select") node.nodeValue = translateValue(node.nodeValue); });
}

function updateChromeLanguage() {
  const connection = document.querySelector(".connection-pill");
  const help = document.querySelector(".icon-button");
  const languageControl = document.querySelector(".language-control");
  if (connection) connection.innerHTML = `<i></i> ${language === "en" ? "LOCAL DEMO" : "MÔ PHỎNG LOCAL"}`;
  if (help) help.setAttribute("aria-label", language === "en" ? "Help" : "Trợ giúp");
  if (languageControl) languageControl.setAttribute("aria-label", language === "en" ? "Choose language" : "Chọn ngôn ngữ");
}

function crab(id) { return crabs.find((item) => item.id === id) || crabs[0]; }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char])); }
function initials(name) { return (name || "B").trim().slice(0, 1).toUpperCase(); }
function me() { return state.room?.players.find((player) => player.sessionId === state.sessionId); }
function persist() { localStorage.setItem("crab-race-state", JSON.stringify({ ...state, room: null })); }

async function api(path, options = {}) {
  const response = await fetch(path, { headers: { "content-type": "application/json" }, ...options, body: options.body ? JSON.stringify(options.body) : undefined });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Có lỗi kết nối");
  return payload;
}

function applySnapshot(payload, forceRender = false) {
  if (!payload?.room) return;
  const previousScreen = state.screen;
  state.room = payload.room; state.sessionId = payload.sessionId || state.sessionId; state.roomCode = payload.room.code;
  state.selectedCrab = payload.me?.crab || null; state.ready = Boolean(payload.me?.ready); state.isHost = Boolean(payload.me?.isHost);
  state.screen = payload.room.phase === "results" ? "results" : payload.room.phase === "countdown" || payload.room.phase === "racing" ? "race" : "lobby";
  persist();
  if (forceRender || previousScreen !== state.screen) render(); else if (state.screen === "race") updateRaceVisuals();
}

function connectStream() {
  if (stream) stream.close();
  stream = new EventSource(`/api/stream?code=${encodeURIComponent(state.roomCode)}&session=${encodeURIComponent(state.sessionId)}`);
  stream.onmessage = (event) => { try { applySnapshot(JSON.parse(event.data)); } catch { /* ignore malformed event */ } };
}

function render() {
  clearInterval(raceViewTimer);
  if (state.screen === "home") renderHome();
  if (state.screen === "lobby") renderLobby();
  if (state.screen === "race") { renderRace(); raceViewTimer = setInterval(updateRaceVisuals, 250); }
  if (state.screen === "results") renderResults();
  translateDocument();
  updateChromeLanguage();
}

function renderHome() {
  app.innerHTML = `<section class="home-grid"><div class="home-copy"><div class="eyebrow">BÃI BIỂN ĐANG MỞ CỬA</div><h1>Chọn cua.<br />Vào làn.<br /><em>Đua thôi.</em></h1><p class="lede">Một cuộc đua vui nhộn cho hội bạn. Không cần kỹ năng, chỉ cần một biệt danh và một chút may mắn.</p><div class="home-actions"><form class="action-card primary" id="create-form"><h2>Tạo phòng mới</h2><p>Bạn làm host. Gửi mã phòng cho mọi người cùng vào.</p><input class="field" id="create-name" maxlength="20" placeholder="Biệt danh của bạn" autocomplete="nickname" /><label class="capacity-field"><span>Số người tối đa</span><select class="field" id="player-count" aria-label="Số người tối đa">${ROOM_SIZES.map((count) => `<option value="${count}" ${count === 6 ? "selected" : ""}>${count} người</option>`).join("")}</select></label><button class="primary-button full" type="submit" style="margin-top: 9px">Mở đường đua →</button></form><form class="action-card" id="join-form"><h2>Vào phòng</h2><p>Đã có mã? Nhập vào đây để tham gia.</p><input class="field" id="join-name" maxlength="20" placeholder="Biệt danh" autocomplete="nickname" /><div class="join-row" style="margin-top: 9px"><input class="field" id="join-code" maxlength="6" placeholder="MÃ PHÒNG" aria-label="Mã phòng" /><button class="secondary-button" type="submit">Vào</button></div></form></div><p class="microcopy"><strong>6–100 cua</strong> · realtime · 0 áp lực</p></div>${renderTrackPreview()}</section>`;
  document.querySelector("#create-form").addEventListener("submit", createRoom);
  document.querySelector("#join-form").addEventListener("submit", joinRoom);
  const roomFromLink = location.hash.match(/^#room\/([a-z0-9]{4,6})$/i);
  if (roomFromLink) document.querySelector("#join-code").value = roomFromLink[1].toUpperCase();
}

function renderTrackPreview() { return `<div class="track-preview"><div class="preview-top"><h2>ĐƯỜNG ĐUA HÔM NAY</h2><span class="live-tag">● REALTIME</span></div><div class="race-track">${crabs.slice(0, 6).map((item, index) => `<div class="mini-lane"><span class="mini-name">${item.name}</span><div class="mini-line"><span class="mini-crab" style="--pos:${18 + index * 11}%">🦀</span></div><span class="mini-number">0${index + 1}</span></div>`).join("")}</div><span class="sand-dot"></span><div class="preview-caption"><strong>Ai sẽ là vua bãi biển?</strong><span>6–100 CUA / TRẬN</span></div></div>`; }
function validName(name) { if (name.length < 2 || name.length > 20) { toast("Biệt danh cần từ 2–20 ký tự"); return false; } return true; }

async function createRoom(event) {
  event.preventDefault(); const nickname = document.querySelector("#create-name").value.trim(); if (!validName(nickname)) return;
  const maxPlayers = Number(document.querySelector("#player-count").value || 6);
  try { const payload = await api("/api/rooms", { method: "POST", body: { nickname, maxPlayers } }); state.nickname = nickname; applySnapshot(payload, true); connectStream(); } catch (error) { toast(error.message); }
}

async function joinRoom(event) {
  event.preventDefault(); const nickname = document.querySelector("#join-name").value.trim(); const code = document.querySelector("#join-code").value.trim().toUpperCase();
  if (!validName(nickname) || code.length < 4) { toast("Nhập biệt danh và mã phòng hợp lệ nhé"); return; }
  try { const payload = await api(`/api/rooms/${encodeURIComponent(code)}/join`, { method: "POST", body: { nickname, sessionId: state.sessionId || undefined } }); state.nickname = nickname; applySnapshot(payload, true); connectStream(); } catch (error) { toast(error.message); }
}

function renderLobby() {
  const players = state.room?.players || [];
  const availableCrabs = crabs.slice(0, state.room.maxPlayers);
  const taken = new Set(players.filter((player) => player.sessionId !== state.sessionId).map((player) => player.crab).filter(Boolean));
  app.innerHTML = `<section><div class="screen-header"><div><div class="eyebrow">PHÒNG CHỜ · REALTIME</div><h1>Chọn chiến mã.</h1></div><div class="room-badge"><span>MÃ PHÒNG</span><strong>${escapeHtml(state.roomCode)}</strong><button class="copy-button" data-action="copy">Sao chép</button></div></div><div class="lobby-grid"><section class="panel panel-pad"><div class="panel-title"><h2>Chọn một chú cua</h2><span>${players.length} / ${state.room.maxPlayers} người</span></div><div class="crab-picker-bar"><span>6–100 cua</span><input class="field crab-search" id="crab-search" value="${escapeHtml(crabSearch)}" placeholder="Tìm cua theo tên" aria-label="Tìm cua theo tên" /></div><div class="crab-grid">${availableCrabs.map((item) => { const selected = state.selectedCrab === item.id; const takenByOther = taken.has(item.id); return `<button class="crab-card ${selected ? "selected" : ""} ${takenByOther ? "taken" : ""}" style="--crab-color:${item.color}" data-crab="${item.id}" data-crab-name="${item.name.toLowerCase()}" ${takenByOther ? "disabled" : ""}><div class="crab-avatar"><span class="crab-emoji">${item.emoji}</span><span class="crab-status">${selected ? "ĐANG CHỌN" : takenByOther ? "ĐÃ CÓ CHỦ" : "CÒN TRỐNG"}</span></div><strong class="crab-name">${item.name}</strong><span class="crab-personality">${item.personality}</span><i class="checkmark">✓</i></button>`; }).join("")}</div></section><aside class="lobby-side"><section class="panel panel-pad"><div class="panel-title"><h2>Trong phòng</h2><span>${players.filter((player) => player.online).length} online</span></div><div class="player-list">${players.map((player) => `<div class="player-row ${player.sessionId === state.room.hostSessionId ? "host" : ""}"><div class="player-info"><span class="player-avatar">${escapeHtml(initials(player.nickname))}</span><div><span class="player-name">${escapeHtml(player.nickname)}</span><span class="player-role">${player.sessionId === state.room.hostSessionId ? "HOST" : "NGƯỜI CHƠI"} · ${player.crab ? crab(player.crab).name : "chưa chọn cua"}</span></div></div><span class="ready-state ${player.ready ? "" : "waiting"}">${player.ready ? "SẴN SÀNG" : "ĐANG CHỜ"}</span></div>`).join("")}</div></section><section class="panel panel-pad"><div class="ready-toggle"><span>Tôi đã sẵn sàng</span><button class="toggle ${state.ready ? "on" : ""}" data-action="ready" aria-label="${state.ready ? "Bỏ sẵn sàng" : "Sẵn sàng"}"></button></div><button class="primary-button full" data-action="start" ${state.isHost && state.ready ? "" : "disabled"}>${state.isHost ? "Bắt đầu cuộc đua →" : "Chờ host bắt đầu"}</button><p class="host-note" style="margin-top: 11px">${state.isHost ? "Bạn là host · BOT sẽ lấp các làn còn trống" : "Host sẽ bắt đầu khi mọi người sẵn sàng"}</p></section><div class="rules"><p><strong>Realtime:</strong> lựa chọn, trạng thái sẵn sàng, đếm ngược và kết quả được đồng bộ từ server cho mọi thiết bị.</p></div></aside></div></section>`;
  document.querySelectorAll("[data-crab]").forEach((button) => button.addEventListener("click", () => selectCrab(button.dataset.crab)));
  document.querySelector("#crab-search").addEventListener("input", (event) => { crabSearch = event.target.value.toLowerCase().trim(); document.querySelectorAll("[data-crab-name]").forEach((button) => { button.hidden = crabSearch && !button.dataset.crabName.includes(crabSearch); }); });
  document.querySelector("[data-action='ready']").addEventListener("click", toggleReady); document.querySelector("[data-action='start']").addEventListener("click", startRace); document.querySelector("[data-action='copy']").addEventListener("click", copyRoom);
}

async function selectCrab(id) { try { applySnapshot(await api(`/api/rooms/${state.roomCode}/select`, { method: "POST", body: { sessionId: state.sessionId, crab: id } }), true); } catch (error) { toast(error.message); } }
async function toggleReady() { try { applySnapshot(await api(`/api/rooms/${state.roomCode}/ready`, { method: "POST", body: { sessionId: state.sessionId } }), true); } catch (error) { toast(error.message); } }
async function startRace() { try { applySnapshot(await api(`/api/rooms/${state.roomCode}/start`, { method: "POST", body: { sessionId: state.sessionId } }), true); } catch (error) { toast(error.message); } }
async function resetRoom() { try { applySnapshot(await api(`/api/rooms/${state.roomCode}/reset`, { method: "POST", body: { sessionId: state.sessionId } }), true); } catch (error) { toast(error.message); } }
async function copyRoom() { const share = `${location.origin}${location.pathname}#room/${state.roomCode}`; try { await navigator.clipboard.writeText(share); } catch { /* clipboard may be blocked */ } toast("Đã sao chép link mời phòng"); }

function renderRace() { const lanes = state.room?.race?.lanes || []; app.innerHTML = `<section><div class="race-header"><div><div class="eyebrow">ĐƯỜNG ĐUA ĐANG NÓNG · SERVER SYNC</div><h1>Chạy đi, <em>cua ơi!</em></h1></div><div class="race-status"><span class="connection-pill"><i></i> ĐỒNG HỒ PHÒNG</span><b id="race-time">00:00</b></div></div><div class="race-panel"><div class="start-line"></div><div class="finish-line"></div><div class="finish-label">ĐÍCH</div><div class="race-lanes" id="race-lanes">${lanes.map((lane) => `<div class="race-lane" data-lane="${lane.id}"><div class="lane-meta"><strong style="color:${lane.color}">${lane.name}</strong><span>${escapeHtml(lane.owner)}</span></div><div class="lane-road"><span class="race-crab" id="crab-${lane.id}">🦀</span><span class="lane-event" id="event-${lane.id}"></span></div></div>`).join("")}</div><div class="race-legend"><span class="legend-item"><i class="legend-dot"></i> trạng thái từ server</span><span class="legend-item"><i class="legend-dot event"></i> sự kiện bất ngờ</span></div><div class="countdown" id="countdown"><div class="countdown-number" id="countdown-number">3</div></div></div></section>`; updateRaceVisuals(); }

function updateRaceVisuals() { const race = state.room?.race; if (!race) return; const countdown = document.querySelector("#countdown"); const elapsed = Math.max(0, Date.now() - race.startedAt); const seconds = Math.min(22, Math.floor(elapsed / 1000)); const time = document.querySelector("#race-time"); if (time) time.textContent = `00:${String(seconds).padStart(2, "0")}`; if (countdown) { countdown.style.display = state.room.phase === "countdown" ? "grid" : "none"; const number = document.querySelector("#countdown-number"); if (number && state.room.phase === "countdown") number.textContent = Math.max(1, Math.ceil((race.startedAt - Date.now()) / 1000)); } race.lanes.forEach((lane) => { const element = document.querySelector(`#crab-${lane.id}`); if (element) element.style.left = `${lane.progress * 100}%`; }); }

function renderResults() { const lanes = state.room?.race?.lanes || []; const winner = lanes[0] || crab(state.selectedCrab); const wins = state.room?.wins?.[state.nickname] || 0; app.innerHTML = `<section><div class="screen-header"><div><div class="eyebrow">CỜ VỀ ĐÍCH ĐÃ HẠ · ĐỒNG BỘ XONG</div><h1>Một màn <em>kịch tính.</em></h1></div><div class="room-badge"><span>MÃ PHÒNG</span><strong>${escapeHtml(state.roomCode)}</strong><button class="copy-button" data-action="copy">Sao chép</button></div></div><div class="results-layout"><div class="winner-card"><span class="winner-label">🏆 VUA BÃI BIỂN</span><span class="winner-emoji">🦀</span><h2>${winner.name}</h2><p class="winner-owner">Về nhất cho ${escapeHtml(winner.owner)}</p></div><div class="results-side"><section class="panel results-table"><div class="panel-title"><h2>Thứ tự về đích</h2><span>${lanes.length} cua</span></div>${lanes.map((lane, index) => `<div class="result-row"><span class="rank">${String(index + 1).padStart(2, "0")}</span><div><div class="result-name"><span class="result-mini-crab">🦀</span><strong>${lane.name}</strong></div><div class="result-owner">${escapeHtml(lane.owner)}</div></div><span class="finish-time">00:${String(Math.floor((lane.finishTime || 22000) / 1000)).padStart(2, "0")}</span></div>`).join("")}</section><div class="wins-card"><span>Thắng của ${escapeHtml(state.nickname)} trong phòng</span><strong>${wins}</strong></div><div class="results-actions"><button class="secondary-button" data-action="lobby">Đổi cua</button>${state.isHost ? `<button class="primary-button" data-action="replay">Đua lại →</button>` : `<button class="secondary-button" disabled>Chờ host đua lại</button>`}</div></div></div></section>`; document.querySelector("[data-action='copy']").addEventListener("click", copyRoom); document.querySelector("[data-action='lobby']").addEventListener("click", resetRoom); document.querySelector("[data-action='replay']")?.addEventListener("click", resetRoom); }

function toast(message) { const element = document.querySelector("#toast"); element.textContent = message; element.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => element.classList.remove("show"), 2600); }
document.addEventListener("click", (event) => { const action = event.target.closest("[data-action]")?.dataset.action; if (action === "home") { if (stream) stream.close(); state = { ...defaultState }; persist(); render(); } if (action === "help") { app.innerHTML = `<div class="help-popover"><div class="eyebrow">CRAB RACE</div><h2>Luật chơi siêu ngắn</h2><p>Chọn một chú cua, bật sẵn sàng rồi để các chú cua tự chạy. Các làn trống sẽ do BOT điều khiển. Trận đấu kết thúc sau khoảng 20–30 giây — cua về đích đầu tiên là người thắng.</p><button class="secondary-button" data-action="home">Về trang đầu</button></div>`; translateDocument(); } });

const languageSelect = document.querySelector("#language-select");
languageSelect.value = language;
languageSelect.addEventListener("change", () => { language = languageSelect.value; localStorage.setItem("crab-race-language", language); render(); });

async function bootstrap() {
  if (state.roomCode && state.sessionId) {
    try { applySnapshot(await api(`/api/rooms/${encodeURIComponent(state.roomCode)}?session=${encodeURIComponent(state.sessionId)}`), true); connectStream(); return; } catch { state = { ...defaultState }; persist(); }
  }
  render();
}
bootstrap();
