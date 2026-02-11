const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameStarted = false;
let gameOver = false;
let particles = [];

const player = {
    x: 400,
    y: 300,
    size: 15,
    speed: 5,
    health: 100,
    maxHealth: 100,
    ammo: 50,
    maxAmmo: 100,
    kills: 0,
    hue: 0
};

const director = {
    pool: 50,
    cooldown: 0,
    spawnTimer: 0,
    difficulty: 0.4,

    update() {
        if (this.cooldown > 0) {
            this.cooldown--;
            this.pool -= 0.5;
        } else {
            const performance = this.evaluatePlayer();
            if (performance === 'high') {
                this.pool += 0.5;
                this.difficulty = Math.min(2.5, this.difficulty + 0.003);
            } else if (performance === 'low') {
                this.pool -= 1.5;
                this.difficulty = Math.max(0.3, this.difficulty - 0.03);
            }
        }
        this.pool = Math.max(0, Math.min(100, this.pool));
        this.spawnTimer = Math.max(0, this.spawnTimer - 1);
    },

    evaluatePlayer() {
        if (player.health > 60 && player.ammo > 25) return 'high';
        if (player.health > 30) return 'medium';
        return 'low';
    },

    shouldSpawnWave() {
        if (this.pool >= 80 && this.spawnTimer <= 0) {
            this.pool -= 35;
            this.spawnTimer = 150;
            return true;
        }
        return false;
    },

    spawnHelp() {
        if (this.pool >= 20) {
            this.pool -= 20;
            this.cooldown = 60;
            return true;
        }
        return false;
    }
};

const enemies = [];
const bullets = [];
const pickups = [];
const keys = new Set();

let eventMessage = '';
let eventTimer = 0;

// Sistema de partículas
function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 30,
            maxLife: 30,
            color: color,
            size: Math.random() * 3 + 2
        });
    }
}

document.addEventListener('keydown', (e) => {
    keys.add(e.key.toLowerCase());
});

document.addEventListener('keyup', (e) => {
    keys.delete(e.key.toLowerCase());
});

canvas.addEventListener('click', (e) => {
    if (!gameStarted) {
        gameStarted = true;
        document.getElementById('instructions').style.display = 'none';
        return;
    }
    if (gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const targetX = e.clientX - rect.left;
    const targetY = e.clientY - rect.top;
    
    if (player.ammo > 0) {
        player.ammo--;
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        bullets.push({
            x: player.x,
            y: player.y,
            vx: (dx / dist) * 15,
            vy: (dy / dist) * 15,
            hue: Math.random() * 60 + 300 // Colores rosados/morados
        });
        createParticles(player.x, player.y, '#ffb5e8', 5);
    }
});

function spawnEnemy(x, y) {
    enemies.push({
        x: x,
        y: y,
        health: 30,
        speed: 1.2 * director.difficulty,
        size: 10,
        hue: Math.random() * 30 + 250
    });
}

function spawnEnemyRandom() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(side) {
        case 0: x = Math.random() * canvas.width; y = 0; break;
        case 1: x = Math.random() * canvas.width; y = canvas.height; break;
        case 2: x = 0; y = Math.random() * canvas.height; break;
        case 3: x = canvas.width; y = Math.random() * canvas.height; break;
    }
    
    spawnEnemy(x, y);
}

function spawnPickup(type) {
    pickups.push({
        x: 100 + Math.random() * (canvas.width - 200),
        y: 100 + Math.random() * (canvas.height - 200),
        type: type,
        size: 12,
        pulse: 0
    });
}

function showEvent(msg) {
    eventMessage = msg;
    eventTimer = 60;
    const elem = document.getElementById('eventMessage');
    elem.textContent = msg;
    elem.style.opacity = '1';
    setTimeout(() => {
        elem.style.opacity = '0';
    }, 2000);
}

