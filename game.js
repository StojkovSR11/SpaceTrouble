const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Load images
const playerImg = new Image();
playerImg.src = "spaceship_0_0.png";

const explosionFrames = [];
for (let i = 1; i <= 34; i++) {
  const img = new Image();
  img.src = `explosion/img_${i}.png`; // New format
  explosionFrames.push(img);
}


let explosionFrameIndex = 0;
let explosionInProgress = false;
let explosionX = 0;
let explosionY = 0;
const enemyExplosions = []; // Array of active enemy explosions


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

let keysPressed = {
  left: false,
  right: false,
  space: false
};

document.addEventListener("keydown", (e) => {
  if (gameOver) return; // Prevent any input if the game is over
  
  // Handle movement (Arrow keys should not block each other)
  if (e.key === "ArrowLeft") {
    keysPressed.left = true;
  }
  if (e.key === "ArrowRight") {
    keysPressed.right = true;
  }

  // Handle starting the game or pausing/resuming
  if (e.key === " " && !keysPressed.space) {
    if (!gameStarted || gamePaused) {
      const currentTime = Date.now();
      if (currentTime - lastShotTime > shootCooldown) {
        if (!gameStarted) {
          startMusic(); // Start the music if the game hasn't started
          gameStarted = true;
          gameLoop(); // Start the game loop
          startEnemySpawning(); // Start spawning enemies
          startEnemyShooting(); // Start enemy shooting
          document.getElementById("startGameBtn").textContent = "Pause"; // Change button to Pause
        } else if (gamePaused) {
          gamePaused = false; // Unpause the game
          document.getElementById("startGameBtn").textContent = "Pause"; // Change button text
          gameLoop(); // Resume the game loop
        }
      }
    } else {
      // Only shoot if the game has started and it's not paused
      shoot();
      lastShotTime = Date.now();
    }
    keysPressed.space = true; // Lock spacebar until released
    e.preventDefault();  // Prevent default spacebar behavior (scroll, etc)
  }

  // Toggle pause with P key
  if (e.key.toLowerCase() === "p") {
    gamePaused = !gamePaused;
    if (!gamePaused) {
      gameLoop(); // Restart the game loop if not paused
    }

    const startBtn = document.getElementById("startGameBtn");
    startBtn.textContent = gamePaused ? "Resume" : "Pause"; // Update button text
    startBtn.blur(); // Remove focus to prevent spacebar reactivation
  }
});

document.addEventListener("keyup", (e) => {
   // Prevent any input if the game is over
  
  // Reset movement and shooting states on key release
  if (e.key === "ArrowLeft") {
    keysPressed.left = false;
  }
  if (e.key === "ArrowRight") {
    keysPressed.right = false;
  }
  if (e.key === " ") {
    keysPressed.space = false;  // Allow shooting again when spacebar is released
  }
});



// Player properties
const player = {
  x: canvas.width / 2 - 24,
  y: canvas.height - 70,
  width: 72,
  height: 72,
  speed: 7, // Increased player movement speed
  lives: 3
};

const stars = [];
const numberOfStars = 100;

// Initialize stars
for (let i = 0; i < numberOfStars; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5 + 0.5,
    speed: Math.random() * 0.5 + 0.2
  });
}

let score = 0;
let gameOver = false;

const bullets = [];
const enemies = [];
const enemyBullets = [];

