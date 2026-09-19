const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const playerHealth = document.getElementById("playerHealth");
const enemyHealth = document.getElementById("enemyHealth");

const playerEnergy = document.getElementById("playerEnergy");
const enemyEnergy = document.getElementById("enemyEnergy");

const timerElement = document.getElementById("timer");

const messageScreen = document.getElementById("messageScreen");
const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const GROUND = 475;

let running = false;
let timeLeft = 60;

let timerInterval;

let projectiles = [];
let particles = [];
let texts = [];

const keys = {};
const oldKeys = {};


/* =====================================================
   INPUT
===================================================== */

window.addEventListener("keydown", e => {

  const key = e.key.toLowerCase();

  keys[key] = true;

  if (
    [
      "arrowup",
      "arrowdown",
      "arrowleft",
      "arrowright",
      " "
    ].includes(e.key)
  ) {
    e.preventDefault();
  }

});


window.addEventListener("keyup", e => {

  keys[e.key.toLowerCase()] = false;

});


function justPressed(key) {

  return keys[key] && !oldKeys[key];

}


/* =====================================================
   FIGHTER
===================================================== */

class Fighter {

  constructor({
    name,
    x,
    color,
    hair,
    facing
  }) {

    this.name = name;

    this.x = x;
    this.y = GROUND - 100;

    this.width = 55;
    this.height = 100;

    this.vx = 0;
    this.vy = 0;

    this.speed = 5;

    this.health = 100;
    this.energy = 50;

    this.color = color;
    this.hair = hair;

    this.facing = facing;

    this.attack = null;
    this.attackTimer = 0;

    this.stun = 0;
    this.hitCooldown = 0;

    this.blocking = false;

    this.aiTimer = 0;
  }


  reset(x) {

    this.x = x;
    this.y = GROUND - this.height;

    this.vx = 0;
    this.vy = 0;

    this.health = 100;
    this.energy = 50;

    this.attack = null;
    this.attackTimer = 0;

    this.stun = 0;
    this.hitCooldown = 0;

    this.blocking = false;
  }


  update() {

    if (this.stun > 0) {
      this.stun--;
    }

    if (this.hitCooldown > 0) {
      this.hitCooldown--;
    }

    if (this.attackTimer > 0) {

      this.attackTimer--;

      if (this.attackTimer === 0) {
        this.attack = null;
      }

    }


    this.vy += 0.7;

    this.x += this.vx;
    this.y += this.vy;

    this.vx *= 0.82;


    if (this.y + this.height >= GROUND) {

      this.y = GROUND - this.height;

      this.vy = 0;

    }


    this.x = Math.max(
      10,
      Math.min(
        WIDTH - this.width - 10,
        this.x
      )
    );


    if (
      this.energy < 100 &&
      Math.random() < 0.02
    ) {

      this.energy += 0.5;

    }

  }


  jump() {

    if (
      this.y + this.height >= GROUND - 1 &&
      this.stun <= 0
    ) {

      this.vy = -14;

      dust(
        this.x + this.width / 2,
        GROUND
      );

    }

  }


  doAttack(type) {

    if (
      this.stun > 0 ||
      this.attackTimer > 0
    ) {
      return;
    }


    if (
      type === "blast" &&
      this.energy < 12
    ) {
      showText(
        this.x,
        this.y - 10,
        "LOW ENERGY",
        "#facc15"
      );

      return;
    }


    if (
      type === "special" &&
      this.energy < 30
    ) {
      showText(
        this.x,
        this.y - 10,
        "LOW ENERGY",
        "#facc15"
      );

      return;
    }


    this.attack = type;


    if (type === "punch") {

      this.attackTimer = 22;

    }


    if (type === "kick") {

      this.attackTimer = 28;

    }


    if (type === "blast") {

      this.energy -= 12;

      this.attackTimer = 25;

      createBlast(this, false);

    }


    if (type === "special") {

      this.energy -= 30;

      this.attackTimer = 55;

      createBlast(this, true);

    }

  }