function update() {
    if (!gameStarted || gameOver) return;

    player.hue = (player.hue + 1) % 360;

    // Movimiento
    if (keys.has('w')) player.y = Math.max(player.size, player.y - player.speed);
    if (keys.has('s')) player.y = Math.min(canvas.height - player.size, player.y + player.speed);
    if (keys.has('a')) player.x = Math.max(player.size, player.x - player.speed);
    if (keys.has('d')) player.x = Math.min(canvas.width - player.size, player.x + player.speed);

    director.update();

    if (director.shouldSpawnWave()) {
        const count = Math.floor(3 + 2 * director.difficulty);
        for (let i = 0; i < count; i++) {
            spawnEnemyRandom();
        }
        showEvent(`✨ ¡Oleada de zombies! (${count} desafíos) ✨`);
    }

    if (Math.random() < 0.01 * director.difficulty) {
        spawnEnemyRandom();
    }

    if ((player.health < 30 || player.ammo < 15) && director.spawnHelp()) {
        const type = player.health < player.ammo ? 'health' : 'ammo';
        spawnPickup(type);
        showEvent(type === 'health' ? '💕 ¡Kit de recuperción!' : '✨ ¡Energía aumentada!');
    }

    // Enemigos
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        enemy.x += (dx / dist) * enemy.speed;
        enemy.y += (dy / dist) * enemy.speed;

        if (dist < player.size + enemy.size) {
            player.health -= 1;
            createParticles(player.x, player.y, '#ff6b9d', 8);
            if (player.health <= 0) {
                endGame();
            }
        }
    }

    // Balas
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        if (bullet.x < 0 || bullet.x > canvas.width || 
            bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(i, 1);
            continue;
        }

        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < enemy.size + 3) {
                enemy.health -= 20;
                bullets.splice(i, 1);
                createParticles(enemy.x, enemy.y, `hsl(${enemy.hue}, 70%, 60%)`, 12);
                
                if (enemy.health <= 0) {
                    enemies.splice(j, 1);
                    player.kills++;
                    createParticles(enemy.x, enemy.y, '#ffd700', 20);
                }
                break;
            }
        }
    }

    // Pickups
    for (let i = pickups.length - 1; i >= 0; i--) {
        const pickup = pickups[i];
        pickup.pulse = (pickup.pulse + 0.1) % (Math.PI * 2);
        
        const dx = player.x - pickup.x;
        const dy = player.y - pickup.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < player.size + pickup.size) {
            if (pickup.type === 'health') {
                player.health = Math.min(player.maxHealth, player.health + 30);
                createParticles(pickup.x, pickup.y, '#ff6b9d', 20);
            } else {
                player.ammo = Math.min(player.maxAmmo, player.ammo + 20);
                createParticles(pickup.x, pickup.y, '#ffd93d', 20);
            }
            pickups.splice(i, 1);
        }
    }

    // Partículas
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    updateUI();
}

function draw() {
    // Fondo gradiente suave
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#FDECEF');
    gradient.addColorStop(0.5, '#FADADD');
    gradient.addColorStop(1, '#FFD1DC');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Partículas
    particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Jugador
    const playerGradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.size);
    playerGradient.addColorStop(0, '#fff');
    playerGradient.addColorStop(0.5, `hsl(${player.hue + 320}, 100%, 75%)`);
    playerGradient.addColorStop(1, `hsl(${player.hue + 340}, 80%, 65%)`);
    
    ctx.fillStyle = playerGradient;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff6b9d';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    /*cuadirtos*/
    enemies.forEach(enemy => {
        const enemyGradient = ctx.createRadialGradient(enemy.x, enemy.y, 0, enemy.x, enemy.y, enemy.size);
        enemyGradient.addColorStop(0, `hsl(${enemy.hue}, 70%, 75%)`);
        enemyGradient.addColorStop(1, `hsl(${enemy.hue}, 60%, 55%)`);
        
        ctx.fillStyle = enemyGradient;
        ctx.strokeStyle = `hsl(${enemy.hue}, 50%, 40%)`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsl(${enemy.hue}, 70%, 60%)`;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
    });

    /*balas*/
    bullets.forEach(bullet => {
        ctx.fillStyle = `hsl(${bullet.hue}, 100%, 70%)`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `hsl(${bullet.hue}, 100%, 70%)`;
        
        const size = 6;
        ctx.beginPath();
        ctx.arc(bullet.x - size/2, bullet.y - size/2, size/2, Math.PI, 0);
        ctx.arc(bullet.x + size/2, bullet.y - size/2, size/2, Math.PI, 0);
        ctx.lineTo(bullet.x + size, bullet.y);
        ctx.lineTo(bullet.x, bullet.y + size);
        ctx.lineTo(bullet.x - size, bullet.y);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    pickups.forEach(pickup => {
        const pulseSize = Math.sin(pickup.pulse) * 3;
        const size = pickup.size + pulseSize;
        
        const pickupGradient = ctx.createRadialGradient(pickup.x, pickup.y, 0, pickup.x, pickup.y, size);
        if (pickup.type === 'health') {
            pickupGradient.addColorStop(0, '#ffb5e8');
            pickupGradient.addColorStop(1, '#ff6b9d');
        } else {
            pickupGradient.addColorStop(0, '#fff9b0');
            pickupGradient.addColorStop(1, '#ffd93d');
        }
        
        ctx.fillStyle = pickupGradient;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = pickup.type === 'health' ? '#ff6b9d' : '#ffd93d';
        
        /*no mover pq se rompe todo*/
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const x = pickup.x + Math.cos(angle) * size;
            const y = pickup.y + Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
    });
}

function updateUI() {
    document.getElementById('healthValue').textContent = Math.max(0, Math.floor(player.health));
    document.getElementById('ammoValue').textContent = player.ammo;
    document.getElementById('poolValue').textContent = Math.floor(director.pool);
    document.getElementById('poolBar').style.width = director.pool + '%';
    document.getElementById('killsValue').textContent = player.kills;
    document.getElementById('diffValue').textContent = director.difficulty.toFixed(1);
}

function endGame() {
    gameOver = true;
    document.getElementById('gameOver').style.display = 'block';
    document.getElementById('finalScore').textContent = `💫 ${player.kills} Victorias 💫`;
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();