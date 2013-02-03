// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'WhiteBoad';

// Port where we'll run the websocket server
var webSocketsServerPort = 8888;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

/**
 * Global variables
 */
// latest 100 messages
var messagesHistory = [];
var linesHistory = [];
// list of currently connected clients (users)
var clients = [];

/**
 * Helper function for escaping input strings
 */
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
/**
 * HTTP server
 */
var server = http.createServer(function (request, response) {
    // Not important for us. We're writing WebSocket server, not HTTP server
});
server.listen(webSocketsServerPort, function () {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. WebSocket request is just
    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
});

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function (request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

    // accept connection - you should check 'request.origin' to make sure that
    // client is connecting from your website
    // (http://en.wikipedia.org/wiki/Same_origin_policy)
    var connection = request.accept(null, request.origin);
    // we need to know client index to remove them on 'close' event
    var index = clients.push(connection) - 1;

    console.log((new Date()) + ' Connection accepted.');

    // send back chat history
    if (linesHistory.length > 0) {
        console.log("Sending coordinates history...");
        connection.sendUTF(JSON.stringify({ type: 'linesHistory', data: linesHistory }));
    }
    if (messagesHistory.length > 0) {
        console.log("Sending messages history...");
        connection.sendUTF(JSON.stringify({ type: 'messagesHistory', data: messagesHistory }));
    }

    // user sent some message
    connection.on('message', function (message) {
        if (message.type === 'utf8') { // accept only text
            try {
                var received = JSON.parse(message.utf8Data);
                switch (received.type) {
                    case "coordinates":
                        console.log(new Date() + "Received Coordinates: " + received)
                        //save in the history
                        linesHistory.push(received);
                        //broadcast message
                        for (var i = 0; i < clients.length; i++) {
                            if (index != i) {
                                clients[i].sendUTF(message.utf8Data);
                            }
                        }
                        break;
                    case "message":
                        console.log((new Date()) + ' Received Message: ' + received);
                        // we want to keep history of all sent messages
                        messagesHistory.push(received);
                        messagesHistory = messagesHistory.slice(-100);

                        // broadcast message to all connected clients
                        for (var i = 0; i < clients.length; i++) {
                            clients[i].sendUTF(message.utf8Data);
                        }
                        break;
                    case "activity":
                        console.log("Activity: " + received.user + " is " + received.action);
                        for (var i = 0; i < clients.length; i++) {
                            clients[i].sendUTF(message.utf8Data);
                        }
                        break;
                    case "command":
                        console.log("Command: " + received.action);
                        if (received.action == "clean") {
                            linesHistory = [];
                        }
                        for (var i = 0; i < clients.length; i++) {
                            clients[i].sendUTF(message.utf8Data);
                        }
                        break;
                }
            } catch (exception) {
                console.log(exception);
            }
        }
    });

    // user disconnected
    connection.on('close', function (connection) {
        clients.splice(index, 1);
    });

});