  attackBox() {

    if (
      this.attack !== "punch" &&
      this.attack !== "kick"
    ) {
      return null;
    }


    const active =
      this.attackTimer < 14 &&
      this.attackTimer > 5;


    if (!active) {
      return null;
    }


    const width =
      this.attack === "kick"
        ? 85
        : 65;

    const height =
      this.attack === "kick"
        ? 55
        : 45;

    const y =
      this.attack === "kick"
        ? this.y + 50
        : this.y + 25;


    return {

      x:
        this.facing === 1
          ? this.x + this.width
          : this.x - width,

      y,

      width,
      height

    };

  }


  draw() {

    const cx =
      this.x + this.width / 2;

    const cy =
      this.y + this.height / 2;


    ctx.save();


    /* Aura */

    if (this.energy >= 80) {

      const glow =
        ctx.createRadialGradient(
          cx,
          cy,
          5,
          cx,
          cy,
          80
        );

      glow.addColorStop(
        0,
        "rgba(34,211,238,0.35)"
      );

      glow.addColorStop(
        1,
        "rgba(34,211,238,0)"
      );

      ctx.fillStyle = glow;

      ctx.beginPath();

      ctx.arc(
        cx,
        cy,
        80,
        0,
        Math.PI * 2
      );

      ctx.fill();

    }


    /* Shadow */

    ctx.fillStyle =
      "rgba(0,0,0,0.4)";

    ctx.beginPath();

    ctx.ellipse(
      cx,
      GROUND + 2,
      38,
      8,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();


    ctx.translate(cx, cy);

    ctx.scale(this.facing, 1);

    ctx.translate(
      -this.width / 2,
      -this.height / 2
    );


    /* Legs */

    ctx.fillStyle = "#182033";

    ctx.fillRect(8, 65, 15, 35);
    ctx.fillRect(33, 65, 15, 35);


    /* Shoes */

    ctx.fillStyle = "#020617";

    ctx.fillRect(4, 92, 21, 8);
    ctx.fillRect(30, 92, 21, 8);


    /* Body */

    ctx.fillStyle = this.color;

    ctx.beginPath();

    ctx.moveTo(8, 32);
    ctx.lineTo(47, 32);
    ctx.lineTo(50, 70);
    ctx.lineTo(5, 70);

    ctx.closePath();

    ctx.fill();


    /* Belt */

    ctx.fillStyle = "#111827";

    ctx.fillRect(
      5,
      61,
      45,
      8
    );


    /* Arms */

    ctx.strokeStyle = this.color;

    ctx.lineWidth = 12;

    ctx.lineCap = "round";


    ctx.beginPath();

    ctx.moveTo(10, 38);

    ctx.lineTo(
      this.attack === "punch"
        ? 68
        : 2,
      43
    );

    ctx.stroke();


    ctx.beginPath();

    ctx.moveTo(45, 38);

    ctx.lineTo(53, 60);

    ctx.stroke();


    /* Head */

    ctx.fillStyle = "#f2c29f";

    ctx.beginPath();

    ctx.arc(
      27,
      21,
      20,
      0,
      Math.PI * 2
    );

    ctx.fill();


    /* Hair */

    ctx.fillStyle = this.hair;

    ctx.beginPath();

    ctx.moveTo(7, 14);

    ctx.lineTo(12, -5);

    ctx.lineTo(20, 7);

    ctx.lineTo(27, -7);

    ctx.lineTo(33, 7);

    ctx.lineTo(44, -3);

    ctx.lineTo(47, 16);

    ctx.closePath();

    ctx.fill();


    /* Eye */

    ctx.fillStyle = "#020617";

    ctx.fillRect(
      35,
      19,
      5,
      4
    );


    /* Block */

    if (this.blocking) {

      ctx.strokeStyle =
        "rgba(34,211,238,0.9)";

      ctx.lineWidth = 5;

      ctx.beginPath();

      ctx.arc(
        27,
        43,
        42,
        -Math.PI / 2,
        Math.PI / 2
      );

      ctx.stroke();

    }


    ctx.restore();


    /* Hit flash */

    if (this.hitCooldown > 0) {

      ctx.fillStyle =
        "rgba(255,255,255,0.7)";

      ctx.fillRect(
        this.x,
        this.y,
        this.width,
        this.height
      );

    }

  }

}


/* =====================================================
   CREATE FIGHTERS
===================================================== */

const player = new Fighter({

  name: "AURA",

  x: 180,

  color: "#2563eb",

  hair: "#22d3ee",

  facing: 1

});


const enemy = new Fighter({

  name: "VEX",

  x: 760,

  color: "#be185d",

  hair: "#f43f5e",

  facing: -1

});


/* =====================================================
   GAME START
===================================================== */

function resetGame() {

  player.reset(180);
  enemy.reset(760);

  player.facing = 1;
  enemy.facing = -1;

  timeLeft = 60;

  projectiles = [];
  particles = [];
  texts = [];

  updateHUD();

}


function startGame() {

  resetGame();

  running = true;

  messageScreen.classList.add("hidden");

  clearInterval(timerInterval);

  timerInterval = setInterval(() => {

    if (!running) {
      return;
    }

    timeLeft--;

    updateHUD();

    if (timeLeft <= 0) {

      finishGame();

    }

  }, 1000);

}


startBtn.addEventListener(
  "click",
  startGame
);


restartBtn.addEventListener(
  "click",
  startGame
);


/* =====================================================
   PLAYER
===================================================== */

function updatePlayer() {

  if (player.stun > 0) {
    return;
  }


  player.blocking =
    keys["s"] === true;


  if (!player.blocking) {

    if (keys["a"]) {

      player.vx =
        -player.speed;

      player.facing = -1;

    }


    if (keys["d"]) {

      player.vx =
        player.speed;

      player.facing = 1;

    }

  }


  if (justPressed("w")) {

    player.jump();

  }


  if (justPressed("j")) {

    player.doAttack("punch");

  }


  if (justPressed("k")) {

    player.doAttack("kick");

  }


  if (justPressed("l")) {

    player.doAttack("blast");

  }


  if (justPressed("i")) {

    player.doAttack("special");

  }

}


/* =====================================================
   CPU
===================================================== */

function updateCPU() {

  if (enemy.stun > 0) {
    return;
  }


  const distance =
    player.x - enemy.x;

  const absolute =
    Math.abs(distance);


  enemy.facing =
    distance > 0
      ? 1
      : -1;


  if (absolute > 115) {

    enemy.vx =
      Math.sign(distance) *
      enemy.speed;

  } else {

    enemy.vx = 0;

  }


  enemy.aiTimer--;


  if (enemy.aiTimer <= 0) {

    enemy.aiTimer =
      20 +
      Math.random() * 35;


    if (absolute < 115) {

      const attack =
        Math.random();


      if (attack < 0.45) {

        enemy.doAttack("punch");

      } else if (attack < 0.8) {

        enemy.doAttack("kick");

      } else {

        enemy.doAttack("blast");

      }

    } else if (
      absolute < 550 &&
      enemy.energy >= 30 &&
      Math.random() < 0.4
    ) {

      enemy.doAttack("special");

    } else if (
      absolute < 600 &&
      enemy.energy >= 12
    ) {

      enemy.doAttack("blast");

    }

  }


  enemy.blocking =
    absolute < 150 &&
    Math.random() < 0.02;


  if (
    enemy.y + enemy.height >= GROUND &&
    Math.random() < 0.005
  ) {

    enemy.jump();

  }

}


/* =====================================================
   COLLISION
===================================================== */

function overlap(a, b) {

  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );

}


