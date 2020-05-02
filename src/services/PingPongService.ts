import { AwesomeWebSocket, WebSocketServer } from "../AwesomeWebServer";
import { AwesomeWebSocketMessageFromClient } from "../AwesomeMessageType";

export enum PingPongMessageType {
    PING = 'PING',
    PONG = 'PONG',
}

export class PingPongService {
    private wss: WebSocketServer;

    constructor(wss: WebSocketServer) {
        this.wss = wss;
    }
    handleMessage(ws: AwesomeWebSocket, message: AwesomeWebSocketMessageFromClient) {
        if(message.type === PingPongMessageType.PING) {
            ws.send({type: 'PONG', wsOriginId: ws.id});
        }
    }
}