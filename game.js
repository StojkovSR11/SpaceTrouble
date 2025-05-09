const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Load images
const playerImg = new Image();
playerImg.src = "spaceship_0_0.png";

const enemyImgs = [
  "spaceship_0_1.png",
  "spaceship_0_2.png",
  "spaceship_1_0.png",
  "spaceship_1_1.png"
].map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

const player = {
  x: canvas.width / 2 - 24,
  y: canvas.height - 70,
  width: 48,
  height: 48,
  speed: 5,
  lives: 3
};

let score = 0;
let gameOver = false;

const bullets = [];
const enemies = [];

document.addEventListener("keydown", (e) => {
  if (gameOver) return;
  if (e.key === "ArrowLeft") player.x -= player.speed;
  if (e.key === "ArrowRight") player.x += player.speed;
  if (e.key === " ") shoot();
});

function shoot() {
  bullets.push({ x: player.x + 22, y: player.y, speed: 7 });
}

function spawnEnemy() {
  const img = enemyImgs[Math.floor(Math.random() * enemyImgs.length)];
  enemies.push({
    x: Math.random() * (canvas.width - 48),
    y: -48,
    width: 48,
    height: 48,
    speed: 2 + Math.random() * 1.5,
    img: img
  });
}

function detectCollision(objA, objB) {
  return (
    objA.x < objB.x + objB.width &&
    objA.x + 4 > objB.x &&
    objA.y < objB.y + objB.height &&
    objA.y + 10 > objB.y
  );
}

function update() {
  if (gameOver) return;

  // Keep player within bounds
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  for (let bullet of bullets) bullet.y -= bullet.speed;

  for (let enemy of enemies) enemy.y += enemy.speed;

  // Remove off-screen bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    if (bullets[i].y < -10) bullets.splice(i, 1);
  }

  // Bullet-enemy collisions
  for (let i = enemies.length - 1; i >= 0; i--) {
    for (let j = bullets.length - 1; j >= 0; j--) {
      if (detectCollision(bullets[j], enemies[i])) {
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        score += 100;
        break;
      }
    }
  }

  // Enemy-player collisions
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (
      player.x < e.x + e.width &&
      player.x + player.width > e.x &&
      player.y < e.y + e.height &&
      player.y + player.height > e.y
    ) {
      enemies.splice(i, 1);
      player.lives -= 1;
      if (player.lives <= 0) {
        gameOver = true;
      }
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

  for (let bullet of bullets) {
    ctx.fillStyle = "yellow";
    ctx.fillRect(bullet.x, bullet.y, 4, 10);
  }

  for (let enemy of enemies) {
    ctx.drawImage(enemy.img, enemy.x, enemy.y, enemy.width, enemy.height);
  }

  // HUD
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 10, 25);
  ctx.fillText(`Lives: ${player.lives}`, 10, 50);

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "48px Arial";
    ctx.fillText("GAME OVER", canvas.width / 2 - 130, canvas.height / 2);
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

setInterval(() => {
  if (!gameOver) spawnEnemy();
}, 1500);

gameLoop();