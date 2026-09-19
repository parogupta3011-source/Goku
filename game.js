const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const playerHealthBar = document.getElementById("playerHealth");
const enemyHealthBar = document.getElementById("enemyHealth");

const playerEnergyBar = document.getElementById("playerEnergy");
const enemyEnergyBar = document.getElementById("enemyEnergy");

const timerElement = document.getElementById("timer");

const messageScreen = document.getElementById("messageScreen");
const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

const WORLD_WIDTH = canvas.width;
const WORLD_HEIGHT = canvas.height;

const GROUND_Y = 475;

const GRAVITY = 0.7;

let gameRunning = false;
let gameOver = false;

let gameTime = 60;
let timerInterval = null;

let particles = [];
let projectiles = [];
let floatingTexts = [];


/* =========================================================
   INPUT
========================================================= */

const keys = {};

window.addEventListener("keydown", (event) => {

  const key = event.key.toLowerCase();

  keys[key] = true;

  if (
    [
      "arrowup",
      "arrowdown",
      "arrowleft",
      "arrowright",
      " "
    ].includes(event.key)
  ) {
    event.preventDefault();
  }

});

window.addEventListener("keyup", (event) => {

  keys[event.key.toLowerCase()] = false;

});


/* =========================================================
   FIGHTER CLASS
========================================================= */

class Fighter {

  constructor(options) {

    this.name = options.name;

    this.x = options.x;
    this.y = GROUND_Y - 100;

    this.width = 55;
    this.height = 100;

    this.velocityX = 0;
    this.velocityY = 0;

    this.speed = options.speed || 5;

    this.health = 100;
    this.energy = 50;

    this.facing = options.facing || 1;

    this.color = options.color;
    this.secondaryColor = options.secondaryColor;

    this.isBlocking = false;

    this.attackTimer = 0;
    this.attackType = null;

    this.hitCooldown = 0;

    this.stunTimer = 0;

    this.onGround = true;

    this.aiTimer = 0;

  }


  updateTimers() {

    if (this.attackTimer > 0) {
      this.attackTimer--;
    }

    if (this.hitCooldown > 0) {
      this.hitCooldown--;
    }

    if (this.stunTimer > 0) {
      this.stunTimer--;
    }

  }


  updatePhysics() {

    this.velocityY += GRAVITY;

    this.x += this.velocityX;
    this.y += this.velocityY;

    if (this.y + this.height >= GROUND_Y) {

      this.y = GROUND_Y - this.height;

      this.velocityY = 0;

      this.onGround = true;

    } else {

      this.onGround = false;

    }

    this.x = Math.max(
      20,
      Math.min(
        WORLD_WIDTH - this.width - 20,
        this.x
      )
    );

    this.velocityX *= 0.82;

  }


  jump() {

    if (this.onGround && this.stunTimer <= 0) {

      this.velocityY = -14;

      this.onGround = false;

      createDust(
        this.x + this.width / 2,
        GROUND_Y
      );

    }

  }


  block(active) {

    if (this.stunTimer <= 0) {
      this.isBlocking = active;
    }

  }


  attack(type) {

    if (
      this.stunTimer > 0 ||
      this.attackTimer > 0
    ) {
      return false;
    }

    this.attackType = type;

    if (type === "punch") {
      this.attackTimer = 24;
    }

    if (type === "kick") {
      this.attackTimer = 30;
    }

    if (type === "blast") {

      if (this.energy < 12) {
        return false;
      }

      this.energy -= 12;

      this.attackTimer = 35;

      createProjectile(this);

    }

    if (type === "special") {

      if (this.energy < 30) {
        showFloatingText(
          this.x,
          this.y - 30,
          "NOT ENOUGH ENERGY",
          "#facc15"
        );

        return false;
      }

      this.energy -= 30;

      this.attackTimer = 70;

      createSpecialProjectile(this);

    }

    return true;

  }


