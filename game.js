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
bgMusic.volume = 0.3;

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
  gunSound.volume = 0.1;
  gunSound.play();

  let shots = 1;
  if (score >= 3000) {
    shots = 3;
  } else if (score >= 1500) {
    shots = 2;
  }

  const baseX = player.x + 33;
  const baseY = player.y;
  const speed = 7;

  if (shots === 1) {
    // straight bullet
    bullets.push({
      x: baseX,
      y: baseY,
      speed: speed,
      angle: 0 // straight up
    });
  } else if (shots === 2) {
    // two bullets with slight angles
    const angles = [-5, 5]; // degrees
    angles.forEach(deg => {
      bullets.push({
        x: baseX,
        y: baseY,
        speed: speed,
        angle: deg * (Math.PI / 180)
      });
    });
  } else if (shots === 3) {
    // three bullets: left, center, right
    const angles = [-10, 0, 10]; // degrees
    angles.forEach(deg => {
      bullets.push({
        x: baseX,
        y: baseY,
        speed: speed,
        angle: deg * (Math.PI / 180)
      });
    });
  }
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
  const shrinkA = { x: 5, y: 5 }; // Shrink hitbox A by 2px width and 4px height (1px per side)
  const shrinkB = { x: 5, y: 5 }; // Shrink hitbox B similarly

  return (
    objA.x + shrinkA.x < objB.x + objB.width - shrinkB.x &&
    objA.x + 4 - shrinkA.x > objB.x + shrinkB.x &&
    objA.y + shrinkA.y < objB.y + objB.height - shrinkB.y &&
    objA.y + 10 - shrinkA.y > objB.y + shrinkB.y
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

  for (let bullet of bullets) {
  const angle = bullet.angle || 0;
  bullet.x += Math.sin(angle) * bullet.speed;
  bullet.y -= Math.cos(angle) * bullet.speed;
}

  for (let b of enemyBullets) b.y += b.speed;

  for (let enemy of enemies) {
    enemy.x += enemy.direction * 2;
    if (enemy.x <= 0 || enemy.x >= canvas.width - enemy.width) {
      enemy.direction *= -1;
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

  // Shrink amount for player's collision box
  const shrinkX = 15; // 2px on each side = 4px total
  const shrinkY = 15; // 3px on top and bottom = 6px total

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (
      player.x + shrinkX < e.x + e.width &&
      player.x + player.width - shrinkX > e.x &&
      player.y + shrinkY < e.y + e.height &&
      player.y + player.height - shrinkY > e.y
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
        playerRicochet.volume = 1;
        playerRicochet.play();
      }
    }
  }

  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    if (
      b.x < player.x + player.width - shrinkX &&
      b.x + 4 > player.x + shrinkX &&
      b.y < player.y + player.height - shrinkY &&
      b.y + 10 > player.y + shrinkY
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
        playerRicochet.volume = 1;
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
      ctx.drawImage(frame, explosionX - 84, explosionY - 84, player.width * 3, player.height * 3);
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
  // Simple draw test for bullets
  for (let bullet of bullets) {
    ctx.fillStyle = "yellow";
    ctx.fillRect(bullet.x, bullet.y, 4, 10);  // Regular bullet
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

  // Draw enemy explosions
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
    ctx.fillText(`Score: ${score}`, 430, 30);
  }

  // Draw player lives
  for (let i = 0; i < player.lives; i++) {
    ctx.drawImage(playerImg, 40 + i * 35, 10, 24, 24);
  }

// Draw the next weapon label in the top-right corner
  // Right aligned, under score

// Draw the next weapon as bullets underneath the label

if (score < 1500) {
  ctx.fillStyle = "#ff7e5f";
  ctx.font = "20px Arial";
  ctx.textAlign = "right";
  ctx.fillText("Next Weapon", canvas.width - 40, 30);
  // Draw two bullets for double shot
  ctx.fillStyle = "yellow";
  ctx.fillRect(canvas.width - 100, 50, 4, 10);  // Left bullet
  ctx.fillRect(canvas.width - 80, 50, 4, 10);  // Right bullet
} else if (score < 3000) {
  ctx.fillStyle = "#ff7e5f";
  ctx.font = "20px Arial";
  ctx.textAlign = "right";
  ctx.fillText("Next Weapon", canvas.width - 40, 25);
  // Draw three bullets for triple shot
  ctx.fillStyle = "yellow";
  ctx.fillRect(canvas.width - 110, 50, 4, 10);  // Left bullet
  ctx.fillRect(canvas.width - 90, 50, 4, 10);  // Center bullet
  ctx.fillRect(canvas.width - 70, 50, 4, 10);  // Right bullet
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

let spawnInterval = 5000;
const minInterval = 5000;
const intervalStep = 100;

let spawnCount = 0;
let enemiesPerCycle = 1;
const maxEnemiesPerCycle = 15;
const increaseEvery = 3;

let spawnCycleCount = 0;
let timerId = null;

function startEnemySpawning() {
  function scheduleNext() {
    timerId = setTimeout(() => {
      if (!gameOver && !gamePaused) {
        for (let i = 0; i < enemiesPerCycle; i++) {
          spawnEnemy();
          spawnCount++;
        }

        spawnCycleCount++;

        spawnInterval = Math.max(minInterval, spawnInterval - intervalStep);
        console.log(`Cycle ${spawnCycleCount}: Spawned ${enemiesPerCycle} enemies. Next in ${spawnInterval}ms`);

        if (spawnCycleCount % increaseEvery === 0 && enemiesPerCycle < maxEnemiesPerCycle) {
          enemiesPerCycle++;
          console.log(`Increasing enemies per cycle to ${enemiesPerCycle}`);
        }
      }

      scheduleNext();
    }, spawnInterval);
  }

  scheduleNext();
}



function startEnemyShooting() {
  setInterval(() => {
    if (gameOver || gamePaused) return;

    // Calculate dynamic shooting probability
    const baseProbability = 0.01;
    const additionalProbability = Math.floor(score / 200) * 0.0005; // Increase more slowly, every 200 points
    const shootProbability = Math.min(baseProbability + additionalProbability, 0.1); // Cap at 10%

    enemies.forEach(e => {
      const isOnScreen =
        e.x >= 0 && e.x <= canvas.width &&
        e.y >= 0 && e.y <= canvas.height;

      if (isOnScreen && Math.random() < shootProbability) {
        enemyBullets.push({ x: e.x + 22, y: e.y + 48, speed: 5 });
        const laser = new Audio("laser.mp3");
        laser.volume = 0.1;
        laser.play();
      }
    });
  }, 10);
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

  // Clear the previous spawn cycle by stopping the timer
  if (timerId !== null) {
    clearTimeout(timerId);
  }

  // Reset variables for enemy spawning
  spawnInterval = 5000;
  spawnCount = 0;
  enemiesPerCycle = 1;
  spawnCycleCount = 0;

  // Start the new enemy spawn cycle
  startEnemySpawning();

  document.getElementById("restartGameBtn").style.display = "none";
  document.getElementById("startGameBtn").style.display = "block";
  document.getElementById("startGameBtn").textContent = "Pause";
  document.getElementById("startGameBtn").blur();
}

document.getElementById("toggleMusicBtn").addEventListener("click", () => {
  toggleMusic();
  document.getElementById("toggleMusicBtn").textContent = bgMusic.paused ? "Play Music" : "Pause Music";
});

playerImg.onload = () => {
  draw(); // This will render the player icon before the game starts
};
