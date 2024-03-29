const paste = document.getElementById("paste");
const download = document.getElementById("download");

download.addEventListener("click", async function () {
    const images = paste.querySelectorAll("img");
    if (images.length > 1) {
        // download zip
        // @ts-ignore
        const zip = new JSZip();
        for (let i = 0; i < images.length; i++) {
            zip.file("img" + (i + 1) + ".png", await blobOfImage(images[i]));
        }
        const zipFile = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipFile, "images.zip");
    } else if (images.length === 1) {
        // downlaod one
        const image = images[0];
        downloadURL(image.src, "img.png");
    } else {
        alert("No images pasted");
    }
});

addEventListener("keydown", function () {
    // @ts-ignore
    if ([paste, download].includes(document.activeElement)) { return; }
    paste.focus();

    const range = document.createRange();
    range.selectNodeContents(paste);
    range.collapse(false);
    const selection = getSelection();
    if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
    }
});

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    downloadURL(url, filename);
    URL.revokeObjectURL(url);
}

function downloadURL(url, filename) {
    const anchor = document.createElement("a");
    anchor.download = filename || "img";
    anchor.href = url;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
}

const canvas = document.createElement("canvas");
const X = canvas.getContext("2d");

function blobOfImage(image) {
    return new Promise(res => {
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        X.clearRect(0, 0, image.naturalWidth, image.naturalHeight);
        X.drawImage(image, 0, 0);
        canvas.toBlob((blob) => {
            res(blob);
        });
    })
}