  getAttackBox() {

    if (!this.attackType) {
      return null;
    }

    const activeFrame =
      this.attackType === "punch"
        ? this.attackTimer <= 15 && this.attackTimer >= 8
        : this.attackType === "kick"
        ? this.attackTimer <= 18 && this.attackTimer >= 8
        : false;

    if (!activeFrame) {
      return null;
    }

    let attackWidth = 65;

    let attackHeight = 45;

    let attackX;

    if (this.facing === 1) {
      attackX = this.x + this.width - 5;
    } else {
      attackX = this.x - attackWidth + 5;
    }

    let attackY = this.y + 25;

    if (this.attackType === "kick") {

      attackWidth = 80;

      attackHeight = 55;

      attackY = this.y + 48;

    }

    return {
      x: attackX,
      y: attackY,
      width: attackWidth,
      height: attackHeight
    };

  }


  draw() {

    ctx.save();

    const centerX =
      this.x + this.width / 2;

    const centerY =
      this.y + this.height / 2;

    /*
      Aura
    */

    if (this.energy >= 80) {

      const gradient =
        ctx.createRadialGradient(
          centerX,
          centerY,
          10,
          centerX,
          centerY,
          85
        );

      gradient.addColorStop(
        0,
        "rgba(56,189,248,0.30)"
      );

      gradient.addColorStop(
        1,
        "rgba(56,189,248,0)"
      );

      ctx.fillStyle = gradient;

      ctx.beginPath();

      ctx.arc(
        centerX,
        centerY,
        85,
        0,
        Math.PI * 2
      );

      ctx.fill();

    }


    /*
      Shadow
    */

    ctx.fillStyle =
      "rgba(0,0,0,0.35)";

    ctx.beginPath();

    ctx.ellipse(
      centerX,
      GROUND_Y + 3,
      42,
      9,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();


    /*
      Body
    */

    ctx.translate(
      centerX,
      centerY
    );

    ctx.scale(
      this.facing,
      1
    );

    ctx.translate(
      -this.width / 2,
      -this.height / 2
    );


    /*
      Legs
    */

    ctx.fillStyle =
      this.secondaryColor;

    ctx.fillRect(
      8,
      67,
      15,
      32
    );

    ctx.fillRect(
      32,
      67,
      15,
      32
    );


    /*
      Boots
    */

    ctx.fillStyle =
      "#111827";

    ctx.fillRect(
      5,
      91,
      20,
      9
    );

    ctx.fillRect(
      30,
      91,
      20,
      9
    );


    /*
      Torso
    */

    ctx.fillStyle =
      this.color;

    ctx.beginPath();

    ctx.moveTo(9, 33);

    ctx.lineTo(46, 33);

    ctx.lineTo(50, 70);

    ctx.lineTo(5, 70);

    ctx.closePath();

    ctx.fill();


    /*
      Belt
    */

    ctx.fillStyle =
      "#111827";

    ctx.fillRect(
      5,
      62,
      45,
      8
    );


    /*
      Arms
    */

    ctx.strokeStyle =
      this.color;

    ctx.lineWidth = 13;

    ctx.lineCap = "round";

    ctx.beginPath();

    ctx.moveTo(12, 38);

    ctx.lineTo(
      this.attackType === "punch"
        ? 67
        : 0,
      45
    );

    ctx.stroke();


    ctx.beginPath();

    ctx.moveTo(43, 38);

    ctx.lineTo(52, 62);

    ctx.stroke();


    /*
      Head
    */

    ctx.fillStyle =
      "#f5c6a5";

    ctx.beginPath();

    ctx.arc(
      27,
      22,
      20,
      0,
      Math.PI * 2
    );

    ctx.fill();


    /*
      Hair
    */

    ctx.fillStyle =
      this.secondaryColor;

    ctx.beginPath();

    ctx.moveTo(8, 13);

    ctx.lineTo(12, -3);

    ctx.lineTo(20, 7);

    ctx.lineTo(27, -6);

    ctx.lineTo(33, 7);

    ctx.lineTo(44, -1);

    ctx.lineTo(47, 16);

    ctx.closePath();

    ctx.fill();


    /*
      Eye
    */

    ctx.fillStyle =
      "#111827";

    ctx.fillRect(
      35,
      20,
      5,
      4
    );


    /*
      Block effect
    */

    if (this.isBlocking) {

      ctx.strokeStyle =
        "rgba(56,189,248,0.9)";

      ctx.lineWidth = 5;

      ctx.beginPath();

      ctx.arc(
        27,
        45,
        42,
        -Math.PI / 2,
        Math.PI / 2
      );

      ctx.stroke();

    }


    /*
      Special attack pose
    */

    if (this.attackType === "special") {

      ctx.fillStyle =
        "rgba(56,189,248,0.35)";

      ctx.beginPath();

      ctx.arc(
        60,
        42,
        20,
        0,
        Math.PI * 2
      );

      ctx.fill();

    }

    ctx.restore();


    /*
      Hit flash
    */

    if (this.hitCooldown > 0) {

      ctx.fillStyle =
        `rgba(255,255,255,${this.hitCooldown / 12})`;

      ctx.fillRect(
        this.x,
        this.y,
        this.width,
        this.height
      );

    }

  }

}


/* =========================================================
   FIGHTERS
========================================================= */

const player = new Fighter({
  name: "AURA",
  x: 180,
  color: "#2563eb",
  secondaryColor: "#22d3ee",
  facing: 1,
  speed: 5
});

const enemy = new Fighter({
  name: "VEX",
  x: 760,
  color: "#be185d",
  secondaryColor: "#f43f5e",
  facing: -1,
  speed: 4
});


/* =========================================================
   RESET
========================================================= */

function resetGame() {

  player.x = 180;
  player.y = GROUND_Y - player.height;

  player.velocityX = 0;
  player.velocityY = 0;

  player.health = 100;
  player.energy = 50;

  player.facing = 1;

  player.attackTimer = 0;
  player.attackType = null;

  player.stunTimer = 0;
  player.hitCooldown = 0;

  enemy.x = 760;
  enemy.y = GROUND_Y - enemy.height;

  enemy.velocityX = 0;
  enemy.velocityY = 0;

  enemy.health = 100;
  enemy.energy = 50;

  enemy.facing = -1;

  enemy.attackTimer = 0;
  enemy.attackType = null;

  enemy.stunTimer = 0;
  enemy.hitCooldown = 0;

  particles = [];
  projectiles = [];
  floatingTexts = [];

  gameTime = 60;

  updateHUD();

}


/* =========================================================
   PLAYER UPDATE
========================================================= */

let previousKeys = {};

function pressed(key) {

  return keys[key] && !previousKeys[key];

}


function updatePlayer() {

  if (player.stunTimer > 0) {
    return;
  }

  player.block(
    keys["s"]
  );


  /*
    Movement
  */

  if (!player.isBlocking) {

    if (keys["a"]) {

      player.velocityX = -player.speed;

      player.facing = -1;

    }

    if (keys["d"]) {

      player.velocityX = player.speed;

      player.facing = 1;

    }

  }


  /*
    Jump
  */

  if (
    pressed("w") ||
    pressed(" ")
  ) {

    player.jump();

  }


  /*
    Attacks
  */

  if (pressed("j")) {
    player.attack("punch");
  }

  if (pressed("k")) {
    player.attack("kick");
  }

  if (pressed("l")) {
    player.attack("blast");
  }

  if (pressed("i")) {
    player.attack("special");
  }

}


/* =========================================================
   CPU AI
========================================================= */

function updateEnemyAI() {

  if (enemy.stunTimer > 0) {
    return;
  }

  const distance =
    player.x - enemy.x;

  const absDistance =
    Math.abs(distance);

  enemy.facing =
    distance > 0 ? 1 : -1;


  /*
    Move toward player
  */

  if (absDistance > 100) {

    enemy.velocityX =
      Math.sign(distance) *
      enemy.speed;

  } else {

    enemy.velocityX = 0;

  }


  /*
    Random attacks
  */

  enemy.aiTimer--;

  if (enemy.aiTimer <= 0) {

    enemy.aiTimer =
      20 +
      Math.random() * 40;

    if (absDistance < 115) {

      const attack =
        Math.random();

      if (attack < 0.45) {

        enemy.attack("punch");

      } else if (attack < 0.8) {

        enemy.attack("kick");

      } else {

        enemy.attack("blast");

      }

    } else if (
      absDistance < 500 &&
      enemy.energy >= 30 &&
      Math.random() < 0.4
    ) {

      enemy.attack("special");

    } else if (
      absDistance < 600 &&
      enemy.energy >= 12
    ) {

      enemy.attack("blast");

    }

  }


  /*
    Random jump
  */

  if (
    Math.random() < 0.008 &&
    enemy.onGround
  ) {

    enemy.jump();

  }


  /*
    Random blocking
  */

  enemy.isBlocking =
    absDistance < 150 &&
    Math.random() < 0.025;

}


/* =========================================================
   COLLISION
========================================================= */

function rectanglesOverlap(a, b) {

  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );

}


