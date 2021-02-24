const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const explosion = {
    multiplier: 8,
    variations: 6,
    colors: ['#6434E9', '#2C7CE5', '#49CC5C', '#F8C421', '#FB6640', '#F82553']
};

const explosions = {
    array: [],
    pool: [],
    create() {
        const exp = this.pool.length ? this.pool.pop() : new Explosion();

        this.array.push(exp);

        return exp;
    },
    update() {
        const { array } = this;

        for (let i = 0; i < array.length; ++i) {
            if (array[i].update()) continue; // break iteration if all particles are alive
            this.pool.push(array.splice(i--, 1)[0]); // send explosion to pool
        }
    }
};

const particles = {
    array: [],
    pool: [],
    init() {
        const { variations, colors } = explosion;

        for (let i = 0; i < variations; ++i) {
            this.array.push({ style: colors[i], indices: [] }); // initialize style bucket indices
        }
    },
    create(style) {
        const p = this.pool.length ? this.pool.pop() : new Particle();

        p.style = style;
        this.array[style].indices.push(p);
        
        return p;
    },
    draw() {
        for (const { style, indices } of this.array) {
            if (indices.length <= 0) continue; // break iteration if there are no particles of this style to render

            ctx.beginPath();
            ctx.fillStyle = style;

            for (let i = 0; i < indices.length; ++i) {
                const p = indices[i];

                if (p.dead) {
                    this.pool.push(indices.splice(i--, 1)[0]); // send particle to pool
                } else {
                    const r = p.radius;

                    if (r > 2) { // draw circle
                        ctx.moveTo(p.x, p.y);
                        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                    } else { // draw rectangle instead if particle is small enough
                        ctx.rect(p.x - r, p.y - r, r * 2, r * 2);
                    }
                }
            }

            ctx.fill();
        }
    }
};

class Explosion {
    constructor() {
        this.particles = [];
        this.size = 0;
        this.collided = true;
    }

    init(x, y) {
        const { variations, multiplier } = explosion;
        let idx = 0;

        for (let i = 0; i < variations; ++i) {
            for (let j = 0; j < multiplier; ++j) {
                (this.particles[idx++] = particles.create(i)).init(x, y);
            }
        }

        this.size = idx;
        this.collided = false;
    }

    update() { // utilize bubble sort to keep live particles grouped at the start of the array
        let head = 0;
        let tail = 0;
        const { particles, size } = this;

        while (head < size) {
            const p = particles[head];

            p.x -= p.vx;
            p.y -= p.vy;
            p.radius -= p.wither;

            if (p.radius < 0.5) { // particle is too small to see
                p.dead = true; // mark particle as ready to be pooled
                head += 1;
            } else {
                if (this.collided) {
                    p.collide();
                } else {
                    this.collided = p.collide();
                }

                if (tail < head) { // bubble dead particles up
                    const temp = particles[head];
                    particles[head] = particles[tail];
                    particles[tail] = temp;
                }

                head += 1;
                tail += 1;
            }
        }

        return (this.size = tail) > 0;
    }
}

class Particle {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.wither = 0;
        this.radius = 0;
        this.style = 0;
        this.dead = true;
    }

    init(x, y) {
        this.x = x;
        this.y = y;
        const direction = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 3.5;
        this.vx = Math.cos(direction) * velocity;
        this.vy = Math.sin(direction) * velocity;
        this.wither = Math.random() * 0.007 + 0.007;
        this.radius = 2 + Math.random() * 4;
        this.dead = false;
    }

    collide() {
        if (this.x > canvas.width || this.x < 0) {
            this.vx = -this.vx;

            return true;
        } else if (this.y > canvas.height || this.y < 0) {
            this.vy = -this.vy;

            return true;
        }

        return false;
    }
}

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    explosions.update();
    particles.draw();
    requestAnimationFrame(loop);
}

window.addEventListener('resize', resize, false);

canvas.addEventListener('mousedown', (e) => {
    const explosion = explosions.create();
    explosion.init(e.offsetX, e.offsetY);
}, false);

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

particles.init();
resize();
loop();