// Shooting cooldown
let lastShotTime = 0;
const shootCooldown = 100; // Cooldown time in milliseconds (500ms)

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
    direction: Math.random() > 0.5 ? 1 : -1, // Random direction, 1 for right, -1 for left
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
  // Move player based on keys pressed
  if (keysPressed.left) player.x -= player.speed;
  if (keysPressed.right) player.x += player.speed;

  for (let star of stars) {
    star.y += star.speed;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
  }

  if (gameOver) {
    document.getElementById("restartGameBtn").style.display = "block";
    document.getElementById("startGameBtn").style.display = "none";
    return;
  }

  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  for (let bullet of bullets) bullet.y -= bullet.speed;
  for (let b of enemyBullets) b.y += b.speed;
  for (let enemy of enemies) {
    // Move enemies in a zigzag pattern
    enemy.x += enemy.direction * 2; // Change 2 for speed of horizontal movement
    if (enemy.x <= 0 || enemy.x >= canvas.width - enemy.width) {
      enemy.direction *= -1; // Reverse direction when hitting the screen edges
    }
    enemy.y += enemy.speed;
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    if (bullets[i].y < -10) bullets.splice(i, 1);
  }

  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    if (enemyBullets[i].y > canvas.height) enemyBullets.splice(i, 1);
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    for (let j = bullets.length - 1; j >= 0; j--) {
      if (detectCollision(bullets[j], enemies[i])) {
       enemyExplosions.push({
        x: enemies[i].x,
        y: enemies[i].y,
        frameIndex: 0
      });
      enemies.splice(i, 1);
      bullets.splice(j, 1);
      score += 100;
      const enemyExplosion = new Audio("enemyexplosion.mp3");
      enemyExplosion.volume = 0.8;
      enemyExplosion.play();

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
      const playerRicochet = new Audio("ricochet.mp3");
      const playerExplosion = new Audio("playerexplosion.mp3");
      
      if (player.lives <= 0) {
        gameOver = true;
        playerExplosion.volume = 1.0;
        playerExplosion.play();
        explosionInProgress = true;
        explosionFrameIndex = 0;
        explosionX = player.x;
        explosionY = player.y;

      } else {
        playerRicochet.volume = 0.5;
        playerRicochet.play();
      }
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
      const playerRicochet = new Audio("ricochet.mp3");
      const playerExplosion = new Audio("playerexplosion.mp3");
      
      if (player.lives <= 0) {
        gameOver = true;
        playerExplosion.volume = 1.0;
        playerExplosion.play();
        explosionInProgress = true;
        explosionFrameIndex = 0;
        explosionX = player.x;
        explosionY = player.y;

      } else {
        playerRicochet.volume = 0.5;
        playerRicochet.play();
      }
    }
  }
}


function draw() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw stars
  ctx.fillStyle = "white";
  for (let star of stars) {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw player
if (explosionInProgress) {
  const frame = explosionFrames[explosionFrameIndex];
  if (frame.complete) {
    ctx.drawImage(frame, explosionX -84, explosionY -84, player.width * 3, player.height * 3);
  }

  if (explosionFrameIndex < explosionFrames.length - 1) {
    explosionFrameIndex++;
  } else {
    explosionInProgress = false;
  }
} else {
  if (!gameStarted) {
    ctx.drawImage(playerImg, canvas.width / 2 - 24, canvas.height - 70, player.width, player.height);
    ctx.fillStyle = "#ff7e5f";
    ctx.font = "22px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Controls: ← → to move, SPACE to shoot, P to pause", canvas.width / 2, canvas.height / 2 + 60);
    ctx.font = "26px Arial";
    ctx.fillText("Press SPACE or click Start to begin!", canvas.width / 2, canvas.height / 2 + 100);
  } else if (!gameOver) {
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
  }
}


  // Draw bullets
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

  for (let i = enemyExplosions.length - 1; i >= 0; i--) {
  const explosion = enemyExplosions[i];
  const frame = explosionFrames[explosion.frameIndex];
  if (frame.complete) {
    ctx.drawImage(frame, explosion.x, explosion.y, 48, 48); // Smaller size
  }
  explosion.frameIndex++;
  if (explosion.frameIndex >= explosionFrames.length) {
    enemyExplosions.splice(i, 1); // Remove finished explosion
  }
}


  // Draw score and lives
  if (!gameOver) {
    ctx.fillStyle = "#ff7e5f";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${score}`, 40, 25);
  }

  for (let i = 0; i < player.lives; i++) {
    ctx.drawImage(playerImg, 40 + i * 35, 50, 24, 24);
  }

  // Game over display
  if (gameOver) {
    ctx.fillStyle = "#ff7e5f";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = "30px Arial";
    ctx.fillText(`Total Score: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
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

   playerImg.src = "spaceship_0_0.png";

  enemies.length = 0;
  bullets.length = 0;
  enemyBullets.length = 0;

  document.getElementById("restartGameBtn").style.display = "none";
  document.getElementById("startGameBtn").style.display = "block";
  document.getElementById("startGameBtn").textContent = "Pause";
  document.getElementById("startGameBtn").blur(); // Prevent spacebar reactivation
}

document.getElementById("toggleMusicBtn").addEventListener("click", () => {
  toggleMusic();
  document.getElementById("toggleMusicBtn").textContent = bgMusic.paused ? "Play Music" : "Pause Music";
});

playerImg.onload = () => {
  draw(); // This will render the player icon before the game starts
};