function handleMeleeAttacks(attacker, defender) {

  const attackBox =
    attacker.getAttackBox();

  if (!attackBox) {
    return;
  }

  const defenderBox = {
    x: defender.x,
    y: defender.y,
    width: defender.width,
    height: defender.height
  };


  if (
    rectanglesOverlap(
      attackBox,
      defenderBox
    )
  ) {

    /*
      Prevent repeated hits.
    */

    if (attacker.attackTimer % 5 !== 0) {
      return;
    }


    let damage =
      attacker.attackType === "punch"
        ? 6
        : 9;


    if (defender.isBlocking) {

      damage *= 0.25;

      showFloatingText(
        defender.x,
        defender.y - 15,
        "BLOCK",
        "#38bdf8"
      );

    } else {

      defender.stunTimer =
        attacker.attackType === "kick"
          ? 12
          : 8;

      defender.velocityX =
        attacker.facing * 5;

      defender.velocityY =
        -2;

      createHitEffect(
        defender.x +
        defender.width / 2,
        defender.y +
        defender.height / 2
      );

    }


    defender.health =
      Math.max(
        0,
        defender.health - damage
      );

    attacker.energy =
      Math.min(
        100,
        attacker.energy + 4
      );

  }

}


/* =========================================================
   PROJECTILES
========================================================= */

