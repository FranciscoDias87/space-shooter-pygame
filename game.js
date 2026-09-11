const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const startButton = document.getElementById("startButton");

const W = canvas.width;
const H = canvas.height;

let state = "menu";
let score = 0;
let lives = 3;
let lastTime = 0;
let shootCooldown = 0;
let enemyTimer = 0;
let difficultyTimer = 0;
let difficulty = 1;
let particles = [];

const keys = {
  left: false,
  right: false,
  shoot: false,
};

const player = {
  x: W / 2 - 24,
  y: H - 92,
  w: 48,
  h: 54,
  speed: 310,
};

let bullets = [];
let enemies = [];

const stars = Array.from({ length: 90 }, () => ({
  x: Math.random() * W,
  y: Math.random() * H,
  r: Math.random() * 1.8 + 0.4,
  speed: Math.random() * 28 + 16,
  alpha: Math.random() * 0.7 + 0.2,
}));

function resetGame() {
  score = 0;
  lives = 3;
  difficulty = 1;
  enemyTimer = 0;
  difficultyTimer = 0;
  shootCooldown = 0;
  bullets = [];
  enemies = [];
  particles = [];
  player.x = W / 2 - player.w / 2;
  state = "playing";
  hideOverlay();
  updateHud();
}

function startGame() {
  resetGame();
}

function gameOver() {
  state = "gameover";
  showOverlay(
    "FIM DE JOGO",
    `Você fez ${score} ponto${score === 1 ? "" : "s"}. Que tal tentar outra vez?`,
    "JOGAR NOVAMENTE"
  );
}

function pauseGame() {
  if (state === "playing") {
    state = "paused";
    showOverlay(
      "JOGO PAUSADO",
      "Pressione P ou clique no botão para continuar.",
      "CONTINUAR"
    );
  } else if (state === "paused") {
    state = "playing";
    hideOverlay();
  }
}

function showOverlay(title, text, buttonLabel) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  startButton.textContent = buttonLabel;
  overlay.classList.add("visible");
}

function hideOverlay() {
  overlay.classList.remove("visible");
}

function updateHud() {
  scoreEl.textContent = score;
  livesEl.textContent = Array.from({ length: 3 }, (_, i) => i < lives ? "❤" : "♡").join(" ");
}

function spawnEnemy() {
  const size = Math.random() * 12 + 34;
  const speed = 88 + Math.random() * 45 + difficulty * 10;

  enemies.push({
    x: Math.random() * (W - size),
    y: -size,
    w: size,
    h: size,
    speed,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: Math.random() * 1.6 + 0.8,
  });
}

function shoot() {
  if (shootCooldown > 0 || state !== "playing") return;

  bullets.push({
    x: player.x + player.w / 2 - 3,
    y: player.y - 12,
    w: 6,
    h: 18,
    speed: 510,
  });

  shootCooldown = 0.22;
}

function rectsCollide(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function createExplosion(x, y, color = "#ffcf5a", amount = 16) {
  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 120 + 35;

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: Math.random() * 0.45 + 0.3,
      maxLife: 0.75,
      size: Math.random() * 3.5 + 1.5,
      color,
    });
  }
}

