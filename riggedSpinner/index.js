import { Component, Elm, InputElm } from "./elements.js";

const TAU = Math.PI * 2;
class SpinnerScreen extends Component {
    constructor() {
        super("spinnerScreen");
        this.spinnerCanvas = new SpinnerCanvas().appendTo(this.elm);
    }

    applyConfig(config) {
        this.spinnerCanvas.applyConfig(config);
    }
}

class SpinnerCanvas extends Component {
    constructor() {
        super("spinnerCanvas");
        this.canvas = document.createElement("canvas");
        this.X = this.canvas.getContext("2d");
        this.then = performance.now();

        this.elm.append(this.canvas);

        this.spinner = new Spinner();
    }

    appendTo(elm) {
        this.setup();
        return super.appendTo(elm);
    }

    applyConfig(config) {
        this.spinner.applyConfig(config);
    }

    setup() {
        this.width = innerWidth;
        this.height = innerHeight;

        addEventListener("resize", () => {
            this.canvas.width = this.width = innerWidth;
            this.canvas.height = this.height = innerHeight;
        });

        this.canvas.width = this.width;
        this.canvas.height = this.height;

        let lastMouseX = 0;
        let lastMouseY = 0;
        let dragging = false;

        this.canvas.addEventListener("mousedown", ev => {
            dragging = true;
            lastMouseX = ev.clientX;
            lastMouseY = ev.clientY;
            this.spinner.mouseDown();
        });
        addEventListener("mouseup", () => {
            if (dragging) {
                this.spinner.mouseRelease();
            }
            dragging = false;
        });

        addEventListener("mousemove", ev => {
            if (dragging) {
                this.spinner.mouseDrag(lastMouseX, lastMouseY, ev.clientX, ev.clientY);
            }

            lastMouseX = ev.clientX;
            lastMouseY = ev.clientY;
        });

        requestAnimationFrame(now => this.reqanf(now));
    }

    /**
     * @param {number} now 
     */
    reqanf(now) {
        const deltaTime = (now - this.then) / 1000;
        this.then = now;

        this.X.clearRect(0, 0, this.width, this.height);
        this.spinner.render(this.X, deltaTime);

        requestAnimationFrame(now => this.reqanf(now));
    }
}


class RotationPhysics {
    constructor() {
        this.initialRotation = 0;
        this.initialAngularVelocity = 0;
        this.frictionalAcceleration = 0.2;
        this.fixedFrictionalAcceleration = 0.2;
        this.time = 0;
        this.maxTime = 0;
        this.fixedMaxTime = 0;
        this.velocityThreshold = 0;
    }

    /**
     * @param {number} threshold 
     */
    setVelocityTreshold(threshold) {
        this.velocityThreshold = threshold;
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

        if (Math.abs(velocity) > this.velocityThreshold) {
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
        this.targetElementIndex = 0;
        this.physics = new RotationPhysics();
        this.lastDragVelocity = 0;
    }

    applyConfig(config) {
        this.targetElementIndex = config.target;
        this.items = config.spinnerItems;
        this.physics.velocityThreshold = config.velocityThreshold;
    }

    /**
     * @param {CanvasRenderingContext2D} X
     * @param {number} deltaTime 
     */
    render(X, deltaTime) {
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

        const totalChance = this._getWeightsTotal();

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
        const totalChance = this._getWeightsTotal();
        let targetRotation = 0;
        let size = 0;
        let i = 0;

        for (const item of this.items) {
            if (i == this.targetElementIndex) {
                size = item.chance / totalChance;
                break;
            }

            targetRotation += item.chance / totalChance;
            i++;
        }

        this.disablePhysics = false;
        this.physics.setState(
            this.rotation,
            Math.sign(this.lastDragVelocity) * Math.sqrt(Math.abs(this.lastDragVelocity * 30)),
            targetRotation + Math.random() * size
        );
    }

    _getWeightsTotal() {
        let totalChance = 0;
        for (const item of this.items) {
            totalChance += item.chance;
        }
        return totalChance;
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

class ConfigScreen extends Component {
    constructor() {
        super("configScreen");

        this.pannelOpen = false;

        this.elm.append(
            new Elm().class("openButton", "clickable").append("Config")
                .on("click", () => {
                    if (this.pannelOpen = !this.pannelOpen) {
                        this.panel.class("open");
                    } else {
                        this.panel.removeClass("open");
                    }
                }),

            this.panel = new Elm().class("pannel").append(
                new Elm("h1").append("Config"),

                new Elm("h2").append("Items"),
                new Elm().append("The items on the spinner. First input is title, second is size."),
                this.spinnerItemsInput = new SpinnerItemInputList(),

                new Elm("h2").append("Target"),
                new Elm().append("Which item number to (almost) always land on"),
                this.targetRotationInput = new InputElm().setType("number").setValue(1),

                new Elm("h2").append("Velocity Threshold"),
                new Elm().append("How fast does the spinner need to spin until rigging is applied. Rigging at low velocities may look unnatural."),
                this.velocityThresholdInput = new InputElm().setType("number").setValue(0.7),

                new Elm().append(
                    new Elm("button").class("bold").append("Apply").on("click", () => {
                        spinnerScreen.applyConfig(this.getConfig());
                    })
                )
            )
        );

        for (let i = 0; i < 5; i++) {
            this.spinnerItemsInput.addItem(new SpinnerItemInput("Item " + (i + 1), 1));
        }
    }

    getConfig() {
        return {
            // @ts-ignore
            target: parseFloat(this.targetRotationInput.getValue() - 1),
            spinnerItems: this.spinnerItemsInput.getItems(),
            // @ts-ignore
            velocityThreshold: parseFloat(this.velocityThresholdInput.getValue())
        }
    }
}

class SpinnerItemInput extends Component {
    /**
     * @param {string} [name] 
     * @param {number} [weight]
     */
    constructor(name, weight) {
        super("spinnerItemInput");
        this.elm.append(
            this.nameInput = new InputElm(),
            this.weightInput = new InputElm().setType("number")
        );
        if (name) {
            this.nameInput.setValue(name);
        }
        if (weight) {
            this.weightInput.setValue(weight);
        }
    }

    getItem() {
        // @ts-ignore
        return new SpinnerItem(this.nameInput.getValue(), parseFloat(this.weightInput.getValue()));
    }
}

class SpinnerItemInputList extends Component {
    constructor() {
        super("editableList");
        this.elm.append(
            this.itemsElm = new Elm("ol"),
            new Elm("button").append("Add item").on("click", () => {
                this.addItem(new SpinnerItemInput("Title", 1));
            })
        );
        this.items = [];
    }

    /**
     * @param {SpinnerItemInput} item 
     */
    addItem(item) {
        const listItemElm = new Elm("li").class("listItemElm").append(
            item, new Elm().append("remove").class("remove", "clickable").on("click", () => {
                this.items.splice(this.items.indexOf(item), 1);
                listItemElm.remove();
            })
        ).appendTo(this.itemsElm);
        this.items.push(item);
    }

    getItems() {
        const items = [];
        for (const item of this.items) {
            items.push(item.getItem());
        }
        return items;
    }
}

const spinnerScreen = new SpinnerScreen().appendTo(document.body);
spinnerScreen.applyConfig(new ConfigScreen().appendTo(document.body).getConfig());
