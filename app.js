const ROOM_SIZES = [6, 8, 16, 32, 64, 100];
const CRAB_PRESETS = [
  { id: "rocket", name: "Rocket", color: "#ff6e5d", emoji: "🦀", personality: "Không biết sợ", number: 1 },
  { id: "bubbles", name: "Bubbles", color: "#65c7ff", emoji: "🦀", personality: "Lướt như gió", number: 2 },
  { id: "lucky", name: "Lucky", color: "#71d49b", emoji: "🦀", personality: "Vận đỏ hôm nay", number: 3 },
  { id: "goldie", name: "Goldie", color: "#f7c85c", emoji: "🦀", personality: "Tỏa sáng đúng lúc", number: 4 },
  { id: "sleepy", name: "Sleepy", color: "#b887ff", emoji: "🦀", personality: "Chậm mà chắc", number: 5 },
  { id: "chaos", name: "Chaos", color: "#ff995a", emoji: "🦀", personality: "Không đoán được", number: 6 },
];
const CRAB_COLORS = ["#65e0d1", "#ffb45c", "#ff7b87", "#8db8ff", "#c795ff", "#7de0a0", "#f3d36b", "#7ed7e8"];
const crabs = [...CRAB_PRESETS, ...Array.from({ length: 94 }, (_, index) => { const number = index + 7; return { id: `crab-${number}`, name: `Coral ${String(number).padStart(2, "0")}`, color: CRAB_COLORS[index % CRAB_COLORS.length], emoji: "🦀", personality: "Sẵn sàng bứt phá", number }; })];
const AVATAR_ASSETS = ["dlicom-pfp-blue.png", "dlicom-pfp-hero.png", "deapp-logo.png"];

const defaultState = { screen: "home", nickname: "", roomCode: "", sessionId: "", room: null, selectedCrab: null, ready: false, isHost: false };
let state = { ...defaultState, ...JSON.parse(localStorage.getItem("crab-race-state") || "{}") };
let language = localStorage.getItem("crab-race-language") || "vi";
let crabSearch = "";
let stream;
let roomSyncTimer;
let roomSyncInFlight = false;
let roomSyncGeneration = 0;
let roomSyncController;
let raceAnimationFrame;
let raceElements = new Map();
let raceTrack = { road: null, finishLine: null, crabWidth: 0, roadWidth: 0, travel: 0 };
let raceClockSecond = -1;
let raceCountdownSecond = -1;
let raceDom = { countdown: null, countdownNumber: null, time: null };
let toastTimer;
let audioContext;
let musicTimer;
let musicStep = 0;
let audioEnabled = localStorage.getItem("dlicom-audio") !== "off";
const app = document.querySelector("#app");