function update(dt) {
  for (const star of stars) {
    star.y += star.speed * dt;
    if (star.y > H) {
      star.y = -3;
      star.x = Math.random() * W;
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.life -= dt;

    if (p.life <= 0) particles.splice(i, 1);
  }

  if (state !== "playing") return;

  shootCooldown = Math.max(0, shootCooldown - dt);
  enemyTimer -= dt;
  difficultyTimer += dt;

  if (difficultyTimer >= 12) {
    difficulty++;
    difficultyTimer = 0;
  }

  if (keys.left) player.x -= player.speed * dt;
  if (keys.right) player.x += player.speed * dt;

  player.x = Math.max(10, Math.min(W - player.w - 10, player.x));

  if (keys.shoot) shoot();

  if (enemyTimer <= 0) {
    spawnEnemy();
    enemyTimer = Math.max(0.42, 1.05 - difficulty * 0.055);
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].y -= bullets[i].speed * dt;
    if (bullets[i].y + bullets[i].h < 0) {
      bullets.splice(i, 1);
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    enemy.y += enemy.speed * dt;
    enemy.wobble += enemy.wobbleSpeed * dt;
    enemy.x += Math.sin(enemy.wobble) * 12 * dt;

    if (enemy.y > H + enemy.h) {
      enemies.splice(i, 1);
      lives--;
      createExplosion(W / 2, H - 20, "#ff5f78", 8);
      updateHud();

      if (lives <= 0) {
        gameOver();
        return;
      }
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];

    if (rectsCollide(player, enemy)) {
      createExplosion(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#ff5f78", 22);
      enemies.splice(i, 1);
      lives--;
      updateHud();

      if (lives <= 0) {
        gameOver();
        return;
      }

      continue;
    }

    for (let j = bullets.length - 1; j >= 0; j--) {
      if (rectsCollide(enemy, bullets[j])) {
        createExplosion(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        score++;
        updateHud();
        break;
      }
    }
  }
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, "#05081a");
  gradient.addColorStop(0.55, "#09091d");
  gradient.addColorStop(1, "#14071f");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = "#5c2cff";
  ctx.beginPath();
  ctx.arc(60, 160, 95, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#00b7ff";
  ctx.beginPath();
  ctx.arc(W - 35, 330, 78, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  for (const star of stars) {
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function drawPlayer() {
  const cx = player.x + player.w / 2;
  const y = player.y;

  ctx.save();
  ctx.shadowBlur = 22;
  ctx.shadowColor = "#a86cff";

  const gradient = ctx.createLinearGradient(player.x, y, player.x + player.w, y + player.h);
  gradient.addColorStop(0, "#65ddff");
  gradient.addColorStop(0.5, "#cab5ff");
  gradient.addColorStop(1, "#8a43ff");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(cx, y);
  ctx.lineTo(player.x + player.w, y + player.h);
  ctx.lineTo(cx, y + player.h - 12);
  ctx.lineTo(player.x, y + player.h);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 12;
  ctx.shadowColor = "#00eaff";
  ctx.fillStyle = "#dffcff";
  ctx.beginPath();
  ctx.arc(cx, y + 23, 7, 0, Math.PI * 2);
  ctx.fill();

  const flame = 8 + Math.random() * 12;
  ctx.shadowColor = "#ff8a42";
  ctx.fillStyle = "#ffd35a";
  ctx.beginPath();
  ctx.moveTo(cx - 6, y + player.h - 5);
  ctx.lineTo(cx, y + player.h + flame);
  ctx.lineTo(cx + 6, y + player.h - 5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawEnemy(enemy) {
  const cx = enemy.x + enemy.w / 2;

  ctx.save();
  ctx.shadowBlur = 16;
  ctx.shadowColor = "#ff3d63";

  const grad = ctx.createLinearGradient(enemy.x, enemy.y, enemy.x + enemy.w, enemy.y + enemy.h);
  grad.addColorStop(0, "#ff8a9b");
  grad.addColorStop(1, "#be183b");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(cx, enemy.y + enemy.h);
  ctx.lineTo(enemy.x, enemy.y + 9);
  ctx.lineTo(cx, enemy.y + 18);
  ctx.lineTo(enemy.x + enemy.w, enemy.y + 9);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffccd5";
  ctx.beginPath();
  ctx.arc(cx, enemy.y + enemy.h * 0.56, enemy.w * 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBullets() {
  ctx.save();

  for (const bullet of bullets) {
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ffe45e";

    const grad = ctx.createLinearGradient(0, bullet.y, 0, bullet.y + bullet.h);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(1, "#ffe45e");

    ctx.fillStyle = grad;
    ctx.fillRect(bullet.x, bullet.y, bullet.w, bullet.h);
  }

  ctx.restore();
}

function drawParticles() {
  ctx.save();

  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function draw() {
  drawBackground();

  if (state === "playing" || state === "paused" || state === "gameover") {
    drawPlayer();
    drawBullets();

    for (const enemy of enemies) {
      drawEnemy(enemy);
    }
  }

  drawParticles();

  if (state === "paused") {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 18px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("PAUSADO", W / 2, H / 2 + 110);
    ctx.restore();
  }
}

function loop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000 || 0, 0.033);
  lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

function setKey(key, active) {
  if (key === "ArrowLeft" || key.toLowerCase() === "a") keys.left = active;
  if (key === "ArrowRight" || key.toLowerCase() === "d") keys.right = active;
  if (key === " ") keys.shoot = active;
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", " ", "Enter"].includes(event.key)) {
    event.preventDefault();
  }

  if (event.key === "Enter" && (state === "menu" || state === "gameover")) {
    startGame();
    return;
  }

  if (event.key.toLowerCase() === "p") {
    pauseGame();
    return;
  }

  setKey(event.key, true);
});

window.addEventListener("keyup", (event) => {
  setKey(event.key, false);
});

startButton.addEventListener("click", () => {
  if (state === "paused") {
    state = "playing";
    hideOverlay();
  } else {
    startGame();
  }
});

document.querySelectorAll("[data-control]").forEach((button) => {
  const control = button.dataset.control;

  const activate = (event) => {
    event.preventDefault();

    if (state !== "playing") return;

    if (control === "left") keys.left = true;
    if (control === "right") keys.right = true;
    if (control === "shoot") {
      keys.shoot = true;
      shoot();
    }
  };

  const deactivate = (event) => {
    event.preventDefault();

    if (control === "left") keys.left = false;
    if (control === "right") keys.right = false;
    if (control === "shoot") keys.shoot = false;
  };

  button.addEventListener("pointerdown", activate);
  button.addEventListener("pointerup", deactivate);
  button.addEventListener("pointercancel", deactivate);
  button.addEventListener("pointerleave", deactivate);
});

updateHud();
requestAnimationFrame(loop);
