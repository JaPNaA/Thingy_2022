import { TextFromDiffs } from "@shared/TextFromDiffs.js";

const websocket = new WebSocket(location.origin.replace("http", "ws"));
const textFromDiffs = new TextFromDiffs();

websocket.addEventListener("open", function () {
    websocket.send("clear");
});

websocket.addEventListener("message", function() {
    //
});

const textarea = document.querySelector("textarea")!;

let lastCursorSelectEnd = 0;
let lastCursorSelectStart = 0;
let lastTextLength = 0;

textarea.addEventListener("beforeinput", function (event) {
    lastCursorSelectEnd = textarea.selectionEnd;
    lastCursorSelectStart = textarea.selectionStart;
});

textarea.addEventListener("input", function (event) {
    const cursorPosition = textarea.selectionStart;
    let editData;

    if (lastCursorSelectEnd > lastCursorSelectStart) { // replacement
        editData = {
            position: lastCursorSelectStart,
            endPosition: lastCursorSelectEnd,
            text: textarea.value.slice(lastCursorSelectStart, cursorPosition)
        };        
    } else if (textarea.value.length > lastTextLength) { // insertion
        editData = {
            position: lastCursorSelectEnd,
            endPosition: lastCursorSelectStart,
            text: textarea.value.slice(lastCursorSelectEnd, cursorPosition)
        };
    } else { // deletion
        editData = {
            position: cursorPosition,
            endPosition: lastCursorSelectEnd,
            text: ""
        };
    }

    if (editData) {
        websocket.send("edit:" + JSON.stringify(editData));
    }

    lastCursorSelectEnd = cursorPosition;
    lastTextLength = textarea.value.length;
});
