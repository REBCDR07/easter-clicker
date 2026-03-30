const gameArea = document.getElementById("game-area");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");

const audio = new AudioContext();

function playNote(freq, duration, type = "sine", vol = 0.12, delay = 0) {
    const t = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.linearRampToValueAtTime(0, t + duration);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + duration);
}

function playNoise(duration, vol = 0.15, delay = 0) {
    const t = audio.currentTime + delay;
    const buf = audio.createBuffer(1, audio.sampleRate * duration, audio.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = audio.createBufferSource();
    src.buffer = buf;
    const gain = audio.createGain();
    const filter = audio.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 3000;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.linearRampToValueAtTime(0, t + duration);
    src.connect(filter).connect(gain).connect(audio.destination);
    src.start(t);
}

function playCollect() {
    playNoise(0.08, 0.18);
    playNote(800, 0.06, "sawtooth", 0.1);
    playNote(1200, 0.04, "sawtooth", 0.06, 0.02);
}

function playGolden() {
    playNoise(0.12, 0.2);
    playNote(600, 0.08, "sawtooth", 0.12);
    playNote(900, 0.06, "sawtooth", 0.1, 0.03);
    playNote(1400, 0.1, "sawtooth", 0.08, 0.06);
    playNote(200, 0.3, "triangle", 0.06, 0.1);
}

function playMalus() {
    playNote(150, 0.15, "sawtooth", 0.15);
    playNote(80, 0.4, "square", 0.12, 0.05);
    playNoise(0.1, 0.1, 0.02);
}

function playGameOver() {
    playNote(250, 0.3, "sawtooth", 0.12);
    playNote(180, 0.4, "sawtooth", 0.1, 0.2);
    playNote(100, 0.6, "square", 0.08, 0.5);
    playNoise(0.15, 0.08);
}

const music = new Audio("assets/heroic-age.mp3");
music.loop = true;
music.volume = 0.15;

function startMusic() {
    music.currentTime = 3;
    music.play();
}

function stopMusic() {
    music.pause();
}

let score = 0;
let timeLeft = 0;
let difficulty = "";
let timerInterval, spawnInterval;

const types = [
    { img: "assets/egg.png", points: 1 },
    { img: "assets/egg.png", points: 1 },
    { img: "assets/egg.png", points: 1 },
    { img: "assets/golden-egg.png", points: 5 },
    { img: "assets/poule.png", points: -2 }
];

const settings = {
    easy: { duration: 60, spawnRate: 1200 },
    medium: { duration: 45, spawnRate: 800 },
    hard: { duration: 30, spawnRate: 500 }
};

function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

function startGame(key) {
    score = 0;
    difficulty = key;
    timeLeft = settings[key].duration;
    scoreDisplay.textContent = score;
    timerDisplay.textContent = timeLeft;
    gameArea.innerHTML = "";
    showScreen("screen-game");

    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        if (timeLeft <= 0) endGame();
    }, 1000);

    spawnInterval = setInterval(spawnObject, settings[key].spawnRate);
    gameArea.addEventListener("click", onMissClick);
    startMusic();
}

function onMissClick(e) {
    if (e.target === gameArea) endGame();
}

function endGame() {
    clearInterval(timerInterval);
    clearInterval(spawnInterval);
    gameArea.removeEventListener("click", onMissClick);
    gameArea.innerHTML = "";
    document.getElementById("final-score").textContent = score;

    const best = localStorage.getItem("best_" + difficulty) || 0;
    document.getElementById("new-record").style.display = score > best ? "block" : "none";
    if (score > best) localStorage.setItem("best_" + difficulty, score);

    stopMusic();
    playGameOver();
    loadHighScores();
    showScreen("screen-gameover");
}

function spawnParticles(cx, cy, points) {
    const count = points === 5 ? 20 : points < 0 ? 8 : 12;
    const color = points === 5 ? "#ffd700" : points < 0 ? "#ff3333" : "#d4943a";
    for (let i = 0; i < count; i++) {
        const p = document.createElement("div");
        p.className = "particle";
        p.style.left = cx + "px";
        p.style.top = cy + "px";
        p.style.background = color;
        const angle = (Math.PI * 2 * i) / count;
        const dist = 60 + Math.random() * 100;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        p.style.setProperty("--dx", dx + "px");
        p.style.setProperty("--dy", dy + "px");
        if (points === 5) p.style.boxShadow = "0 0 8px " + color;
        document.body.appendChild(p);
        p.addEventListener("animationend", () => p.remove());
    }
}

function showFloatingScore(cx, cy, points) {
    const txt = document.createElement("div");
    txt.className = "floating-score";
    txt.textContent = points > 0 ? "+" + points : points;
    if (points === 5) txt.classList.add("golden");
    if (points < 0) txt.classList.add("negative");
    txt.style.left = cx + "px";
    txt.style.top = cy + "px";
    document.body.appendChild(txt);
    txt.addEventListener("animationend", () => txt.remove());
}

function flashRed() {
    const overlay = document.createElement("div");
    overlay.className = "red-flash";
    gameArea.appendChild(overlay);
    overlay.addEventListener("animationend", () => overlay.remove());
}

function spawnObject() {
    const type = types[Math.floor(Math.random() * types.length)];
    const el = document.createElement("img");
    el.classList.add("game-object");
    el.src = type.img;
    el.style.top = Math.random() * 60 + 10 + "%";
    el.style.left = Math.random() * 60 + 15 + "%";
    el.addEventListener("click", (e) => {
        e.stopPropagation();
        score = Math.max(0, score + type.points);
        scoreDisplay.textContent = score;
        if (type.points === 5) playGolden();
        else if (type.points < 0) playMalus();
        else playCollect();

        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        spawnParticles(cx, cy, type.points);
        showFloatingScore(cx, cy, type.points);
        if (type.points < 0) flashRed();
        el.remove();
    });
    gameArea.appendChild(el);
    setTimeout(() => {
        if (el.parentNode) {
            el.remove();
            if (type.points > 0) endGame();
        }
    }, 2000);
}

function loadHighScores() {
    ["easy", "medium", "hard"].forEach(k => {
        document.getElementById("high-" + k).textContent = localStorage.getItem("best_" + k) || 0;
    });
}

document.querySelectorAll(".menu-buttons button").forEach(btn => {
    btn.addEventListener("click", () => startGame(btn.dataset.difficulty));
});
document.getElementById("btn-replay").addEventListener("click", () => startGame(difficulty));
document.getElementById("btn-menu").addEventListener("click", () => showScreen("screen-menu"));

loadHighScores();
