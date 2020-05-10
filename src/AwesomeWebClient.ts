import { AwesomeWebSocketMessageFromClient, AwesomeWebSocketMessageFromServer } from './AwesomeMessageType';

type WebSocketListener = (messageFromServer: AwesomeWebSocketMessageFromServer) => void;

export class AwesomeWebSocketConnection {
    private ws: WebSocket;
    private queuedMessages: AwesomeWebSocketMessageFromClient[];
    private listeners: Map<string, Set<WebSocketListener>>;

    constructor() {
        const host = location.origin.replace(/^http/, 'ws');
        this.ws = new WebSocket(host);

        this.ws.onmessage = this.handleMessage.bind(this);
        this.ws.onopen = this.handleConnectionOpen.bind(this);

        this.queuedMessages = [];
        this.listeners = new Map();
    }

    send(message: AwesomeWebSocketMessageFromClient) {
        if(this.ws.readyState !== 0) {
            this.ws.send(JSON.stringify(message));
        } else {
            this.queueMessage(message);
        }
    }

    sendCommand(message: AwesomeWebSocketMessageFromClient) {
        const promise = new Promise<AwesomeWebSocketMessageFromServer>((resolve) => {
            const listener = (messageFromServer: any) => {
                resolve(messageFromServer);
                this.removeListener(message.type, listener);
            };
            this.addListener(message.type, listener);
            this.send(message);
        });
        return promise;
    }

    addListener(msgType: string, cb: WebSocketListener) {
        const currentListeners = this.listeners.get(msgType);
        if(currentListeners) {
            this.listeners.set(msgType, currentListeners.add(cb));
        } else {
            this.listeners.set(msgType, new Set([cb]));
        }
    }

    removeListener(msgType: string, cb: WebSocketListener) {
        const listeners = this.listeners.get(msgType);
        listeners.delete(cb);
    }

    private handleConnectionOpen() {
        this.flushQueuedMessages();
    }

    private handleMessage(messageEvent: MessageEvent) {
        try {
            const message = (JSON.parse(messageEvent.data)) as AwesomeWebSocketMessageFromServer;
            const listeners = this.listeners.get(message.type);
            if(listeners) {
                listeners.forEach((listener) => {
                    listener(message);
                });
            }
        } catch(err) {
            console.error(`Maybe received invalid JSON message from server: ${messageEvent.data}`);
            console.error(err);
        }
    }

    private queueMessage(message: AwesomeWebSocketMessageFromClient) {
        this.queuedMessages.push(message);
    }

    private flushQueuedMessages() {
        while(this.queuedMessages.length) {
            const queuedMessage = this.queuedMessages.pop();
            this.send(queuedMessage);
        }
    }
}