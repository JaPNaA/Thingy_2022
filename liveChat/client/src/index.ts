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
        case "send": {
            const [messageId, finalMessage] = splitCommandStr(data);
            const message = messagesMap.get(parseInt(messageId));
            if (message) {
                message.elm.replaceContents(finalMessage);
            }
            break;
        }
        case "newId":
            activeMessageId = parseInt(data);
            break;
        case "new": {
            const [id, text] = splitCommandStr(data);
            const elm = addMessage(text);
            messagesMap.set(parseInt(id), { text, elm });
            addInputIfNotActive();
            break;
        }
    }
});

function addMessage(message: string) {
    return new Elm().class("message").append(message).appendTo(messages);
}

function convertInputToMessage() {
    if (!input) { return; }
    input.removeClass("input");
    input.removeAttribute("contenteditable");
    input.class("message");
    input = null;
}

function addInputIfNotActive() {
    if (isActive) { return; }
    if (input) {
        input.remove();
    }
    input = createInput().appendTo(messages);
    input.getHTMLElement().focus();
}

let input: Elm<"div"> | null = createInput();

const messages: HTMLElement = document.getElementById("messages")!;
input.appendTo(messages);

let lastTextareaValue = "";

function createInput() {
    const input = new Elm("div")
        .class("input", "self")
        .attribute("contenteditable", "plaintext-only");

    input.on("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (!isActive) { return; }

            const inputElm = input.getHTMLElement();
            websocket.send(`send:${activeMessageId}:${inputElm.innerText}`);
            isActive = false;
            convertInputToMessage();
            addInputIfNotActive();
        }
    });

    input.on("input", function () {
        const inputElm = input.getHTMLElement();
        const newValue = inputElm.innerText;

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

    return input;
}