const englishReplacements = [
  ["DLICOM SOCIAL MODE", "DLICOM SOCIAL MODE"], ["DLICOM SOCIAL ARENA", "DLICOM SOCIAL ARENA"], ["Kết nối hội bạn.", "Connect your circle."], ["Chọn lane của bạn.", "Pick your lane."], ["Cùng chạy, cùng vui.", "Race together, have fun."], ["Top của room.", "Top of the room."], ["Tạo room Dlicom", "Create a Dlicom room"], ["Vào room", "Join a room"], ["Mở phòng →", "Open room →"], ["Tham gia", "Join"], ["Một mini-game cộng đồng cho phòng Dlicom. Mời hội bạn, chọn Dlicom và xem ai về nhất.", "A social mini-game for your Dlicom room. Invite friends, pick a Dlicom and see who wins."], ["Dán mã room để vào cùng hội bạn.", "Paste the room code to join your circle."], ["DLICOM RACE // LIVE", "DLICOM RACE // LIVE"], ["SOCIAL SPRINT", "SOCIAL SPRINT"], ["DLICOM ROOM · REALTIME", "DLICOM ROOM · REALTIME"], ["Chọn Dlicom cho room", "Choose a Dlicom for the room"], ["DLICOM SPRINT · LIVE", "DLICOM SPRINT · LIVE"], ["Cùng chạy, ", "Race together, "], ["Dlicom ơi!", "Dlicom, let's go!"], ["DLICOM ROOM · FINISH SYNCED", "DLICOM ROOM · FINISH SYNCED"], ["Top của room: ", "Room top finisher: "], ["race!", "race!"], ["ROOM CHAMPION", "ROOM CHAMPION"], ["Room finish order", "Room finish order"], ["Dlicom Race · quick rules", "Dlicom Race · quick rules"], ["DLICOM RACE là mini-game cộng đồng: chọn Dlicom, bật sẵn sàng và để room quyết định nhà vô địch.", "DLICOM RACE is a social mini-game: pick a Dlicom, get ready and let the room decide its champion."], ["Chọn Dlicom.", "Pick a Dlicom."], ["6–100 Dlicom", "6–100 Dlicom"], ["6–100 DLICOM / ROOM", "6–100 DLICOM / ROOM"], ["Tìm Dlicom theo tên", "Search Dlicom by name"], ["chưa chọn Dlicom", "no Dlicom yet"],
  ["MÔ PHỎNG LOCAL", "LOCAL DEMO"], ["Trợ giúp", "Help"], ["Chọn ngôn ngữ", "Choose language"], ["BÃI BIỂN ĐANG MỞ CỬA", "THE BEACH IS OPEN"], ["CRAB RACE", "DLICOM RACE"],
  ["Chọn cua.", "Pick a crab."], ["Vào làn.", "Take a lane."], ["Đua thôi.", "Let's race."], ["Một cuộc đua vui nhộn cho hội bạn. Không cần kỹ năng, chỉ cần một biệt danh và một chút may mắn.", "A playful race for your friends. No skill required — just a nickname and a little luck."],
  ["Tạo phòng mới", "Create a room"], ["Bạn làm host. Gửi mã phòng cho mọi người cùng vào.", "You are the host. Share the room code with everyone."], ["Biệt danh của bạn", "Your nickname"], ["Số người tối đa", "Player limit"], ["6–100 cua", "6–100 crabs"], ["Tìm cua theo tên", "Search crabs by name"], ["người", "players"], ["Mở đường đua →", "Open the track →"],
  ["Vào phòng", "Join a room"], ["Đã có mã? Nhập vào đây để tham gia.", "Have a code? Enter it to join."], ["Biệt danh", "Nickname"], ["MÃ PHÒNG", "ROOM CODE"], ["Vào", "Join"], ["6 cua", "6 crabs"], ["0 áp lực", "zero pressure"], ["ĐƯỜNG ĐUA HÔM NAY", "TODAY'S TRACK"], ["SẮP BẮT ĐẦU", "STARTING SOON"], ["Ai sẽ là vua bãi biển?", "Who will rule the beach?"], ["20–30 GIÂY / TRẬN", "20–30 SEC / RACE"],
  ["PHÒNG CHỜ · REALTIME", "LOBBY · REALTIME"], ["Chọn chiến mã.", "Pick your racer."], ["Sao chép", "Copy"], ["Chọn một chú cua", "Choose a crab"], ["mỗi cua chỉ có 1 chủ", "one owner per crab"], ["ĐANG CHỌN", "SELECTED"], ["ĐÃ CÓ CHỦ", "TAKEN"], ["CÒN TRỐNG", "AVAILABLE"], ["Trong phòng", "In the room"], ["online", "online"], ["HOST", "HOST"], ["NGƯỜI CHƠI", "PLAYER"], ["chưa chọn cua", "no crab yet"], ["SẴN SÀNG", "READY"], ["ĐANG CHỜ", "WAITING"], ["Tôi đã sẵn sàng", "I am ready"], ["Bắt đầu cuộc đua →", "Start the race →"], ["Chờ host bắt đầu", "Waiting for host"], ["Bạn là host · BOT sẽ lấp các làn còn trống", "You are the host · BOTS fill empty lanes"], ["Host sẽ bắt đầu khi mọi người sẵn sàng", "The host starts when everyone is ready"], ["Realtime:", "Realtime:"], ["lựa chọn, trạng thái sẵn sàng, đếm ngược và kết quả được đồng bộ từ server cho mọi thiết bị.", "choices, ready states, countdown and results sync from the server to every device."],
  ["ĐƯỜNG ĐUA ĐANG NÓNG · SERVER SYNC", "THE TRACK IS HOT · SERVER SYNC"], ["Chạy đi, ", "Run, "], ["cua ơi!", "little crabs!"], ["ĐỒNG HỒ PHÒNG", "ROOM CLOCK"], ["ĐÍCH", "FINISH"], ["trạng thái từ server", "server state"], ["sự kiện bất ngờ", "surprise events"],
  ["CỜ VỀ ĐÍCH ĐÃ HẠ · ĐỒNG BỘ XONG", "FINISH FLAG DOWN · SYNCED"], ["Một màn ", "What a "], ["kịch tính.", "finish."], ["VUA BÃI BIỂN", "BEACH CHAMPION"], ["Về nhất cho ", "Won for "], ["Thứ tự về đích", "Finish order"], ["Đổi cua", "Change crab"], ["Đua lại →", "Race again →"], ["Chờ host đua lại", "Waiting for host"], ["Thắng của ", "Wins for "], ["trong phòng", "in this room"],
  ["Luật chơi siêu ngắn", "Quick rules"], ["Chọn một chú cua, bật sẵn sàng rồi để các chú cua tự chạy. Các làn trống sẽ do BOT điều khiển. Trận đấu kết thúc sau khoảng 20–30 giây — cua về đích đầu tiên là người thắng.", "Pick a crab, get ready, and let the crabs run. Empty lanes are controlled by BOTS. The race ends in about 20–30 seconds — the first crab to finish wins."], ["Về trang đầu", "Back to home"],
  ["Chọn Dlicom.", "Pick a Dlicom."], ["Đua thôi.", "Let's race."], ["Mở một room riêng và gửi mã cho hội bạn cùng vào.", "Open a private room and share the code with your circle."], ["realtime · vui cùng room", "realtime · fun with your room"], ["LIVE RACE BOARD", "LIVE RACE BOARD"], ["Server synced", "Server synced"], ["Ai sẽ là room", "Who will be the room"], ["Trong phòng", "In the room"], ["HOST A ROOM", "HOST A ROOM"], ["JOIN THE RACE", "JOIN THE RACE"], ["Realtime đa thiết bị", "Realtime on every device"], ["6–100 người", "6–100 players"], ["Không cần cài app", "No app required"], ["Không biết sợ", "Fearless"], ["Lướt như gió", "Moves like the wind"], ["Vận đỏ hôm nay", "Lucky today"], ["Tỏa sáng đúng lúc", "Shines at the right moment"], ["Chậm mà chắc", "Slow and steady"], ["Không đoán được", "Impossible to predict"], ["Sẵn sàng bứt phá", "Ready to burst ahead"], ["Kết nối bằng một lượt đua.", "Connect through one race."], ["Biệt danh cần từ 2–20 ký tự", "Nickname must be 2–20 characters"], ["Nhập biệt danh và mã phòng hợp lệ nhé", "Enter a valid nickname and room code"], ["Đã sao chép link mời phòng", "Room invite link copied"], ["Có lỗi kết nối", "Connection error"], ["Phòng không tồn tại hoặc đã hết hạn", "Room does not exist or has expired"], ["Phiên chơi không còn trong phòng", "This session is no longer in the room"], ["Phòng đã đủ", "Room is full"], ["Chỉ host mới có thể bắt đầu", "Only the host can start"], ["Chỉ host mới có thể đua lại", "Only the host can replay"], ["Phòng đang có cuộc đua", "A race is already in progress"], ["Không thể đổi Dlicom khi cuộc đua đang chạy", "You cannot change Dlicom during a race"], ["Dlicom không hợp lệ cho quy mô phòng này", "This Dlicom is not available for this room size"], ["Dlicom này đã có người chọn", "This Dlicom is already taken"], ["Hãy chọn Dlicom trước khi sẵn sàng", "Pick a Dlicom before getting ready"],
];

