export interface AwesomeWebSocketMessage {
    type: string;
    data?: any;
}

export interface AwesomeWebSocketMessageFromServer extends AwesomeWebSocketMessage {
    wsOriginId: string; // The peer ID that sent the message
}

export interface AwesomeWebSocketMessageFromClient extends AwesomeWebSocketMessage {
    peerId?: string // Defaults to all
}