function meleeAttack(attacker, defender) {

  const box =
    attacker.attackBox();

  if (!box) {
    return;
  }


  const target = {

    x: defender.x,
    y: defender.y,

    width: defender.width,
    height: defender.height

  };


  if (!overlap(box, target)) {
    return;
  }


  /*
    Hit only once per attack.
  */

  if (attacker.hitCooldown > 0) {
    return;
  }


  attacker.hitCooldown = 12;


  let damage =
    attacker.attack === "punch"
      ? 7
      : 10;


  if (defender.blocking) {

    damage *= 0.25;

    showText(
      defender.x,
      defender.y - 10,
      "BLOCK",
      "#22d3ee"
    );

  } else {

    defender.stun = 9;

    defender.vx =
      attacker.facing * 5;

    defender.vy = -2;

    hitEffect(
      defender.x + defender.width / 2,
      defender.y + 40
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


/* =====================================================
   ENERGY BLAST
===================================================== */

function createBlast(owner, special) {

  projectiles.push({

    owner,

    x:
      owner.facing === 1
        ? owner.x + owner.width
        : owner.x,

    y:
      owner.y + 45,

    radius:
      special ? 24 : 11,

    speed:
      owner.facing *
      (special ? 7 : 9),

    damage:
      special ? 24 : 9,

    special,

    color:
      owner === player
        ? "#22d3ee"
        : "#f43f5e"

  });

}


function updateProjectiles() {

  for (
    let i = projectiles.length - 1;
    i >= 0;
    i--
  ) {

    const p =
      projectiles[i];


    p.x += p.speed;


    if (Math.random() < 0.6) {

      particles.push({

        x: p.x - p.speed * 0.5,

        y: p.y,

        vx: 0,

        vy: 0,

        life: 8,

        max: 8,

        size: p.radius * 0.6,

        color: p.color

      });

    }


    const target =
      p.owner === player
        ? enemy
        : player;


    const projectileBox = {

      x:
        p.x - p.radius,

      y:
        p.y - p.radius,

      width:
        p.radius * 2,

      height:
        p.radius * 2

    };


    const targetBox = {

      x: target.x,
      y: target.y,

      width: target.width,
      height: target.height

    };


    if (
      overlap(
        projectileBox,
        targetBox
      )
    ) {

      let damage =
        p.damage;


      if (target.blocking) {

        damage *= 0.25;

        showText(
          target.x,
          target.y - 10,
          "BLOCK",
          "#22d3ee"
        );

      } else {

        target.stun =
          p.special ? 18 : 8;

        target.vx =
          p.speed * 0.5;

        target.vy =
          p.special ? -5 : -2;

        hitEffect(
          p.x,
          p.y
        );

      }


      target.health =
        Math.max(
          0,
          target.health - damage
        );


      p.owner.energy =
        Math.min(
          100,
          p.owner.energy + 5
        );


      projectiles.splice(i, 1);

      continue;

    }


    if (
      p.x < -100 ||
      p.x > WIDTH + 100
    ) {

      projectiles.splice(i, 1);

    }

  }

}


function drawProjectiles() {

  projectiles.forEach(p => {

    const glow =
      ctx.createRadialGradient(
        p.x,
        p.y,
        2,
        p.x,
        p.y,
        p.radius * 2.5
      );


    glow.addColorStop(
      0,
      "#ffffff"
    );

    glow.addColorStop(
      0.3,
      p.color
    );

    glow.addColorStop(
      1,
      "rgba(255,255,255,0)"
    );


    ctx.fillStyle = glow;

    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y,
      p.radius * 2.5,
      0,
      Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle =
      p.color;

    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y,
      p.radius,
      0,
      Math.PI * 2
    );

    ctx.fill();

  });

}


/* =====================================================
   PARTICLES
===================================================== */

function hitEffect(x, y) {

  for (let i = 0; i < 20; i++) {

    const angle =
      Math.random() *
      Math.PI * 2;

    const speed =
      2 + Math.random() * 6;


    particles.push({

      x,
      y,

      vx:
        Math.cos(angle) *
        speed,

      vy:
        Math.sin(angle) *
        speed,

      life: 30,

      max: 30,

      size:
        2 + Math.random() * 5,

      color:
        Math.random() > 0.5
          ? "#ffffff"
          : "#facc15"

    });

  }

}


function dust(x, y) {

  for (let i = 0; i < 10; i++) {

    particles.push({

      x:
        x +
        (Math.random() - 0.5) *
        40,

      y,

      vx:
        (Math.random() - 0.5) *
        3,

      vy:
        -Math.random() * 2,

      life: 25,

      max: 25,

      size:
        2 + Math.random() * 5,

      color: "#94a3b8"

    });

  }

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

    p.vy += 0.04;

    p.life--;


    if (p.life <= 0) {

      particles.splice(i, 1);

    }

  }

}


function drawParticles() {

  particles.forEach(p => {

    ctx.globalAlpha =
      p.life / p.max;

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

    ctx.globalAlpha = 1;

  });

}


/* =====================================================
   FLOATING TEXT
===================================================== */

function showText(
  x,
  y,
  text,
  color
) {

  texts.push({

    x,
    y,
    text,
    color,

    life: 45

  });

}


function updateTexts() {

  for (
    let i = texts.length - 1;
    i >= 0;
    i--
  ) {

    texts[i].y -= 0.7;

    texts[i].life--;


    if (texts[i].life <= 0) {

      texts.splice(i, 1);

    }

  }

}


function drawTexts() {

  texts.forEach(t => {

    ctx.globalAlpha =
      t.life / 45;

    ctx.fillStyle =
      t.color;

    ctx.font =
      "bold 16px Arial";

    ctx.textAlign =
      "center";

    ctx.fillText(
      t.text,
      t.x,
      t.y
    );

    ctx.globalAlpha = 1;

  });

}


/* =====================================================
   BACKGROUND
===================================================== */

function drawBackground() {

  const sky =
    ctx.createLinearGradient(
      0,
      0,
      0,
      HEIGHT
    );


  sky.addColorStop(
    0,
    "#071326"
  );

  sky.addColorStop(
    0.65,
    "#142744"
  );

  sky.addColorStop(
    1,
    "#07110d"
  );


  ctx.fillStyle = sky;

  ctx.fillRect(
    0,
    0,
    WIDTH,
    HEIGHT
  );


  /* Moon */

  ctx.fillStyle =
    "rgba(255,255,255,0.9)";

  ctx.beginPath();

  ctx.arc(
    800,
    100,
    42,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /* Mountains */

  ctx.fillStyle =
    "#0a1528";

  ctx.beginPath();

  ctx.moveTo(0, 380);

  ctx.lineTo(150, 230);

  ctx.lineTo(280, 350);

  ctx.lineTo(430, 190);

  ctx.lineTo(600, 360);

  ctx.lineTo(760, 220);

  ctx.lineTo(1000, 370);

  ctx.lineTo(1000, 475);

  ctx.lineTo(0, 475);

  ctx.closePath();

  ctx.fill();


  /* Ground */

  const ground =
    ctx.createLinearGradient(
      0,
      GROUND,
      0,
      HEIGHT
    );


  ground.addColorStop(
    0,
    "#173025"
  );

  ground.addColorStop(
    1,
    "#050b09"
  );


  ctx.fillStyle = ground;

  ctx.fillRect(
    0,
    GROUND,
    WIDTH,
    HEIGHT - GROUND
  );


  ctx.strokeStyle =
    "rgba(34,211,238,0.3)";

  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.moveTo(
    0,
    GROUND
  );

  ctx.lineTo(
    WIDTH,
    GROUND
  );

  ctx.stroke();

}


/* =====================================================
   HUD
===================================================== */

function updateHUD() {

  playerHealth.style.width =
    `${Math.max(0, player.health)}%`;

  enemyHealth.style.width =
    `${Math.max(0, enemy.health)}%`;

  playerEnergy.style.width =
    `${Math.max(0, player.energy)}%`;

  enemyEnergy.style.width =
    `${Math.max(0, enemy.energy)}%`;

  timerElement.textContent =
    Math.max(0, timeLeft);

}


/* =====================================================
   MAIN UPDATE
===================================================== */

function update() {

  if (!running) {
    return;
  }


  updatePlayer();

  updateCPU();


  player.update();

  enemy.update();


  /*
    Face opponent.
  */

  if (
    Math.abs(player.x - enemy.x) < 400
  ) {

    player.facing =
      player.x < enemy.x
        ? 1
        : -1;

    enemy.facing =
      enemy.