function createProjectile(owner) {

  projectiles.push({

    owner,

    x:
      owner.facing === 1
        ? owner.x + owner.width
        : owner.x,

    y:
      owner.y + 43,

    radius: 11,

    speed:
      owner.facing * 9,

    damage: 9,

    color:
      owner === player
        ? "#22d3ee"
        : "#fb7185",

    special: false

  });

}


function createSpecialProjectile(owner) {

  projectiles.push({

    owner,

    x:
      owner.facing === 1
        ? owner.x + owner.width
        : owner.x,

    y:
      owner.y + 42,

    radius: 25,

    speed:
      owner.facing * 7,

    damage: 24,

    color:
      owner === player
        ? "#38bdf8"
        : "#f43f5e",

    special: true

  });

}


function updateProjectiles() {

  for (
    let i = projectiles.length - 1;
    i >= 0;
    i--
  ) {

    const projectile =
      projectiles[i];

    projectile.x +=
      projectile.speed;


    /*
      Trail
    */

    createProjectileTrail(
      projectile
    );


    const target =
      projectile.owner === player
        ? enemy
        : player;


    const targetBox = {
      x: target.x,
      y: target.y,
      width: target.width,
      height: target.height
    };


    const projectileBox = {
      x:
        projectile.x -
        projectile.radius,

      y:
        projectile.y -
        projectile.radius,

      width:
        projectile.radius * 2,

      height:
        projectile.radius * 2
    };


    if (
      rectanglesOverlap(
        projectileBox,
        targetBox
      )
    ) {

      let damage =
        projectile.damage;


      if (target.isBlocking) {

        damage *= 0.25;

        showFloatingText(
          target.x,
          target.y - 15,
          "BLOCK",
          "#38bdf8"
        );

      } else {

        target.stunTimer =
          projectile.special
            ? 20
            : 8;

        target.velocityX =
          projectile.speed *
          0.55;

        target.velocityY =
          projectile.special
            ? -5
            : -2;

        createHitEffect(
          projectile.x,
          projectile.y
        );

      }


      target.health =
        Math.max(
          0,
          target.health - damage
        );


      projectile.owner.energy =
        Math.min(
          100,
          projectile.owner.energy + 6
        );


      projectiles.splice(i, 1);

      continue;

    }


    /*
      Remove off-screen projectile
    */

    if (
      projectile.x < -100 ||
      projectile.x > WORLD_WIDTH + 100
    ) {

      projectiles.splice(i, 1);

    }

  }

}


