import { diffStrings } from "./diffStrings.js";
import { Elm } from "./elements.js";
import { textFromDiff } from "./shared/textDiffs.js";
import { splitCommandStr } from "./shared/utils.js";

const websocket = new WebSocket(location.origin.replace("http", "ws"));
const messagesMap: Map<number, { text: string, elm: Elm }> = new Map();
let activeMessageId: number | undefined;
let isActive = false;

websocket.addEventListener("message", function (event) {
    const [command, data] = splitCommandStr(event.data as string);
    switch (command) {
        case "edit": {
            const [id, jsonData] = splitCommandStr(data);
            const diff = JSON.parse(jsonData);
            const message = messagesMap.get(parseInt(id));
            if (!message) { break; }

            message.text = textFromDiff(message.text, diff);
            message.elm.replaceContents(message.text);
            break;
        }
        case "send":
            addMessage(data);
            break;
        case "newId":
            activeMessageId = parseInt(data);
            const elm = addMessageSelf(lastTextareaValue);
            messagesMap.set(parseInt(data), { text: lastTextareaValue, elm });
            break;
        case "new": {
            const [id, text] = splitCommandStr(data);
            const elm = addMessage(text);
            messagesMap.set(parseInt(id), { text, elm });
            break;
        }
    }
});

function addMessage(message: string) {
    return new Elm().class("message").append(message).appendTo(messages);
}

function addMessageSelf(message: string) {
    return addMessage(message).class("self");
}

const input: HTMLElement = document.getElementById("input")!;
const messages: HTMLElement = document.getElementById("messages")!;

input.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
        websocket.send("send:" + input.innerText);
        addMessageSelf(input.innerText);

        event.preventDefault();
        input.innerText = "";
    }
});

let lastTextareaValue = input.innerText;
input.addEventListener("input", function (event) {
    const newValue = input.innerText;

    if (isActive) {
        if (activeMessageId !== undefined) {
            const diff = diffStrings(lastTextareaValue, newValue);
            if (diff) { websocket.send("edit:" + activeMessageId + ":" + JSON.stringify(diff)); }
            lastTextareaValue = newValue;
        }
    } else if (newValue) {
        websocket.send("new:" + newValue);
        lastTextareaValue = newValue;
        isActive = true;
    }
});
