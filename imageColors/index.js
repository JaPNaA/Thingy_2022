/** @type {HTMLDivElement} */ // @ts-ignore
const imagePasteArea = document.getElementById("imagePaste");
/** @type {HTMLButtonElement} */ // @ts-ignore
const processButton = document.getElementById("processButton");
/** @type {HTMLInputElement} */ // @ts-ignore
const fileInput = document.getElementById("fileInput");
/** @type {HTMLCanvasElement} */ // @ts-ignore
const colorsSortedCanvas = document.getElementById("colorsSorted");

function sortByValue(r, g, b) {
    const [h, s, v] = rgbToHsv(r, g, b);
    return v * 100 + s / 10;
}

function sortByHue(r, g, b) {
    const [h, s, v] = rgbToHsv(r, g, b);
    return Math.round(h / 36) * 36 + Math.round(s * 10) / 100;
}

function sortBySaturation(r, g, b) {
    const [h, s, v] = rgbToHsv(r, g, b);
    return s * 100 + Math.round(h / 36) / 100;
}

function processImageAllMethods() {
    const titleHeight = 20;
    const padding = 8;

    const image = getImage();
    const X = colorsSortedCanvas.getContext("2d");
    if (!X) { throw new Error("Browser not supported"); }

    colorsSortedCanvas.width = image.width;
    colorsSortedCanvas.height = image.height;
    X.drawImage(image, 0, 0, image.width, image.height);

    const imageData = getImageData(X);

    colorsSortedCanvas.width = image.width * 3 + padding * 4;
    colorsSortedCanvas.height = image.height + titleHeight + padding;

    // hue / value
    processImage(imageData, X, sortByHue, sortByValue, 0, titleHeight + padding);
    // saturation / value
    processImage(imageData, X, sortBySaturation, sortByValue, image.width + padding * 2, titleHeight + padding);
    // saturation / hue
    processImage(imageData, X, sortBySaturation, sortByHue, image.width * 2 + padding * 4, titleHeight + padding);

    X.fillStyle = "#000";
    X.font = titleHeight + "px Arial";

    X.fillText("hue / value", 0, titleHeight - 2);
    X.fillText("saturation / value", image.width + padding * 2, titleHeight - 2);
    X.fillText("saturation / hue", image.width * 2 + padding * 4, titleHeight - 2);
}

/**
 * @param {ImageData} imageData
 * @param {CanvasRenderingContext2D} X
 * @param {(r: number, g: number, b: number) => number} sortMethod 
 * @param {((r: number, g: number, b: number) => number)} secondSortMethod
 * @param {number} x x position on canvas to put result
 * @param {number} y y position on canvas to put result
 */
function processImage(imageData, X, sortMethod, secondSortMethod, x, y) {
    /** @type {[number, number, number, number, number][]} */
    const pixels = [];
    for (let i = 0; i < imageData.data.length; i += 4) {
        const a = 1 - imageData.data[i + 3] / 255;
        const r = imageData.data[i] + 255 * a, g = imageData.data[i + 1] + 255 * a, b = imageData.data[i + 2] + 255 * a;
        pixels.push([sortMethod(r, g, b), secondSortMethod(r, g, b), r, g, b]);
    }

    for (let times = 0; times < 4; times++) {
        // sort rows by second sort method
        for (let i = 0; i < imageData.height; i++) {
            const row = pixels.slice(i * imageData.width, (i + 1) * imageData.width);
            row.sort((a, b) => (a[1] - b[1]));
            for (let j = 0; j < row.length; j++) {
                pixels[i * imageData.width + j] = row[j];
            }
        }

        // sort columns by first sort method
        for (let i = 0; i < imageData.width; i++) {
            const column = [];
            for (let j = 0; j < imageData.height; j++) {
                column.push(pixels[j * imageData.width + i]);
            }
            column.sort((a, b) => (a[0] - b[0]));
            for (let j = 0; j < column.length; j++) {
                pixels[j * imageData.width + i] = column[j];
            }
        }
    }

    for (let i = 0; i < imageData.data.length / 4; i++) {
        const r = pixels[i][2], g = pixels[i][3], b = pixels[i][4];
        imageData.data[i * 4] = r;
        imageData.data[i * 4 + 1] = g;
        imageData.data[i * 4 + 2] = b;
        imageData.data[i * 4 + 3] = 255;
    }

    X.putImageData(imageData, x, y);
}

function getImageData(context) {
    try {
        return context.getImageData(0, 0, context.canvas.width, context.canvas.height);
    } catch (e) {
        if (e.name === "SecurityError") {
            throw new Error([
                "Cannot access image.",
                "Try the following:",
                "1. paste the image into MS Paint or other photo manipulation program (Word might also work)",
                "2. copy the image in the program",
                "3. refresh this page",
                "4. paste the image again"
            ].join("\n"));
        }
    }
}

/**
 * Convert an RGB color to HSV
 * 
 * Modified from stackoverflow https://stackoverflow.com/a/54070620
 * 
 * @param {number} r256
 * @param {number} g256
 * @param {number} b256
 * @returns {[number, number, number]}
 */
function rgbToHsv(r256, g256, b256) {
    const r = r256 / 255, g = g256 / 255, b = b256 / 255;
    const v = Math.max(r, g, b), c = v - Math.min(r, g, b);
    const h = c && ((v == r) ? (g - b) / c : ((v == g) ? 2 + (b - r) / c : 4 + (r - g) / c));
    return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
}

/**
 * Convert an HSV color to RGB
 * 
 * Modified from stackoverflow https://stackoverflow.com/a/54024653
 * 
 * @param {number} h
 * @param {number} s
 * @param {number} v
 * @returns {[number, number, number]}
 */
function hsvToRgb(h, s, v) {
    const f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    return [f(5) * 255, f(3) * 255, f(1) * 255];
}

/**
 * Convert a pixel to a number
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {number}
 */
function pixelToNumber(r, g, b) {
    return r * 256 * 256 + g * 256 + b;
}

/**
 * Converts a number back to a pixel
 * @param {number} number
 * @returns {[number, number, number]}
 */
function numberToPixel(number) {
    const r = Math.floor(number / (256 * 256));
    const g = Math.floor(number / 256) % 256;
    const b = number % 256;
    return [r, g, b];
}

function getImage() {
    const image = imagePasteArea.querySelector("img");
    if (!image) {
        throw new Error("No image in imagePaste");
    }
    return image;
}

fileInput.addEventListener("change", function () {
    const files = fileInput.files;
    if (!files) {
        return;
    }
    const file = files[0];
    const reader = new FileReader();
    reader.addEventListener("load", () => {
        /** @type {string} */ // @ts-ignore
        const dataURL = reader.result;
        const image = document.createElement("img");
        image.src = dataURL;
        try {
            getImage();
            if (confirm("Replace current image?")) {
                imagePasteArea.innerHTML = "";
                imagePasteArea.appendChild(image);
            }
        } catch (err) {
            imagePasteArea.appendChild(image);
        }
    });
    reader.readAsDataURL(file);
});

processButton.addEventListener("click", function () {
    try {
        processImageAllMethods();
    } catch (e) {
        alert(e.message);
    }
});