function drawProjectiles() {

  projectiles.forEach(
    projectile => {

      ctx.save();

      const gradient =
        ctx.createRadialGradient(
          projectile.x,
          projectile.y,
          2,
          projectile.x,
          projectile.y,
          projectile.radius * 2.5
        );

      gradient.addColorStop(
        0,
        "#ffffff"
      );

      gradient.addColorStop(
        0.25,
        projectile.color
      );

      gradient.addColorStop(
        1,
        "rgba(255,255,255,0)"
      );

      ctx.fillStyle =
        gradient;

      ctx.beginPath();

      ctx.arc(
        projectile.x,
        projectile.y,
        projectile.radius * 2.2,
        0,
        Math.PI * 2
      );

      ctx.fill();


      ctx.fillStyle =
        projectile.color;

      ctx.beginPath();

      ctx.arc(
        projectile.x,
        projectile.y,
        projectile.radius,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.restore();

    }
  );

}


/* =========================================================
   PARTICLES
========================================================= */

function createHitEffect(x, y) {

  for (let i = 0; i < 18; i++) {

    const angle =
      Math.random() *
      Math.PI *
      2;

    const speed =
      2 +
      Math.random() * 6;

    particles.push({

      x,
      y,

      vx:
        Math.cos(angle) *
        speed,

      vy:
        Math.sin(angle) *
        speed,

      life: 25 +
        Math.random() * 15,

      maxLife: 40,

      size:
        2 +
        Math.random() * 5,

      color:
        Math.random() > 0.5
          ? "#facc15"
          : "#ffffff"

    });

  }

}


function createDust(x, y) {

  for (let i = 0; i < 10; i++) {

    particles.push({

      x:
        x +
        (Math.random() - 0.5) *
        30,

      y,

      vx:
        (Math.random() - 0.5) *
        3,

      vy:
        -Math.random() * 2,

      life:
        20 +
        Math.random() * 15,

      maxLife: 35,

      size:
        3 +
        Math.random() * 5,

      color:
        "#94a3b8"

    });

  }

}


function createProjectileTrail(projectile) {

  if (Math.random() > 0.5) {
    return;
  }

  particles.push({

    x:
      projectile.x -
      projectile.speed * 0.3,

    y:
      projectile.y,

    vx: 0,

    vy: 0,

    life: 12,

    maxLife: 12,

    size:
      projectile.radius *
      0.7,

    color:
      projectile.color

  });

}


function updateParticles() {

  for (
    let i = particles.length - 1;
    i >= 0;
    i--
  ) {

    const p =
      particles[i];

    p.x += p.vx;
    p.y += p.vy;

    p.vy += 0.05;

    p.life--;

    if (p.life <= 0) {

      particles.splice(i, 1);

    }

  }

}


function drawParticles() {

  particles.forEach(p => {

    ctx.save();

    ctx.globalAlpha =
      p.life /
      p.maxLife;

    ctx.fillStyle =
      p.color;

    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y,
      p.size,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

  });

}


/* =========================================================
   FLOATING TEXT
========================================================= */

function showFloatingText(
  x,
  y,
  text,
  color
) {

  floatingTexts.push({

    x,
    y,

    text,

    color,

    life: 45

  });

}


function updateFloatingTexts() {

  for (
    let i = floatingTexts.length - 1;
    i >= 0;
    i--
  ) {

    const item =
      floatingTexts[i];

    item.y -= 0.6;

    item.life--;

   
