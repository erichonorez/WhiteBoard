/**
 * Globals variables
 */
var canvas, context, socket, username, viewModel = null;
var coordinates = "";
var url = "ws://localhost:8888/";
var isDrawing = false;
/**
 * Helpers functions
 */
function formatDate(date) {
   return twoDigits(date.getHours()) +
    ":" + twoDigits(date.getMinutes()) +
    ":" + twoDigits(date.getSeconds());
}
function twoDigits(value) {
    if (value < 10) {
        return '0' + value;
    }
    return value;
}
/**
 * Classes
 */
//ViewModel to handle the application
var WhiteBoardViewModel = function () {
    this.messages = ko.observableArray();
    this.username = ko.observable();
    this.setUsername = function () {
        username = this.username();
        console.log("Username selected: " + username);
        console.log("Initializing the connection...");
        socket = initWebSocket();
        console.log("Conntection initialized.");
    };
};
//Application WebSocket
WebSocket.prototype.sendJSON = function (obj) {
    return this.send(JSON.stringify(obj));
};
WebSocket.prototype.sendMessage = function (message) {
    this.sendJSON(message);
};
WebSocket.prototype.sendActivity = function (activity) {
    this.sendJSON(activity);
};
WebSocket.prototype.sendLine = function (line) {
    this.sendJSON(line);
};
WebSocket.prototype.sendCommand = function (command) {
    this.sendJSON(command);
};
//Models
//Protocol Message
function Message(user, text) {
    this.type = "message";
    this.user = user;
    this.text = text;
    this.time = Date.now();
}
Message.prototype.formattedDate = function () {
    return formatDate(new Date(this.time));
};
//Protocol Activity
function Activity(user, action) {
    this.type = "activity";
    this.user = user;
    this.action = action;
}
//Protocol Coordinates
function Coordinate(x, y) {
    this.x = x;
    this.y = y;
}
Coordinate.prototype.toString = function () {
    return this.x + "#" + this.y;
};
//Protocol Line
function Line(coordinates, context) {
    this.type = "coordinates";
    this.coordinates = coordinates;
    this.context = {
        strokeStyle: context.strokeStyle,
        strokeWidth: context.strokeWidth
    };
}
//Protocol Command
function Command(action) {
    this.type = "command";
    this.action = action;
}
/**
 * FACTORIES
 */
function MessageFactory() {};
MessageFactory.prototype.fromJSON = function(json) {
    var message = new Message(json.user, json.text);
    message.time = json.time;
    return message;
};
function initWebSocket() {
    socket = new WebSocket(url);
    socket.addEventListener("open", function (event) { /* do something when connected */ });

    socket.addEventListener("message", function (event) {
        var data = JSON.parse(event.data);
        if (null == data.type) { return; }
        switch (data.type) {
            case "messagesHistory":
                var factory = new MessageFactory();
                for (var i = 0; i < data.data.length; i++) {
                    viewModel.messages.push(factory.fromJSON(data.data[i]));
                }
                break;
            case "linesHistory":
                for (var i = 0; i < data.data.length; i++) {
                    context.beginPath();
                    var coordinates = data.data[i].coordinates.split(",");
                    var firstCoordinates = coordinates[0].split("#");
                    context.moveTo(firstCoordinates[0], firstCoordinates[1]);
                    for (var i = 1; i < coordinates.length; i++) {
                        var values = coordinates[i].split("#");
                        context.lineTo(values[0], values[1]);
                        context.stroke();
                    }
                }
                break;
            case "message":
                var factory = new MessageFactory();
                viewModel.messages.push(factory.fromJSON(data));
                break;
            case "coordinates":
                $("#activity").html("");
                context.beginPath();
                var coordinates = data.coordinates.split(",");
                var firstCoordinates = coordinates[0].split("#");
                context.moveTo(firstCoordinates[0], firstCoordinates[1]);
                for (var i = 1; i < coordinates.length; i++) {
                    var values = coordinates[i].split("#");
                    context.lineTo(values[0], values[1]);
                    context.stroke();
                }
                break;
            case "activity":
                $("#activity").html(data.user + " is " + data.action + "...");
                break;
            case "command":
                if (data.action == "clean") {
                    context.clearRect(0, 0, canvas.width, canvas.height);
                }
                break;
        }
    });
    socket.addEventListener("error", function (event) { /* do something on error */});
    socket.addEventListener("close", function (event) { /* do something on close */});
    return socket;
};

$(document).ready(function () {
    //configure styles
    //$("#messages").scrollTop($("#messages").height());

    //initialize canvas and its context
    canvas = window.document.getElementById("board");
    context = canvas.getContext("2d");

    //event binding
    var canvasElement = $("#board");
    canvasElement.mousedown(function (event) {
        isDrawing = true;
        context.beginPath();
        socket.sendActivity(new Activity(username, "drawing"));
    });
    //on mouse move collect data
    canvasElement.mousemove(function (event) {
        if (!isDrawing) {
            return;
        }
        var x = event.clientX - $(this).offset().left;
        var y = event.clientY - $(this).offset().top;
        context.lineTo(x, y);
        context.stroke();
        //append to coordinates array
        coordinates += x + "#" + y + ",";
    });
    //on mouse up send the data
    canvasElement.mouseup(function (event) {
        isDrawing = false;
        //send path coordinates only when the path is completed
        socket.sendLine(new Line(coordinates, context));
        coordinates = ""; //clean coordinates
        $("#activity").html("");
    });
    //on clean
    $("#clear").click(function (event) {
        socket.sendCommand(new Command("clean"));
        event.preventDefault();
    });
    //
    //when a message is submitted
    $("#form-new-message").submit(function (event) {
        var messageElement = $("#message");
        //The message will be received through the socket
        socket.sendMessage(new Message(username, messageElement.val()));
        messageElement.val("");
        //it never submit the form
        event.preventDefault();
    });
    //Apply bindings
    viewModel = new WhiteBoardViewModel()
    ko.applyBindings(viewModel);
});