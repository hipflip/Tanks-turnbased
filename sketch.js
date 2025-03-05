let gameState = 'start'; // Possible states: 'start', 'gameplay', 'end'

let launch = {
  x: 10,
  y: 595,
  angle: 0,
  power: 0
}

let environment = {
  gravity: 0.05,
  airResistance: 0.005,
  wind: 5
}

let grenades = []; // Array to store all grenade-objects we create
let player1, player2;
let currentPlayer = 1; // 1 for player1, 2 for player2
let terrain;
let ImageData; // Variable to store the background image

let powerSlider, angleSlider;
let fireButton;

function preload() {
  ImageData = loadImage('images/raoni-dorim-mountains-sunset-highress.jpg'); // Load the background image
}

class Terrain {
  constructor() {
    this.points = [];
    this.generateTerrain();
  }

  generateTerrain() {
    let x = 0;
    let y = height / 1.35;
    let step = 20;
    let amplitude = 500;

    while (x < width) {
      this.points.push({ x: x, y: y });
      x += step;
      y = height / 1.35 + noise(x * 0.01) * amplitude - amplitude / 2;
    }
  }

  show() {
    fill(34, 139, 34); // The terrain should be green like a rough but beautiful hill
    beginShape();
    vertex(0, height);
    for (let point of this.points) {
      vertex(point.x, point.y);
    }
    vertex(width, height);
    endShape(CLOSE);
  }

  getHeightAt(x) {
    for (let i = 0; i < this.points.length - 1; i++) {
      if (this.points[i].x <= x && x <= this.points[i + 1].x) {
        let t = (x - this.points[i].x) / (this.points[i + 1].x - this.points[i].x);
        return lerp(this.points[i].y, this.points[i + 1].y, t);
      }
    }
    return height / 1.35;
  }
}

function setup() {
  createCanvas(1200, 550);
  terrain = new Terrain(); // Initialize terrain before creating tanks
  player1 = new Tank(100);
  player2 = new Tank(1100);

  // Create sliders for power and angle
  powerSlider = createSlider(0, 100, 0);
  powerSlider.position(241, height + 5);
  angleSlider = createSlider(0, 360, 0);
  angleSlider.position(48, height + 5);

  // Create fire button
  fireButton = createButton('Fire');
  fireButton.position(400, height + 5);
  fireButton.mousePressed(fireGrenade);

  // Create labels for sliders
  createP('Power').position(200, height - 10);
  createP('Angle').position(10, height - 10);
}

function draw() {
  console.log("Current Gamestate", gameState);
  switch (gameState) {
    case 'start':
      drawStartScreen();
      break;
    case 'gameplay':
      drawGamePage();
      displayCurrentPlayer();
      displayPowerAndAngle();
      break;
    case 'end':
      drawEndScreen();
      break;
  }
}

function drawStartScreen() {
  background(0);
  fill(255);
  textSize(32);
  textAlign(CENTER, CENTER);
  text('Welcome to Tanks Turnbased!', width / 2, height / 2 - 40);
  textSize(24);
  text('Press ENTER to start the game', width / 2, height / 2 + 20);
}

function drawEndScreen() {
  background(0);
  fill(255);
  textSize(32);
  textAlign(CENTER, CENTER);
  text('Game Over!', width / 2, height / 2 - 40);
  textSize(24);
  text('Press ENTER to restart', width / 2, height / 2 + 20);
}

function drawGamePage() {
  // Draw the background image
  image(ImageData, 0, 0, width, height);

  // Display the terrain
  terrain.show();

  // Display the tanks
  player1.show();
  player2.show();

  // Update and show all grenades
  for (let grenade of grenades) {
    grenade.update();
    grenade.show();
  }
}

function keyPressed() {
  console.log("Key Pressed", keyCode); // debugging
  if (gameState === 'start' && keyCode === ENTER) {
    gameState = 'gameplay';
  } else if (gameState === 'end' && keyCode === ENTER) {
    resetGame();
    gameState = 'start';
  } else if (gameState === 'gameplay') {
    if (currentPlayer === 1) {
      // Controls for player 1
      if (keyCode === 65) { // 'A' key
        player1.move(-1);
      } else if (keyCode === 68) { // 'D' key
        player1.move(1);
      } else if (keyCode === 87) { // 'W' key
        player1.adjustAngle(-0.1);
      } else if (keyCode === 83) { // 'S' key
        player1.adjustAngle(0.1);
      } else if (keyCode === 81) { // 'Q' key
        player1.adjustPower(1);
      } else if (keyCode === 69) { // 'E' key
        player1.adjustPower(-1);
      } else if (keyCode === 32) { // Space key
        fireGrenade();
      }
    } else if (currentPlayer === 2) {
      // Controls for player 2
      if (keyCode === LEFT_ARROW) {
        player2.move(-1);
      } else if (keyCode === RIGHT_ARROW) {
        player2.move(1);
      } else if (keyCode === UP_ARROW) {
        player2.adjustAngle(-0.1);
      } else if (keyCode === DOWN_ARROW) {
        player2.adjustAngle(0.1);
      } else if (keyCode === 186) { // '^' key
        player2.adjustPower(1);
      } else if (keyCode === 191) { // '*' key
        player2.adjustPower(-1);
      } else if (keyCode === 13) { // "Enter" key
        fireGrenade();
      }
    }
  }
}

function mousePressed() {
  if (currentPlayer === 1) {
    player1.setAngleAndPower(mouseX, mouseY);
  } else if (currentPlayer === 2) {
    player2.setAngleAndPower(mouseX, mouseY);
  }
}

