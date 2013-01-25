//Globals variables
var canvas, context, socket, coordinates, username = null;
//Helpers
function formatDate(date) {
    twoDigits(date.getHours()) +
    ":" + twoDigits(date.getMinutes()) +
    ":" + twoDigits(date.getSeconds());
}
function twoDigits(value) {
    if (value < 10) {
        return '0' + value;
    }
    return value;
}
//Classes
var WhiteBoardViewModel = function() {
    this.messages = ko.observableArray([
        { time: function () { return formatDate(new Date) }, user: "Eric", text: "Hello, world" }
    ]);
    this.username = ko.observable();
    this.setUsername = function () {
        username = this.username();
        console.log("Username selected: " + username);
        console.log("Initializing the connection...");
        //Open the socket
        console.log("Conntection initialized.");
    };
};

$(document).ready(function () {
    //configure styles
    $("#messages").scrollTop($("#messages").height());

    //configure canvas style
    var canvasContainer = $("#board");
    var parentCanvasContainer = canvasContainer.parent();
    canvasContainer.width = parentCanvasContainer.width;
    canvasContainer.height = parentCanvasContainer.height;

    //initialize canvas and its context
    canvas = window.document.getElementById("board");
    context = canvas.getContext("2d");

    //event binding
    
    

    //Apply bindings
    ko.applyBindings(new WhiteBoardViewModel());
});