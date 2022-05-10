import { WebSocketServer } from 'ws';
import express from "express";
import { TextFromDiffs } from './shared/TextFromDiffs';

const expressApp = express();
expressApp.use(express.static("../client/"));


const server = expressApp.listen(8080);
const wsServer = new WebSocketServer({ server: server });

wsServer.on('connection', function (ws) {
    ws.on('message', function (data) {
        console.log('received: %s', data);
        parseMessage(data.toString('utf8'));
    });
});

const currentText = new TextFromDiffs();

function parseMessage(message: string) {
    const commandSplitIndex = message.indexOf(":");
    const command = commandSplitIndex < 0 ? message : message.slice(0, commandSplitIndex);
    const dataText = commandSplitIndex < 0 ? "" : message.slice(commandSplitIndex + 1);

    switch (command) {
        case "edit": {
            currentText.applyDiff(JSON.parse(dataText));
            break;
        }

        case "clear":
            currentText.clear();
            break;
    }

    console.log(currentText);
}