const vietnameseReplacements = [
  ["DLICOM SOCIAL MODE", "CHẾ ĐỘ XÃ HỘI DLICOM"], ["DLICOM SOCIAL ARENA", "ĐẤU TRƯỜNG DLICOM"], ["DLICOM RACE // LIVE", "DLICOM RACE // TRỰC TIẾP"], ["LIVE RACE BOARD", "BẢNG ĐUA TRỰC TIẾP"], ["SOCIAL SPRINT", "ĐUA CÙNG HỘI BẠN"], ["HOST A ROOM", "TẠO PHÒNG"], ["JOIN THE RACE", "THAM GIA ĐUA"], ["Server synced", "Máy chủ đã đồng bộ"], ["6–100 DLICOM / ROOM", "6–100 DLICOM / PHÒNG"], ["Pick your lane. Make it count.", "Chọn làn của bạn. Hãy bứt phá."], ["CRAB RACE", "DLICOM RACE"], ["Dlicom racer", "Nhân vật Dlicom"], ["realtime", "trực tuyến"], ["Realtime", "Trực tuyến"], ["REALTIME", "TRỰC TUYẾN"], ["online", "đang kết nối"], ["HOST", "CHỦ PHÒNG"], ["Host", "Chủ phòng"], ["host", "chủ phòng"], ["PLAYER", "NGƯỜI CHƠI"], ["BOTS", "BOT"], ["START", "BẮT ĐẦU"], ["FINISH", "ĐÍCH"], ["LIVE", "TRỰC TIẾP"], ["SERVER", "MÁY CHỦ"], ["SYNC", "ĐỒNG BỘ"], ["Room", "Phòng"], ["ROOM", "PHÒNG"], ["room", "phòng"],
];

const exactEnglishReplacements = [
  ["Mở phòng riêng, chọn số người rồi gửi mã cho hội bạn.", "Open a private room, choose the player limit and share the code with your friends."],
  ["Đã có mã phòng? Nhập vào để chạy cùng hội bạn.", "Have a room code? Enter it to race with your friends."],
  ["MÃ ROOM", "ROOM CODE"], ["Mã room", "Room code"],
];

