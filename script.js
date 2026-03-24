const gameArea = document.getElementById("game-area");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");

const audio = new AudioContext();

function playSound(freq, duration, type = "sine") {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0.15;
    gain.gain.linearRampToValueAtTime(0, audio.currentTime + duration);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + duration);
}

let musicInterval = null;

function startMusic() {
    const melody = [392, 440, 494, 523, 587, 523, 494, 440, 392, 330, 349, 392, 440, 392, 349, 330];
    let i = 0;
    musicInterval = setInterval(() => {
        const note = melody[i % melody.length];

        const osc1 = audio.createOscillator();
        const gain1 = audio.createGain();
        osc1.type = "sine";
        osc1.frequency.value = note;
        gain1.gain.value = 0.03;
        gain1.gain.linearRampToValueAtTime(0, audio.currentTime + 0.4);
        osc1.connect(gain1).connect(audio.destination);
        osc1.start();
        osc1.stop(audio.currentTime + 0.4);

        if (i % 4 === 0) {
            const osc2 = audio.createOscillator();
            const gain2 = audio.createGain();
            osc2.type = "triangle";
            osc2.frequency.value = note / 2;
            gain2.gain.value = 0.02;
            gain2.gain.linearRampToValueAtTime(0, audio.currentTime + 0.8);
            osc2.connect(gain2).connect(audio.destination);
            osc2.start();
            osc2.stop(audio.currentTime + 0.8);
        }
        i++;
    }, 300);
}

function stopMusic() {
    clearInterval(musicInterval);
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
    playSound(300, 0.2); playSound(200, 0.3);
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
        if (type.points === 5) { playSound(800, 0.15); playSound(1200, 0.15); }
        else if (type.points < 0) playSound(200, 0.3, "sawtooth");
        else playSound(600, 0.1);

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
