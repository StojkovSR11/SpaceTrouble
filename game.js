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

// Sounds
const bgMusic = new Audio("music.mp3");
bgMusic.loop = true;
bgMusic.volume = 1;

// Game state variables
let gameStarted = false;
let musicPlayed = false;  // Flag to track if the music has been played

// Function to start the music only after user interaction
function startMusic() {
  if (!musicPlayed) {
    bgMusic.play().catch((error) => {
      console.log("Audio play failed:", error);
    });
    musicPlayed = true;
  }
}

// Start game logic and play music when button is clicked
document.getElementById("startGameBtn").addEventListener("click", () => {
  if (!gameStarted) {
    startMusic(); // Play background music
    gameStarted = true;
    gameLoop(); // Start the game loop
    startEnemySpawning(); // Start spawning enemies
    startEnemyShooting(); // Start enemy shooting
    document.getElementById("startGameBtn").style.display = "none"; // Hide the button after starting the game
  }
});

// Player properties
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
const enemyBullets = [];

document.addEventListener("keydown", (e) => {
  if (gameOver || !gameStarted) return; // Prevent player input if the game is over or hasn't started
  if (e.key === "ArrowLeft") player.x -= player.speed;
  if (e.key === "ArrowRight") player.x += player.speed;
  if (e.key === " ") shoot();
});

function shoot() {
  const gunSound = new Audio("gun.mp3");
  gunSound.volume = 0.3;
  gunSound.play();
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
  if (gameOver) {
    // Show restart button when game is over
    document.getElementById("restartGameBtn").style.display = "block";
    return;
  }

  // Keep player within bounds
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  // Update bullets
  for (let bullet of bullets) bullet.y -= bullet.speed;
  for (let b of enemyBullets) b.y += b.speed;

  // Update enemies
  for (let enemy of enemies) enemy.y += enemy.speed;

  // Remove off-screen bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    if (bullets[i].y < -10) bullets.splice(i, 1);
  }

  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    if (enemyBullets[i].y > canvas.height) enemyBullets.splice(i, 1);
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
      if (player.lives <= 0) gameOver = true;
    }
  }

  // Enemy bullet hits player
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    if (
      b.x < player.x + player.width &&
      b.x + 4 > player.x &&
      b.y < player.y + player.height &&
      b.y + 10 > player.y
    ) {
      enemyBullets.splice(i, 1);
      player.lives -= 1;
      if (player.lives <= 0) gameOver = true;
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

  // Draw player bullets
  for (let bullet of bullets) {
    ctx.fillStyle = "yellow";
    ctx.fillRect(bullet.x, bullet.y, 4, 10);
  }

  // Draw enemy bullets
  for (let b of enemyBullets) {
    ctx.fillStyle = "red";
    ctx.fillRect(b.x, b.y, 4, 10);
  }

  // Draw enemies
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

// Spawn enemies every 1.5s (only after game starts)
function startEnemySpawning() {
  setInterval(() => {
    if (!gameOver) spawnEnemy();
  }, 1500);
}

// Enemies shoot every second (only after game starts)
function startEnemyShooting() {
  setInterval(() => {
    if (gameOver) return;
    enemies.forEach(e => {
      if (Math.random() < 0.2) {
        enemyBullets.push({ x: e.x + 22, y: e.y + 48, speed: 4 });
        const laser = new Audio("laser.mp3");
        laser.volume = 0.3;
        laser.play();
      }
    });
  }, 1000);
}

// Restart game logic
document.getElementById("restartGameBtn").addEventListener("click", restartGame);

function restartGame() {
  // Reset game state
  player.lives = 3;
  player.x = canvas.width / 2 - 24;
  player.y = canvas.height - 70;
  score = 0;
  gameOver = false;

  // Clear all enemies, bullets, etc.
  enemies.length = 0;
  bullets.length = 0;
  enemyBullets.length = 0;

  // Hide the restart button and show the start button
  document.getElementById("restartGameBtn").style.display = "none";
  document.getElementById("startGameBtn").style.display = "block";

  // Start the game
  gameStarted = false;
  document.getElementById("startGameBtn").style.display = "block";
}