function translateValue(value) {
  const replacements = language === "vi" ? vietnameseReplacements : [...englishReplacements, ...exactEnglishReplacements];
  return [...replacements].sort((a, b) => b[0].length - a[0].length).reduce((result, [from, to]) => result.split(from).join(to), value.replace(/Phòng đã đủ (\d+) người chơi/g, "Room is full: $1 players"));
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

const dlicomCopyReplacements = [
  ["cua", "Dlicom"], ["Cua", "Dlicom"], ["CUA", "DLICOM"],
];

function applyDlicomCopy() {
  const walker = document.createTreeWalker(document.querySelector("#app"), NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach((node) => { if (node.parentElement?.closest(".player-name, .winner-owner, .result-owner")) return; node.nodeValue = dlicomCopyReplacements.reduce((result, [from, to]) => result.split(from).join(to), node.nodeValue); });
}

function updateChromeLanguage() {
  const connection = document.querySelector(".connection-pill");
  const help = document.querySelector("[data-action='help']");
  const languageControl = document.querySelector(".language-control");
  const brand = document.querySelector(".brand");
  document.title = language === "en" ? "Dlicom Race — Race with friends" : "Dlicom Race — Đua cùng hội bạn";
  if (connection) connection.innerHTML = `<i></i> ${language === "en" ? "DLICOM SOCIAL MODE" : "CHẾ ĐỘ XÃ HỘI DLICOM"}`;
  if (help) help.setAttribute("aria-label", language === "en" ? "Help" : "Trợ giúp");
  if (languageControl) languageControl.setAttribute("aria-label", language === "en" ? "Choose language" : "Chọn ngôn ngữ");
  if (brand) brand.setAttribute("aria-label", language === "en" ? "Back to home" : "Về trang chủ");
  updateAudioControl();
}

function crab(id) { return crabs.find((item) => item.id === id) || crabs[0]; }
function crabImage(name = "crab") { return `<img src="crab.png" alt="${escapeHtml(name)}" />`; }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char])); }
function initials(name) { return (name || "B").trim().slice(0, 1).toUpperCase(); }
function me() { return state.room?.players.find((player) => player.sessionId === state.sessionId); }
function persist() { localStorage.setItem("crab-race-state", JSON.stringify({ ...state, room: null })); }
function playerAvatar(player, index = 0) { const asset = AVATAR_ASSETS[index % AVATAR_ASSETS.length]; const rotation = (index % 6) * 34; return `<span class="player-avatar" style="--avatar-rotation:${rotation}deg"><img src="${asset}" alt="" loading="lazy" /><span>${escapeHtml(initials(player?.nickname))}</span></span>`; }

function getAudioContext() {
  if (!audioEnabled) return null;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  audioContext ||= new AudioContext();
  if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
  return audioContext;
}

function playTone(frequency, duration = .08, type = "sine", volume = .025, delay = 0) {
  const context = getAudioContext();
  if (!context) return;
  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + .015);
  gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + .02);
}

function playMusicBeat() {
  if (!audioEnabled) return;
  const notes = [196, 247, 294, 247, 220, 277, 330, 277];
  playTone(notes[musicStep % notes.length], .34, "triangle", .009);
  musicStep += 1;
  musicTimer = window.setTimeout(playMusicBeat, 620);
}

function startMusic() { if (audioEnabled && !musicTimer && getAudioContext()) playMusicBeat(); }
function stopMusic() { if (musicTimer) window.clearTimeout(musicTimer); musicTimer = null; }
function playRaceSound() { playTone(392, .12, "sine", .04); playTone(523, .16, "sine", .04, .1); playTone(659, .26, "sine", .045, .22); }
function playWinSound() { playTone(523, .12, "sine", .04); playTone(659, .12, "sine", .04, .1); playTone(784, .3, "sine", .05, .2); }
function updateAudioControl() { const button = document.querySelector("[data-action='audio-toggle']"); if (!button) return; button.textContent = audioEnabled ? "🔊" : "🔇"; button.setAttribute("aria-label", audioEnabled ? (language === "en" ? "Mute sound" : "Tắt âm thanh") : (language === "en" ? "Turn on sound" : "Bật âm thanh")); button.setAttribute("aria-pressed", String(audioEnabled)); }

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
  if (previousScreen !== state.screen && state.screen === "race") playRaceSound();
  if (previousScreen !== state.screen && state.screen === "results") playWinSound();
  if (forceRender || previousScreen !== state.screen) render(); else if (state.screen === "race") updateRaceVisuals();
}

function disconnectRoomSync() {
  roomSyncGeneration += 1;
  if (stream) stream.close();
  stream = null;
  clearInterval(roomSyncTimer);
  roomSyncTimer = null;
  roomSyncController?.abort();
  roomSyncController = null;
  roomSyncInFlight = false;
}

function connectStream() {
  disconnectRoomSync();
  const code = state.roomCode;
  const session = state.sessionId;
  const generation = roomSyncGeneration;
  if (location.protocol === "https:") {
    roomSyncController = new AbortController();
    const sync = async () => { if (roomSyncInFlight || generation !== roomSyncGeneration || state.roomCode !== code || state.sessionId !== session) return; roomSyncInFlight = true; try { const payload = await api(`/api/rooms/${encodeURIComponent(code)}?session=${encodeURIComponent(session)}`, { signal: roomSyncController.signal }); if (generation === roomSyncGeneration && state.roomCode === code && state.sessionId === session) applySnapshot(payload); } catch { /* retry on the next poll */ } finally { roomSyncInFlight = false; } };
    sync();
    roomSyncTimer = setInterval(sync, 1000);
    return;
  }
  stream = new EventSource(`/api/stream?code=${encodeURIComponent(code)}&session=${encodeURIComponent(session)}`);
  stream.onmessage = (event) => { if (generation !== roomSyncGeneration) return; try { applySnapshot(JSON.parse(event.data)); } catch { /* ignore malformed event */ } };
}

