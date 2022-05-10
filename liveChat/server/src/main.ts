import { WebSocketServer } from 'ws';
import express from "express";
import { TextFromDiffs } from './shared/TextFromDiffs';
import { splitCommandStr } from './shared/utils';

const expressApp = express();
expressApp.use(express.static("../client/"));


const server = expressApp.listen(8080);
const wsServer = new WebSocketServer({ server: server });

wsServer.on('connection', function (thisClient) {
    thisClient.on('message', function (data) {
        const dataStr = data.toString('utf8');
        console.log('received:', dataStr);
        parseMessage(dataStr);

        for (const client of wsServer.clients) {
            if (client === thisClient) { continue; }
            client.send(dataStr);
        }
    });
});

const currentText = new TextFromDiffs();

function parseMessage(message: string) {
    const [command, dataText] = splitCommandStr(message);

    switch (command) {
        case "edit":
            currentText.applyDiff(JSON.parse(dataText));
            break;

        case "clear":
            currentText.clear();
            break;
    }

    console.log(currentText);
}