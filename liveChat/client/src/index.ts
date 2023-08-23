import { diffStrings } from "./diffStrings.js";
import { Elm } from "./elements.js";
import { TextDiff, TextFromDiffs } from "./shared/TextFromDiffs.js";
import { splitCommandStr } from "./shared/utils.js";

const websocket = new WebSocket(location.origin.replace("http", "ws"));
const textFromDiffs = new TextFromDiffs();

websocket.addEventListener("open", function () {
    websocket.send("clear");
});

websocket.addEventListener("message", function (event) {
    const [command, data] = splitCommandStr(event.data as string);
    switch (command) {
        case "edit":
            textFromDiffs.setText(input.innerText);
            textFromDiffs.applyDiff(JSON.parse(data));
            input.innerText = textFromDiffs.getText();
            break;
        case "send":
            new Elm().class("message").append(data).appendTo(messages);
            break;
    }
});

const input: HTMLElement = document.getElementById("input")!;
const messages: HTMLElement = document.getElementById("messages")!;

input.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
        websocket.send("send:" + input.innerText);
        new Elm().class("message", "self").append(input.innerText).appendTo(messages);

        event.preventDefault();
        input.innerText = "";
    }
});

let lastTextareaValue = input.innerText;
input.addEventListener("input", function (event) {
    const newValue = input.innerText;
    const diff = diffStrings(lastTextareaValue, newValue);
    lastTextareaValue = newValue;

    if (diff) {
        websocket.send("edit:" + JSON.stringify(diff));
    }
});