function render() {
  if (raceAnimationFrame) cancelAnimationFrame(raceAnimationFrame);
  raceAnimationFrame = null;
  if (state.screen !== "race") {
    raceElements.clear();
    raceTrack = { road: null, finishLine: null, crabWidth: 0, roadWidth: 0, travel: 0 };
    raceDom = { countdown: null, countdownNumber: null, time: null };
  }
  if (state.screen === "home") renderHome();
  if (state.screen === "lobby") renderLobby();
  if (state.screen === "race") { renderRace(); animateRace(); }
  if (state.screen === "results") renderResults();
  translateDocument();
  applyDlicomCopy();
  updateChromeLanguage();
}

function renderHome() {
  app.innerHTML = `<section class="home-grid"><div class="home-copy"><div class="eyebrow">DLICOM SOCIAL ARENA</div><h1>Kết nối hội bạn.<br />Chọn cua.<br /><em>Đua thôi.</em></h1><p class="lede">Một mini-game cộng đồng cho phòng Dlicom. Mời hội bạn, chọn Dlicom và xem ai về nhất.</p><div class="home-actions"><form class="action-card primary" id="create-form"><span class="card-kicker">HOST A ROOM</span><h2>Tạo room Dlicom</h2><p>Mở phòng riêng, chọn số người rồi gửi mã cho hội bạn.</p><div class="create-fields"><input class="field" id="create-name" maxlength="20" placeholder="Biệt danh của bạn" autocomplete="nickname" /><label class="capacity-field"><span>Số người tối đa</span><select class="field" id="player-count" aria-label="Số người tối đa">${ROOM_SIZES.map((count) => `<option value="${count}" ${count === 6 ? "selected" : ""}>${count} người</option>`).join("")}</select></label></div><button class="primary-button full" type="submit">Mở phòng →</button></form><form class="action-card join-card" id="join-form"><div><span class="card-kicker">JOIN THE RACE</span><h2>Vào room</h2><p>Đã có mã phòng? Nhập vào để chạy cùng hội bạn.</p></div><div class="join-row"><input class="field" id="join-name" maxlength="20" placeholder="Biệt danh" autocomplete="nickname" /><input class="field" id="join-code" maxlength="6" placeholder="MÃ ROOM" aria-label="Mã room" /><button class="secondary-button" type="submit">Tham gia</button></div></form></div><div class="home-proof"><span><i>✓</i> Realtime đa thiết bị</span><span><i>✓</i> 6–100 người</span><span><i>✓</i> Không cần cài app</span></div></div>${renderTrackPreview()}</section>`;
  document.querySelector("#create-form").addEventListener("submit", createRoom);
  document.querySelector("#join-form").addEventListener("submit", joinRoom);
  const roomFromLink = location.hash.match(/^#room\/([a-z0-9]{4,6})$/i);
  if (roomFromLink) document.querySelector("#join-code").value = roomFromLink[1].toUpperCase();
}

function renderTrackPreview() { return `<div class="track-preview"><div class="preview-orbit"></div><div class="preview-top"><div class="preview-title"><span class="preview-kicker">LIVE RACE BOARD</span><h2>DLICOM RACE <span>// LIVE</span></h2></div><span class="live-tag"><i></i> SOCIAL SPRINT</span></div><div class="preview-character"><img src="dlicom-pfp-hero.png" alt="Dlicom racer" loading="lazy" /></div><div class="race-track">${crabs.slice(0, 3).map((item, index) => `<div class="mini-lane" style="--lane-color:${item.color}"><div class="mini-name"><span class="mini-rank">#${String(item.number).padStart(2, "0")}</span><strong>${item.name}</strong></div><div class="mini-line"><span class="track-start">START</span><span class="mini-crab" style="--pos:${20 + index * 17}%">${crabImage(item.name)}</span><span class="track-finish">FINISH</span></div><span class="mini-number">${String(index + 1).padStart(2, "0")}</span></div>`).join("")}</div><div class="preview-stats"><span><i></i> Server synced</span><span>6–100 DLICOM / ROOM</span></div><span class="sand-dot"></span><div class="preview-caption"><strong>Ai sẽ là room<br />champion?</strong><span>Pick your lane. Make it count.</span></div></div>`; }
function validName(name) { if (name.length < 2 || name.length > 20) { toast("Biệt danh cần từ 2–20 ký tự"); return false; } return true; }

async function createRoom(event) {
  event.preventDefault(); const nickname = document.querySelector("#create-name").value.trim(); if (!validName(nickname)) return;
  const maxPlayers = Number(document.querySelector("#player-count").value || 6);
  try { const payload = await api("/api/rooms", { method: "POST", body: { nickname, maxPlayers } }); state.nickname = nickname; applySnapshot(payload, true); connectStream(); } catch (error) { toast(error.message); }
}

async function joinRoom(event) {
  event.preventDefault(); const nickname = document.querySelector("#join-name").value.trim(); const code = document.querySelector("#join-code").value.trim().toUpperCase();
  if (!validName(nickname) || code.length < 4) { toast("Nhập biệt danh và mã phòng hợp lệ nhé"); return; }
  try { disconnectRoomSync(); const payload = await api(`/api/rooms/${encodeURIComponent(code)}/join`, { method: "POST", body: { nickname } }); state.nickname = nickname; applySnapshot(payload, true); connectStream(); } catch (error) { toast(error.message); }
}

function renderLobby() {
  const players = state.room?.players || [];
  const availableCrabs = crabs.slice(0, state.room.maxPlayers);
  const taken = new Set(players.filter((player) => player.sessionId !== state.sessionId).map((player) => player.crab).filter(Boolean));
  app.innerHTML = `<section><div class="screen-header"><div><div class="eyebrow">PHÒNG CHỜ · REALTIME</div><h1>Chọn chiến mã.</h1></div><div class="room-badge"><span>MÃ PHÒNG</span><strong>${escapeHtml(state.roomCode)}</strong><button class="copy-button" data-action="copy">Sao chép</button></div></div><div class="lobby-grid"><section class="panel panel-pad"><div class="panel-title"><h2>Chọn một chú cua</h2><span>${players.length} / ${state.room.maxPlayers} người</span></div><div class="crab-picker-bar"><span>6–100 cua</span><input class="field crab-search" id="crab-search" value="${escapeHtml(crabSearch)}" placeholder="Tìm cua theo tên" aria-label="Tìm cua theo tên" /></div><div class="crab-grid">${availableCrabs.map((item) => { const selected = state.selectedCrab === item.id; const takenByOther = taken.has(item.id); return `<button class="crab-card ${selected ? "selected" : ""} ${takenByOther ? "taken" : ""}" style="--crab-color:${item.color}" data-crab="${item.id}" data-crab-name="${item.name.toLowerCase()}" ${takenByOther ? "disabled" : ""}><div class="crab-avatar"><span class="crab-emoji">${crabImage(item.name)}</span><span class="crab-number">#${String(item.number).padStart(2, "0")}</span><span class="crab-status">${selected ? "ĐANG CHỌN" : takenByOther ? "ĐÃ CÓ CHỦ" : "CÒN TRỐNG"}</span></div><strong class="crab-name">${item.name}</strong><span class="crab-personality">${item.personality}</span><i class="checkmark">✓</i></button>`; }).join("")}</div></section><aside class="lobby-side"><section class="panel panel-pad"><div class="panel-title"><h2>Trong phòng</h2><span>${players.filter((player) => player.online).length} online</span></div><div class="player-list">${players.map((player, index) => `<div class="player-row ${player.sessionId === state.room.hostSessionId ? "host" : ""}"><div class="player-info">${playerAvatar(player, index)}<div><span class="player-name">${escapeHtml(player.nickname)}</span><span class="player-role">${player.sessionId === state.room.hostSessionId ? "HOST" : "NGƯỜI CHƠI"} · ${player.crab ? `#${String(crab(player.crab).number).padStart(2, "0")} ${crab(player.crab).name}` : "chưa chọn cua"}</span></div></div><span class="ready-state ${player.ready ? "" : "waiting"}">${player.ready ? "SẴN SÀNG" : "ĐANG CHỜ"}</span></div>`).join("")}</div></section><section class="panel panel-pad"><div class="ready-toggle"><span>Tôi đã sẵn sàng</span><button class="toggle ${state.ready ? "on" : ""}" data-action="ready" aria-label="${state.ready ? "Bỏ sẵn sàng" : "Sẵn sàng"}"></button></div><button class="primary-button full" data-action="start" ${state.isHost && state.ready ? "" : "disabled"}>${state.isHost ? "Bắt đầu cuộc đua →" : "Chờ host bắt đầu"}</button><p class="host-note" style="margin-top: 11px">${state.isHost ? "Bạn là host · BOT sẽ lấp các làn còn trống" : "Host sẽ bắt đầu khi mọi người sẵn sàng"}</p></section><div class="rules"><p><strong>Realtime:</strong> lựa chọn, trạng thái sẵn sàng, đếm ngược và kết quả được đồng bộ từ server cho mọi thiết bị.</p></div></aside></div></section>`;
  document.querySelectorAll("[data-crab]").forEach((button) => button.addEventListener("click", () => selectCrab(button.dataset.crab)));
  document.querySelector("#crab-search").addEventListener("input", (event) => { crabSearch = event.target.value.toLowerCase().trim(); document.querySelectorAll("[data-crab-name]").forEach((button) => { button.hidden = crabSearch && !button.dataset.crabName.includes(crabSearch); }); });
  document.querySelector("[data-action='ready']").addEventListener("click", toggleReady); document.querySelector("[data-action='start']").addEventListener("click", startRace); document.querySelector("[data-action='copy']").addEventListener("click", copyRoom);
}

async function selectCrab(id) { try { applySnapshot(await api(`/api/rooms/${state.roomCode}/select`, { method: "POST", body: { sessionId: state.sessionId, crab: id } }), true); } catch (error) { toast(error.message); } }
async function toggleReady() { try { applySnapshot(await api(`/api/rooms/${state.roomCode}/ready`, { method: "POST", body: { sessionId: state.sessionId } }), true); } catch (error) { toast(error.message); } }
async function startRace() { try { applySnapshot(await api(`/api/rooms/${state.roomCode}/start`, { method: "POST", body: { sessionId: state.sessionId } }), true); } catch (error) { toast(error.message); } }
async function resetRoom() { try { applySnapshot(await api(`/api/rooms/${state.roomCode}/reset`, { method: "POST", body: { sessionId: state.sessionId } }), true); } catch (error) { toast(error.message); } }
async function copyRoom() { const share = `${location.origin}${location.pathname}#room/${state.roomCode}`; try { await navigator.clipboard.writeText(share); } catch { /* clipboard may be blocked */ } toast("Đã sao chép link mời phòng"); }

function renderRace() { const lanes = state.room?.race?.lanes || []; app.innerHTML = `<section><div class="race-header"><div><div class="eyebrow">ĐƯỜNG ĐUA ĐANG NÓNG · SERVER SYNC</div><h1>Chạy đi, <em>cua ơi!</em></h1></div><div class="race-status"><span class="connection-pill"><i></i> ĐỒNG HỒ PHÒNG</span><b id="race-time">00:00</b></div></div><div class="race-panel"><div class="start-line"></div><div class="finish-line"></div><div class="finish-label">ĐÍCH</div><div class="race-lanes" id="race-lanes">${lanes.map((lane) => `<div class="race-lane" data-lane="${lane.id}"><div class="lane-meta"><span class="lane-number" style="color:${lane.color}">#${String(lane.number).padStart(2, "0")}</span><strong style="color:${lane.color}">${lane.name}</strong><span>${escapeHtml(lane.owner)}</span></div><div class="lane-road" style="--crab-color:${lane.color}"><span class="race-crab" id="crab-${lane.id}">${crabImage(lane.name)}</span><span class="lane-event" id="event-${lane.id}"></span></div></div>`).join("")}</div><div class="race-legend"><span class="legend-item"><i class="legend-dot"></i> trạng thái từ server</span><span class="legend-item"><i class="legend-dot event"></i> sự kiện bất ngờ</span></div><div class="countdown" id="countdown"><div class="countdown-number" id="countdown-number">3</div></div></div></section>`; raceElements = new Map(lanes.map((lane) => { const element = document.querySelector(`#crab-${lane.id}`); return [lane.id, { element, road: element?.parentElement }]; })); const firstLane = raceElements.values().next().value; raceTrack = { road: firstLane?.road || null, finishLine: document.querySelector(".finish-line"), crabWidth: firstLane?.element?.offsetWidth || 0, roadWidth: 0, travel: 0 }; raceDom = { countdown: document.querySelector("#countdown"), countdownNumber: document.querySelector("#countdown-number"), time: document.querySelector("#race-time") }; raceClockSecond = -1; raceCountdownSecond = -1; }

function animateRace() { updateRaceVisuals(); if (state.screen === "race") raceAnimationFrame = requestAnimationFrame(animateRace); }

function updateRaceVisuals() { const race = state.room?.race; if (!race) return; const { countdown, countdownNumber, time } = raceDom; const elapsed = Date.now() - race.startedAt; const seconds = Math.min(22, Math.max(0, Math.floor(elapsed / 1000))); if (time && seconds !== raceClockSecond) { time.textContent = `00:${String(seconds).padStart(2, "0")}`; raceClockSecond = seconds; } const isCountdown = state.room.phase === "countdown"; const countdownDisplay = isCountdown ? "grid" : "none"; if (countdown && countdown.style.display !== countdownDisplay) countdown.style.display = countdownDisplay; if (countdownNumber && isCountdown) { const number = Math.max(1, Math.ceil((race.startedAt - Date.now()) / 1000)); if (number !== raceCountdownSecond) { countdownNumber.textContent = number; raceCountdownSecond = number; } } if (raceTrack.road && raceTrack.road.clientWidth !== raceTrack.roadWidth) { raceTrack.roadWidth = raceTrack.road.clientWidth; const roadBounds = raceTrack.road.getBoundingClientRect(); const finishBounds = raceTrack.finishLine?.getBoundingClientRect(); const finishInset = finishBounds ? Math.max(0, roadBounds.right - finishBounds.left) : raceTrack.crabWidth / 2; raceTrack.travel = Math.max(0, (roadBounds.width - finishInset - raceTrack.crabWidth / 2) / .94); } race.lanes.forEach((lane) => { const element = raceElements.get(lane.id)?.element; if (!element) return; const t = Math.max(0, Math.min(1, elapsed / race.duration)); const wave = Number.isFinite(lane.wobble) ? Math.sin(elapsed / 820 + lane.wobble) * 0.018 : 0; const surge = Number.isFinite(lane.laneIndex) && Math.sin(elapsed / 1700 + lane.laneIndex) > 0.73 ? 0.018 : 0; const setback = Number.isFinite(lane.wobble) && Math.sin(elapsed / 1250 + lane.wobble) < -0.94 ? 0.014 : 0; const progress = isCountdown ? 0 : Number.isFinite(lane.factor) ? Math.max(0, Math.min(.94, t * lane.factor + wave + surge - setback)) : Math.max(0, Math.min(.94, Number(lane.progress) || 0)); element.style.transform = `translate3d(${progress * raceTrack.travel}px, 0, 0) translateX(-50%)`; }); }

function renderResults() { const lanes = state.room?.race?.lanes || []; const winner = lanes[0] || crab(state.selectedCrab); const wins = state.room?.wins?.[state.nickname] || 0; app.innerHTML = `<section><div class="screen-header"><div><div class="eyebrow">CỜ VỀ ĐÍCH ĐÃ HẠ · ĐỒNG BỘ XONG</div><h1>Một màn <em>kịch tính.</em></h1></div><div class="room-badge"><span>MÃ PHÒNG</span><strong>${escapeHtml(state.roomCode)}</strong><button class="copy-button" data-action="copy">Sao chép</button></div></div><div class="results-layout"><div class="winner-card" style="--crab-color:${winner.color}"><span class="winner-label">🏆 VUA BÃI BIỂN</span><span class="winner-emoji">${crabImage(winner.name)}</span><span class="winner-crab-number">#${String(winner.number).padStart(2, "0")}</span><h2>${winner.name}</h2><p class="winner-owner">Về nhất cho ${escapeHtml(winner.owner)}</p></div><div class="results-side"><section class="panel results-table"><div class="panel-title"><h2>Thứ tự về đích</h2><span>${lanes.length} cua</span></div>${lanes.map((lane, index) => `<div class="result-row"><span class="rank">${String(index + 1).padStart(2, "0")}</span><div><div class="result-name"><span class="result-mini-crab" style="--crab-color:${lane.color}">${crabImage(lane.name)}</span><strong>#${String(lane.number).padStart(2, "0")} ${lane.name}</strong></div><div class="result-owner">${escapeHtml(lane.owner)}</div></div><span class="finish-time">00:${String(Math.floor((lane.finishTime || 22000) / 1000)).padStart(2, "0")}</span></div>`).join("")}</section><div class="wins-card"><span>Thắng của ${escapeHtml(state.nickname)} trong phòng</span><strong>${wins}</strong></div><div class="results-actions"><button class="secondary-button" data-action="lobby">Đổi cua</button>${state.isHost ? `<button class="primary-button" data-action="replay">Đua lại →</button>` : `<button class="secondary-button" disabled>Chờ host đua lại</button>`}</div></div></div></section>`; document.querySelector("[data-action='copy']").addEventListener("click", copyRoom); document.querySelector("[data-action='lobby']").addEventListener("click", resetRoom); document.querySelector("[data-action='replay']")?.addEventListener("click", resetRoom); }

function toast(message) { const element = document.querySelector("#toast"); element.textContent = translateValue(message); element.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => element.classList.remove("show"), 2600); }
document.addEventListener("pointerdown", () => { if (audioEnabled) startMusic(); }, { passive: true });
document.addEventListener("click", (event) => { const action = event.target.closest("[data-action]")?.dataset.action; if (action === "audio-toggle") { audioEnabled = !audioEnabled; localStorage.setItem("dlicom-audio", audioEnabled ? "on" : "off"); if (audioEnabled) { startMusic(); playTone(660, .08, "sine", .03); } else stopMusic(); updateAudioControl(); } if (action === "home") { disconnectRoomSync(); state = { ...defaultState }; persist(); render(); } if (action === "help") { app.innerHTML = `<div class="help-popover"><div class="eyebrow">CRAB RACE</div><h2>Luật chơi siêu ngắn</h2><p>Chọn một chú cua, bật sẵn sàng rồi để các chú cua tự chạy. Các làn trống sẽ do BOT điều khiển. Trận đấu kết thúc sau khoảng 20–30 giây — cua về đích đầu tiên là người thắng.</p><button class="secondary-button" data-action="home">Về trang đầu</button></div>`; translateDocument(); applyDlicomCopy(); updateChromeLanguage(); } });

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
