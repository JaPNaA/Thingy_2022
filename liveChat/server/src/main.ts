import { createServer } from 'https';
import { WebSocketServer } from 'ws';
import express from "express";

const expressApp = express();
expressApp.use(express.static("../client/"));


const server = expressApp.listen(8080);
const wsServer = new WebSocketServer({ server: server });

wsServer.on('connection', function connection(ws) {
    ws.on('message', function message(data) {
        console.log('received: %s', data);
    });

    ws.send('something');
});
