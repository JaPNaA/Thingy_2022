import { TextDiff, TextFromDiffs } from "./shared/TextFromDiffs.js";
import { splitCommandStr } from "./shared/utils.js";

const websocket = new WebSocket(location.origin.replace("http", "ws"));
const textFromDiffs = new TextFromDiffs();

websocket.addEventListener("open", function () {
    websocket.send("clear");
});

websocket.addEventListener("message", function (event) {
    const [command, data] = splitCommandStr(event.data as string);
    if (command === "edit") {
        textFromDiffs.setText(textarea.value);
        textFromDiffs.applyDiff(JSON.parse(data));
        textarea.value = textFromDiffs.getText();
    }
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
    const cursorSelectStart = textarea.selectionStart;
    const cursorSelectEnd = textarea.selectionEnd;
    let editData: TextDiff;

    if (lastCursorSelectEnd > lastCursorSelectStart) { // replacement
        editData = {
            start: lastCursorSelectStart,
            end: lastCursorSelectEnd,
            text: textarea.value.slice(lastCursorSelectStart, cursorSelectStart)
        };
    } else if (cursorSelectStart > lastCursorSelectStart) { // insertion
        editData = {
            start: lastCursorSelectEnd,
            end: lastCursorSelectStart,
            text: textarea.value.slice(lastCursorSelectEnd, cursorSelectStart)
        };
    } else { // deletion
        editData = {
            start: cursorSelectStart,
            end: lastCursorSelectEnd,
            text: ""
        };
    }

    if (editData) {
        websocket.send("edit:" + JSON.stringify(editData));
    }

    lastCursorSelectEnd = cursorSelectStart;
    lastTextLength = textarea.value.length;
});