function fireGrenade() {
  let currentTank = currentPlayer === 1 ? player1 : player2;
  launchGrenade(currentTank);
}

function launchGrenade(tank) {
  let grenade = new Grenade(tank.x, tank.y);
  grenade.vx = cos(tank.angle) * (tank.power / 4); //reduce the power by half
  grenade.vy = sin(tank.angle) * (tank.power / 4); // reduce the power by half
  grenades.push(grenade);
  setTimeout(() => {
 // grenade.armed = true;
  }
    , 500);
}


class Tank {
  constructor(x) {
    this.x = x;
    this.y = terrain.getHeightAt(x); // Set the initial y-coordinate based on the terrain height
    this.angle = 0;
    this.power = 0;
  }

  getTerrainHeight(x) {
    for (let i = 0; i < terrain.points.length - 1; i++) {
      if (terrain.points[i].x <= x && x <= terrain.points[i + 1].x) {
        let t = (x - terrain.points[i].x) / (terrain.points[i + 1].x - terrain.points[i].x);
        return lerp(terrain.points[i].y, terrain.points[i + 1].y, t);
      }
    }
    return height / 2;
  }

  show() {
    this.y = terrain.getHeightAt(this.x); // Update y position based on terrain
    // Draw the tank body
    rect(this.x - 20, this.y - 10, 40, 20);
    // Draw the cannon
    let cannonX = this.x + cos(this.angle) * 30;
    let cannonY = this.y + sin(this.angle) * 30;
    line(this.x, this.y, cannonX, cannonY);
  }

  move(direction) {
    this.x += direction * 5; // Move the tank left or right
  }

  adjustAngle(delta) {
    this.angle += delta; // Adjust the cannon angle
  }

  adjustPower(delta) {
    this.power += delta; // Adjust the launch power
  }

  setAngleAndPower(mouseX, mouseY) {
    let dx = mouseX - this.x;
    let dy = mouseY - this.y;
    this.angle = atan2(dy, dx);
    this.power = dist(this.x, this.y, mouseX, mouseY) / 30; // Scale the power based on distance
  }
}

class Grenade {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.size = 10;
    this.gravity = environment.gravity;
    this.airResistance = environment.airResistance;
    this.exploded = false;
    this.armed = false;
  }

  update() {
    if (!this.exploded) {
      this.vy += this.gravity; // Gravity is a constant acceleration added each turn
      this.vy -= this.vy * this.airResistance; // Air resistance is a force that scales with the velocity
      this.vx -= (this.vx + environment.wind) * this.airResistance;
      this.x += this.vx;  // The velocity is added to the position
      this.y += this.vy;

      // Check for direct hit on tanks
      if (this.checkHit(player1) || this.checkHit(player2)) {
        this.explode();
      }

      // If the grenade hits the ground, explode
      if (this.armed) {
        if (this.y > height) {
          this.y = height;
          this.vy = 0;
          this.vx = 0;
          this.explode();
        } else {
          for (let i = 0; i < terrain.points.length - 1; i++) {
            if (terrain.points[i].x <= this.x && this.x <= terrain.points[i + 1].x) {
              let t = (this.x - terrain.points[i].x) / (terrain.points[i + 1].x - terrain.points[i].x);
              let terrainHeight = lerp(terrain.points[i].y, terrain.points[i + 1].y, t);
              if (this.y > terrainHeight) {
                this.y = terrainHeight;
                this.vy = 0;
                this.vx = 0;
                this.explode();
              }
            }
          }
        }
      }
    }
  }

  show() {
    if (!this.exploded) {
      ellipse(this.x, this.y, this.size);
    }
  }

  explode() {
    this.exploded = true;
    let explosionRadius = 50;
    for (let i = 0; i < terrain.points.length; i++) {
      let d = dist(this.x, this.y, terrain.points[i].x, terrain.points[i].y);
      if (d < explosionRadius) {
        terrain.points[i].y -= map(d, 0, explosionRadius, explosionRadius, 0);
      }
    }
    // Check if the explosion hit any tank
    if (this.armed && (this.checkHit(player1) || this.checkHit(player2))) {
      gameState = 'end';
    } else {
      switchPlayer();
    }
  }

  checkHit(tank) {
    let d = dist(this.x, this.y, tank.x, tank.y);
    return d < this.size / 2 + 20; // 20 is half the width of the tank
  }
}

function switchPlayer() {
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  console.log("Switched to Player:", currentPlayer);
}

function displayCurrentPlayer() {
  textSize(25);
  fill(0);
  textAlign(CENTER, TOP);
  if (currentPlayer === 1) {
    text("Player 1's turn", width / 2, 50);
  } else {
    text("Player 2's turn", width / 2, 50);
  }
}

function displayPowerAndAngle() {
  let currentTank = currentPlayer === 1 ? player1 : player2;
  currentTank.power = powerSlider.value();
  currentTank.angle = radians(angleSlider.value());

  fill(0);
  textSize(16);
  text(`Power: ${currentTank.power}`, powerSlider.x * 2 + powerSlider.width, height + 25);
  text(`Angle: ${degrees(currentTank.angle).toFixed(2)}`, angleSlider.x * 2 + angleSlider.width, height + 55);
}

function resetGame() {
  terrain = new Terrain();
  player1 = new Tank(100);
  player2 = new Tank(1100);
  grenades = [];
  currentPlayer = 1;
}