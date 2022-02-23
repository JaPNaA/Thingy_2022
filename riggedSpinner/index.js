const canvas = document.createElement("canvas");
const X = canvas.getContext("2d");
const TAU = Math.PI * 2;
let then = performance.now();
let width = innerWidth;
let height = innerHeight;

canvas.width = width
canvas.height = height;

document.body.appendChild(canvas);

addEventListener("resize", () => {
    canvas.width = width = innerWidth;
    canvas.height = height = innerHeight;
});

class RotationPhysics {
    constructor() {
        this.initialRotation = 0;
        this.initialAngularVelocity = 0;
        this.frictionalAcceleration = 0.2;
        this.fixedFrictionalAcceleration = 0.2;
        this.time = 0;
        this.maxTime = 0;
        this.fixedMaxTime = 0;
    }

    /**
     * @param {number} rotation 
     * @param {number} velocity 
     * @param {number} targetRotation
     */
    setState(rotation, velocity, targetRotation) {
        this.initialRotation = rotation;
        this.initialAngularVelocity = velocity;
        this.maxTime = Math.abs(this.initialAngularVelocity / this.frictionalAcceleration);
        if (this.initialAngularVelocity * this.frictionalAcceleration > 0) {
            this.frictionalAcceleration *= -1;
        }
        this.time = 0;

        if (Math.abs(velocity) > 0.7) {
            this._fixFrictionToTarget(targetRotation);
        } else {
            this.fixedFrictionalAcceleration = this.frictionalAcceleration;
            this.fixedMaxTime = this.maxTime;
        }
    }

    /**
     * @param {number} targetRotation 
     */
    _fixFrictionToTarget(targetRotation) {
        const originalFinalPosition = this.initialRotation +
            this.maxTime * this.initialAngularVelocity +
            this.frictionalAcceleration * this.maxTime * this.maxTime / 2;

        const deltaFinal = targetRotation - originalFinalPosition % 1;
        const closestRotationTarget = originalFinalPosition + deltaFinal;

        this.fixedFrictionalAcceleration = -this.initialAngularVelocity * this.initialAngularVelocity / (2 * (closestRotationTarget - this.initialRotation));
        this.fixedMaxTime = Math.abs(this.initialAngularVelocity / this.fixedFrictionalAcceleration);
    }

    /**
     * @param {number} deltaTime 
     */
    advanceRotation(deltaTime) {
        this.time += deltaTime;
        this.time = Math.min(this.time, this.fixedMaxTime);
        return this.initialRotation +
            this.time * this.initialAngularVelocity +
            this.fixedFrictionalAcceleration * this.time * this.time / 2;
    }
}

class Spinner {
    constructor() {
        /** @type {SpinnerItem[]} */
        this.items = [];
        this.rotation = 0;
        this.physics = new RotationPhysics();
        this.lastDragVelocity = 0;
    }

    /**
     * @param {number} deltaTime 
     */
    render(deltaTime) {
        if (!this.disablePhysics) {
            this.rotation = this.physics.advanceRotation(deltaTime);
        }

        this.rotation %= 1;
        if (this.rotation < 0) {
            this.rotation += 1;
        }

        const centerX = innerWidth / 2;
        const centerY = innerHeight / 2;
        const radius = Math.min(innerWidth, innerHeight) / 2 - 16;

        let totalChance = 0;
        for (const item of this.items) {
            totalChance += item.chance;
        }

        let currPercent = 0;

        X.save();
        X.translate(centerX, centerY);
        X.rotate(-this.rotation * TAU - TAU / 4);

        X.fillStyle = "#f00";
        X.strokeStyle = "#000";
        X.textBaseline = "middle";
        X.textAlign = "right";

        for (const item of this.items) {
            const percent = item.chance / totalChance;

            X.beginPath();
            X.moveTo(0, 0);
            X.arc(0, 0, radius, 0, percent * TAU);

            const inness = this.rotation - currPercent;
            if (inness >= 0 && inness < percent) {
                X.fillStyle = "#fcc";
                X.fill();
                X.stroke();
            } else {
                X.stroke();
            }

            X.rotate(percent * TAU / 2);
            X.fillStyle = "#000";
            X.fillText(item.item, radius * 3 / 4, 0);

            X.rotate(percent * TAU / 2);
            currPercent += percent;
        }

        X.restore();
    }

    /**
     * @param {number} fromX 
     * @param {number} fromY 
     * @param {number} toX 
     * @param {number} toY 
     */
    mouseDrag(fromX, fromY, toX, toY) {
        const centerX = innerWidth / 2;
        const centerY = innerHeight / 2;

        const fromDx = fromX - centerX;
        const fromDy = fromY - centerY;
        const fromAng = Math.atan2(fromDy, fromDx);

        const toDx = toX - centerX;
        const toDy = toY - centerY;
        const toAng = Math.atan2(toDy, toDx);

        let dAng = toAng - fromAng;
        if (Math.abs(dAng) > TAU / 2) {
            dAng -= Math.sign(dAng) * TAU;
        }

        this.rotation -= dAng / TAU;
        this.lastDragVelocity = -dAng / TAU;
    }

    mouseDown() {
        this.lastDragVelocity = 0;
        this.disablePhysics = true;
    }

    mouseRelease() {
        this.disablePhysics = false;
        this.physics.setState(
            this.rotation,
            Math.sign(this.lastDragVelocity) * Math.sqrt(Math.abs(this.lastDragVelocity * 30)),
            0.005
        );
    }
}

class SpinnerItem {
    /**
     * @param {string} item 
     * @param {number} chance 
     */
    constructor(item, chance) {
        this.item = item;
        this.chance = chance;
    }
}

let lastMouseX = 0;
let lastMouseY = 0;
let dragging = false;

addEventListener("mousedown", ev => {
    dragging = true;
    lastMouseX = ev.clientX;
    lastMouseY = ev.clientY;
    spinner.mouseDown();
});
addEventListener("mouseup", () => {
    dragging = false;
    spinner.mouseRelease();
});

addEventListener("mousemove", ev => {
    if (dragging) {
        spinner.mouseDrag(lastMouseX, lastMouseY, ev.clientX, ev.clientY);
    }

    lastMouseX = ev.clientX;
    lastMouseY = ev.clientY;
});

const spinner = new Spinner();
// spinner.items.push(new SpinnerItem("Pass", 1));
// spinner.items.push(new SpinnerItem("Fail", 99));

for (let i = 0; i < 20; i++) {
    spinner.items.push(new SpinnerItem("Test" + i, Math.random() * 3 + 1));
}
// for (let i = 0; i < 100; i++) {
//     spinner.items.push(new SpinnerItem("Test" + i, 1));
// }

/**
 * requestAnimationFrame handler
 * @param {number} now
 */
function reqanf(now) {
    const deltaTime = (now - then) / 1000;
    then = now;

    X.clearRect(0, 0, width, height);
    spinner.render(deltaTime);

    requestAnimationFrame(reqanf);
}

requestAnimationFrame(reqanf);
