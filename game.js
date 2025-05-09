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
let gamePaused = false;
let musicPlayed = false; // Flag to track if the music has been played

// Function to start the music only after user interaction
function startMusic() {
  if (!musicPlayed) {
    bgMusic.play().catch((error) => {
      console.log("Audio play failed:", error);
    });
    musicPlayed = true;
  }
}

// Function to toggle music
function toggleMusic() {
  if (bgMusic.paused) {
    bgMusic.play();
  } else {
    bgMusic.pause();
  }
}

// Start game logic and play music when button is clicked
document.getElementById("startGameBtn").addEventListener("click", () => {
  if (!gameStarted) {
    startMusic();
    gameStarted = true;
    gameLoop();
    startEnemySpawning();
    startEnemyShooting();
    document.getElementById("startGameBtn").textContent = "Pause";
    document.getElementById("startGameBtn").blur(); // Prevent spacebar reactivation
  } else {
    gamePaused = !gamePaused;
    if (gamePaused) {
      document.getElementById("startGameBtn").textContent = "Resume";
    } else {
      document.getElementById("startGameBtn").textContent = "Pause";
      gameLoop();
    }
    document.getElementById("startGameBtn").blur(); // Prevent spacebar reactivation
  }
});

// Prevent spacebar from triggering focused buttons
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && document.activeElement.tagName === "BUTTON") {
    e.preventDefault();
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
  if (gameOver || !gameStarted || gamePaused) return;
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
    document.getElementById("restartGameBtn").style.display = "block";
    return;
  }

  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  for (let bullet of bullets) bullet.y -= bullet.speed;
  for (let b of enemyBullets) b.y += b.speed;
  for (let enemy of enemies) enemy.y += enemy.speed;

  for (let i = bullets.length - 1; i >= 0; i--) {
    if (bullets[i].y < -10) bullets.splice(i, 1);
  }

  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    if (enemyBullets[i].y > canvas.height) enemyBullets.splice(i, 1);
  }

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

  for (let bullet of bullets) {
    ctx.fillStyle = "yellow";
    ctx.fillRect(bullet.x, bullet.y, 4, 10);
  }

  for (let b of enemyBullets) {
    ctx.fillStyle = "red";
    ctx.fillRect(b.x, b.y, 4, 10);
  }

  for (let enemy of enemies) {
    ctx.drawImage(enemy.img, enemy.x, enemy.y, enemy.width, enemy.height);
  }

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
  if (gamePaused) return;
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function startEnemySpawning() {
  setInterval(() => {
    if (!gameOver && !gamePaused) spawnEnemy();
  }, 1500);
}

function startEnemyShooting() {
  setInterval(() => {
    if (gameOver || gamePaused) return;
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

document.getElementById("restartGameBtn").addEventListener("click", restartGame);

function restartGame() {
  player.lives = 3;
  player.x = canvas.width / 2 - 24;
  player.y = canvas.height - 70;
  score = 0;
  gameOver = false;

  enemies.length = 0;
  bullets.length = 0;
  enemyBullets.length = 0;

  document.getElementById("restartGameBtn").style.display = "none";
  document.getElementById("startGameBtn").textContent = "Pause";
  document.getElementById("startGameBtn").blur(); // Prevent spacebar reactivation
}

document.getElementById("toggleMusicBtn").addEventListener("click", () => {
  toggleMusic();
  document.getElementById("toggleMusicBtn").textContent = bgMusic.paused ? "Play Music" : "Pause Music";
});
