import * as fs from 'fs';
import * as path from 'path';
import * as WebSocket from 'ws';
import * as http from 'http';
import * as mustache from 'mustache';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import  { AwesomeWebSocketMessageFromServer, AwesomeWebSocketMessageFromClient } from './AwesomeMessageType';
import { RequestHandler } from 'express';

const app = express();
const port = 8080;
export type WebSocketServer = WebSocket.Server;

export interface Route {
    path: string;
    cb: (req: express.Request, res: express.Response) => string;
    httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
}

export interface AwesomeWebServerOptions {
    mustacheConfig?: {
        data: any;
        viewDir: string;
    },
    additionalStaticDirs?: string[],
    routes?: Route[],
}

export interface AwesomeServerInterface {
    handleMessage?(ws: AwesomeWebSocket, message: AwesomeWebSocketMessageFromClient): void;
    handleConnection?(ws: AwesomeWebSocket): void;
}

export interface AwesomeServer {
    new (wss: AwesomeWebSocketServer): AwesomeServerInterface;
}

export class AwesomeWebSocket {
    static id = 0;
    private queuedMessages: AwesomeWebSocketMessageFromServer[] = []
    public id: string;

    constructor(private ws: WebSocket) {
        this.id = String(AwesomeWebSocket.id++);
    }

    send(message: AwesomeWebSocketMessageFromServer) {
        if(this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(message);
        } else {
            this.queueMessage(message);
            this.ws.onopen = this.flushQueuedMessages.bind(this);
        } 
    }

    private queueMessage(message: AwesomeWebSocketMessageFromServer) {
        this.queuedMessages.push(message);
    }

    private flushQueuedMessages() {
        this.ws.onopen = null;
        while(this.queuedMessages.length) {
            const queuedMessage = this.queuedMessages.pop();
            this.send(queuedMessage);
        }
    }
}

export class AwesomeWebSocketServer {
    private webSockets: AwesomeWebSocket[];
    getClients() {
        return this.webSockets;
    }
    addClient(ws: AwesomeWebSocket) {
        this.webSockets.push(ws);
    }
}

export class AwesomeWebServer {
    private webSocketCounterId: number = 0;
    private webSockets: WebSocket[];
    private messageId: number = 0;
    private wss: WebSocket.Server;
    private awesomeWebSocketServer = new AwesomeWebSocketServer();
    private registeredServers: Set<AwesomeServerInterface>;

    constructor(publicDir: string, options: AwesomeWebServerOptions = {}) {
        if(options.mustacheConfig) {
            const {data, viewDir} = options.mustacheConfig;
            app.engine('html', function (filePath, options, cb) { 
                fs.readFile(filePath, (err, content) => {
                    if(err) return cb(err, null);
                    const rendered = mustache.render(content.toString(), data);
                    return cb(null, rendered);
                });
            });
            
            // Setting mustachejs as view engine
            app.set('views', viewDir);
            app.set('view engine','html');
            
            app.get('/', (req, res) => {
                res.render('index', {
                    data,
                });
            });
            app.use(bodyParser.urlencoded( {extended : true} ) );
        } else {
            app.get('/', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
        }

        app.use(express.static(publicDir));
        if(options.additionalStaticDirs) {
            for(const staticDir of options.additionalStaticDirs) {
                app.use(express.static(staticDir));
            }
        }

        if(options.routes) {
            for(const route of options.routes) {
                if(route.httpMethod === 'POST') {
                    app.post(route.path, route.cb);
                } else if(route.httpMethod === 'GET') {
                    app.get(route.path, route.cb);
                } else if(route.httpMethod === 'PUT') {
                    app.put(route.path, route.cb);
                } else if(route.httpMethod === 'DELETE') {
                    app.delete(route.path, route.cb);
                }
            }
        }

        app.get('*', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));

        const server = http.createServer(app);
        this.wss = new WebSocket.Server({server});
        this.registeredServers = new Set();
        this.wss.on('connection', (ws) => {
            console.log("Connection opened");
            const awesomeWebSocket = new AwesomeWebSocket(ws);
            this.awesomeWebSocketServer.addClient(awesomeWebSocket);
            this.registeredServers.forEach((registeredServer) => {
                if(registeredServer.handleConnection) {
                    registeredServer.handleConnection(awesomeWebSocket);
                }
            });
            ws.on('message', (jsonData: string) => {
                console.log(`[${this.messageId++}] Got data`, jsonData);
                const data = (JSON.parse(jsonData) as AwesomeWebSocketMessageFromClient);
                this.registeredServers.forEach((registeredServer) => {
                    if(registeredServer.handleMessage) {
                        registeredServer.handleMessage(awesomeWebSocket, data);
                    }
                });
            });
        });
        server.listen(process.env.PORT || port, () => console.log(`Example app listening at http://localhost:${port}`));
    }

    registerServer(ServerCtor: AwesomeServer) {
        const server = new ServerCtor(this.awesomeWebSocketServer);
        this.registeredServers.add(server);
    }
}