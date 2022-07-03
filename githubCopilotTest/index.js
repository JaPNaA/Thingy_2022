/** @type {HTMLCanvasElement} */ // @ts-ignore
const canvas = document.getElementById('canvas');
/** @type {CanvasRenderingContext2D} */// @ts-ignore
const X = canvas.getContext("2d");

const worldHeight = 100;
const worldWidth = 200;
let scale = 1;

let deltaTime = 0;
let lastTime = 0;

class World {
    constructor() {
        /** @type {Entity[]} */
        this.entities = [];
    }

    /** @param {Entity} entity */
    add(entity) {
        this.entities.push(entity);
    }

    removeEntitiesMarkedToBeRemoved() {
        for (const entity of this.entities) {
            if (entity.toBeRemoved) {
                this.entities.splice(this.entities.indexOf(entity), 1);
            }
        }
    }
}

class Entity {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     **/
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.toBeRemoved = false;
    }

    draw() { }
    tick() { }
    remove() {
        this.toBeRemoved = true;
    }
}

class Bird extends Entity {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     **/
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.vy = 0;
    }

    draw() {
        X.fillStyle = "red";
        X.fillRect(this.x, this.y, this.width, this.height);
    }

    tick() {
        this.y += this.vy;
        this.vy += 0.01 * deltaTime;
    }
}

class Pipe extends Entity {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {number} gapY
     **/
    constructor(x, y, width, height, gapY) {
        super(x, y, width, height);
        this.gapY = gapY;
    }

    draw() {
        X.fillStyle = "blue";
        X.fillRect(this.x, this.y, this.width, this.gapY);
        X.fillRect(this.x, this.y + this.gapY + Pipe.gap, this.width, this.height);
    }

    tick() {
        this.x -= deltaTime * Pipe.speed;

        if (this.x < -this.width) {
            this.remove();
        }
    }
}

Pipe.gap = 40;
Pipe.speed = 0.1;

class Rocket extends Entity {
    /**
     * @param {number} x
     * @param {number} y
     **/
    constructor(x, y) {
        super(x, y, 10, 10);
        this.vy = 0;
    }

    draw() {
        X.fillStyle = "yellow";
        X.fillRect(this.x, this.y, this.width, this.height);
    }

    tick() {
        this.x -= deltaTime * Rocket.speed;

        if (this.x < -this.width) {
            this.remove();
        }
    }
}

Rocket.speed = 0.2;

class PipeGenerator extends Entity {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     **/
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.pipeGenerateCooldown = 0;
    }

    tick() {
        this.pipeGenerateCooldown -= deltaTime;
        if (this.pipeGenerateCooldown <= 0) {
            this.pipeGenerateCooldown = PipeGenerator.pipeGenerateCooldown;
            this.generate();
        }
    }

    draw() { }

    generate() {
        world.add(new Pipe(
            this.x,
            this.y,
            this.width,
            this.height,
            Math.random() * (this.height - Pipe.gap)
        ));
    }
}

PipeGenerator.pipeGenerateCooldown = 1000;

class RocketGenerator extends Entity {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     **/
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.rocketGenerateCooldown = 0;
    }

    tick() {
        this.rocketGenerateCooldown -= deltaTime;
        if (this.rocketGenerateCooldown <= 0) {
            this.rocketGenerateCooldown = RocketGenerator.rocketGenerateCooldown;
            this.generate();
        }
    }

    draw() { }

    generate() {
        world.add(new Rocket(
            this.x,
            this.y + this.height * Math.random()
        ));
    }
}

RocketGenerator.rocketGenerateCooldown = 1700;


const world = new World();
const bird = new Bird(10, worldHeight / 2, 10, 10);

world.add(bird);
world.add(new PipeGenerator(worldWidth, 0, 10, worldHeight));
world.add(new RocketGenerator(worldWidth, 0, 10, worldHeight));

/**
 * @param {number} now 
 */
function requanf(now) {
    deltaTime = now - lastTime;
    lastTime = now;

    X.resetTransform();
    X.scale(scale, scale);

    X.clearRect(0, 0, canvas.width, canvas.height);
    X.fillStyle = "#0002";
    X.fillRect(0, 0, worldWidth, worldHeight);

    for (const object of world.entities) {
        object.tick();
        object.draw();
    }

    doCollisionDetection();

    world.removeEntitiesMarkedToBeRemoved();

    requestAnimationFrame(now => requanf(now));
}

requanf(0);

function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // update scale
    scale = Math.min(window.innerWidth / worldWidth, window.innerHeight / worldHeight);
}

addEventListener("resize", onResize);
onResize();

// move bird up if space is pressed
addEventListener("keydown", event => {
    if (event.key === " ") {
        bird.vy = -2;
    }
});

// do collision detection
function doCollisionDetection() {
    for (const object of world.entities) {
        if (object instanceof Pipe) {
            if (bird.x + bird.width > object.x && bird.x < object.x + object.width) {
                if (bird.y + bird.height > object.y && bird.y < object.y + object.gapY) {
                    console.log("collision");
                    bird.remove();
                }
                if (bird.y + bird.height > object.y + object.gapY + Pipe.gap && bird.y < object.y + object.gapY + Pipe.gap + object.height) {
                    console.log("collision");
                    bird.remove();
                }
            }
        }

        if (object instanceof Rocket) {
            if (bird.x + bird.width > object.x && bird.x < object.x + object.width) {
                if (bird.y + bird.height > object.y && bird.y < object.y + object.height) {
                    console.log("collision");
                    bird.remove();
                }
            }
        }
    }
}
