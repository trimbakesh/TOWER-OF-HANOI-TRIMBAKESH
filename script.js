// ==================== Background Animation ====================
const canvas = document.getElementById("bgCanvas");
const ctx = canvas.getContext("2d");
let w, h;
function resizeCanvas() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let points = [];
for (let i = 0; i < 150; i++) {
    points.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2,
        a: Math.random() * 360,
    });
}
function drawBG() {
    ctx.clearRect(0, 0, w, h);
    for (let p of points) {
        p.a += 0.5;
        const glow = Math.abs(Math.sin((p.a * Math.PI) / 180));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 200, 255, ${glow})`;
        ctx.fill();
    }
    requestAnimationFrame(drawBG);
}
drawBG();

// ==================== Screens ====================
const intro = document.getElementById("intro-screen");
const rules = document.getElementById("rules-screen");
const game = document.getElementById("game-screen");
const win = document.getElementById("win-screen");
const info = document.getElementById("info-screen");
const infoContent = document.getElementById("info-content");

document.getElementById("play-now").onclick = () => {
    intro.classList.add("hidden");
    rules.classList.remove("hidden");
};

document.getElementById("start-game").onclick = () => {
    rules.classList.add("hidden");
    game.classList.remove("hidden");
    initGame();
};

// ==================== Game Setup ====================
let towers = [[], [], []];
let numDisks = 3;
let moveCount = 0;
let selectedDisk = null;

const gameArea = document.getElementById("game-area");
const moveCounter = document.getElementById("move-counter");
const slider = document.getElementById("disk-slider");
const hintBtn = document.getElementById("hint-btn");
const optimalBtn = document.getElementById("optimal-btn");

slider.addEventListener("input", () => {
    numDisks = parseInt(slider.value);
    initGame();
});

function initGame() {
    towers = [[], [], []];
    moveCount = 0;
    moveCounter.textContent = "Moves: 0";
    gameArea.querySelectorAll(".disk").forEach((d) => d.remove());
    selectedDisk = null;

    for (let i = numDisks; i > 0; i--) {
        const disk = document.createElement("div");
        disk.className = "disk";
        disk.textContent = String.fromCharCode(64 + i);
        const width = 60 + i * 25;
        disk.style.width = width + "px";
        disk.style.left = (75 - width / 2) + "px";
        disk.style.bottom = (numDisks - i) * 35 + "px";
        disk.style.background = `hsl(${i * 40}, 80%, 50%)`;
        disk.setAttribute("data-size", i);
        disk.addEventListener("click", selectDisk);
        towers[0].push(disk);
        document.getElementById("tower-A").appendChild(disk);
    }
}

function selectDisk(e) {
    const clickedDisk = e.target;
    const towerIndex = towers.findIndex((t) => t.includes(clickedDisk));
    const tower = towers[towerIndex];
    const topDisk = tower[tower.length - 1];
    if (clickedDisk !== topDisk) return; // only top disk can be selected

    if (!selectedDisk) {
        selectedDisk = clickedDisk;
        clickedDisk.style.outline = "3px solid yellow";
    }
}

document.querySelectorAll(".tower").forEach((towerDiv, index) => {
    towerDiv.addEventListener("click", () => {
        if (selectedDisk) {
            const fromIndex = towers.findIndex((t) => t.includes(selectedDisk));
            const fromTower = towers[fromIndex];
            const toTower = towers[index];
            const moving = parseInt(selectedDisk.dataset.size);
            const topTo = toTower.length
                ? parseInt(toTower[toTower.length - 1].dataset.size)
                : Infinity;
            if (moving < topTo) {
                fromTower.pop();
                toTower.push(selectedDisk);
                moveCount++;
                moveCounter.textContent = `Moves: ${moveCount}`;
                selectedDisk.style.outline = "none";
                selectedDisk = null;
                arrangeTower(index);
                arrangeTower(fromIndex);
                if (towers[2].length === numDisks) showWin();
            } else {
                gsap.fromTo(
                    gameArea,
                    { backgroundColor: "rgba(0, 255, 247, 0.3)" },
                    { backgroundColor: "transparent", duration: 0 }
                );
            }
        }
    });
});

function arrangeTower(index) {
    const tower = towers[index];
    const towerDiv = document.querySelectorAll(".tower")[index];
    tower.forEach((disk, i) => {
        disk.style.bottom = i * 35 + "px";
        towerDiv.appendChild(disk);
    });
}

function showWin() {
    game.classList.add("hidden");
    win.classList.remove("hidden");
}

// ==================== Hint System ====================
hintBtn.addEventListener("click", () => {
    const moves = [];
    generateOptimalMoves(numDisks, 0, 2, 1, moves);
    const nextMove = moves[moveCount];
    if (nextMove) {
        const [disk, from, to] = nextMove;
        alert(`💡 Hint: Move Disk ${disk} from Tower ${String.fromCharCode(65 + from)} ➜ Tower ${String.fromCharCode(65 + to)}`);
    } else {
        alert("You have completed all moves!");
    }
});

// ==================== Optimal Moves ====================
optimalBtn.addEventListener("click", () => {
    const choice = confirm("Press OK for Visual Mode, Cancel for Notation List");
    const moves = [];
    generateOptimalMoves(numDisks, 0, 2, 1, moves);
    if (choice) {
        playVisualMoves(moves);
    } else {
        let list = "🧠 Optimal Moves:\n\n";
        moves.forEach(([disk, from, to], i) => {
            list += `${i + 1}. Move Disk ${disk} from ${String.fromCharCode(65 + from)} ➜ ${String.fromCharCode(65 + to)}\n`;
        });
        alert(list);
    }
});

function generateOptimalMoves(n, from, to, aux, moves) {
    if (n === 0) return;
    generateOptimalMoves(n - 1, from, aux, to, moves);
    moves.push([n, from, to]);
    generateOptimalMoves(n - 1, aux, to, from, moves);
}

async function playVisualMoves(moves) {
    alert("🎬 Showing Visual Moves! Watch carefully...");
    initGame();
    for (const [disk, from, to] of moves) {
        await new Promise((r) => setTimeout(r, 800));
        const diskElement = towers[from].pop();
        towers[to].push(diskElement);
        arrangeTower(from);
        arrangeTower(to);
    }
    showWin();
}

// ==================== Info Section ====================
document.getElementById("math-btn").onclick = () => {
    win.classList.add("hidden");
    info.classList.remove("hidden");
    infoContent.innerHTML = `
  <h2 class="interactive-font">📐 Mathematical Logic</h2>
  <ul>
    <li>Minimum moves: <b>2ⁿ - 1</b></li>
    <li>Uses <b>recursion</b> and <b>binary pattern</b></li>
    <li>Each disk follows a fixed pattern</li>
    <li>Represents <b>algorithmic design</b></li>
    <li>Helps understand <b>divide & conquer</b> approach</li>
  </ul>`;
};

document.getElementById("history-btn").onclick = () => {
    win.classList.add("hidden");
    info.classList.remove("hidden");
    infoContent.innerHTML = `
  <h2 class="interactive-font">📜 History</h2>
  <ul>
    <li>Invented by <b>Édouard Lucas</b> in 1883</li>
    <li>Based on a mythic temple legend</li>
    <li>Used for teaching <b>recursion</b> and <b>logic</b></li>
    <li>Represents endless patterns of problem solving</li>
    <li>Classic puzzle loved by mathematicians</li>
  </ul>`;
};

document.getElementById("back-to-game").onclick = () => {
    info.classList.add("hidden");
    win.classList.remove("hidden");
};
