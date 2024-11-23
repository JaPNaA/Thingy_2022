import { WebSocketServer } from 'ws';
import express from "express";
import { splitCommandStr } from './shared/utils';

const expressApp = express();
expressApp.use(express.static("../client/"));

// const messagesMap: Map<number, string> = new Map();

const server = expressApp.listen(8080);
const wsServer = new WebSocketServer({ server: server });

wsServer.on('connection', function (thisClient) {
    thisClient.on('message', function (data) {
        const dataStr = data.toString('utf8');
        console.log('received:', dataStr);
        const response = parseMessage(dataStr);
        if (response) {
            const [returnMessage, forwardMessage] = response;

            if (returnMessage) { thisClient.send(returnMessage); }
            if (forwardMessage) {
                for (const client of wsServer.clients) {
                    if (client === thisClient) { continue; }
                    client.send(forwardMessage);
                }
            }
        }
    });
});

let currId = 0;

/**
 * Parse a message and returns a response.
 * @returns An array. The first element the message to back to the client.
 * The second element is the message to send to everyone else.
 */
function parseMessage(message: string): [string?, string?] | undefined {
    const [command, dataText] = splitCommandStr(message);

    switch (command) {
        case "edit":
            return [undefined, message];
        case "new":
            const newId = currId++;
            return ["newId:" + newId, "new:" + newId + ":" + dataText];

        case "clear":
        case "send":
            return [undefined, message];
    }
}