WhiteBoard
==========

Simple WhiteBoard using Javascript, WebSocket, Node.js, Knockout JS and JQuery

How to use the White Board?
---------------------------
1. The project uses Node.js to run the WebSocket server and to deliver static files like html, css and javascript.
So the first thing you have to do is to install Node.js (http://nodejs.org/)

2. One Node.js is installed edit 'whiteboard.js' (~/client/js/whiteboard.js) to configure the websocket server address:
```javascript
var url = "ws://localhost:8888/"; //replace localhost with your hostname or ip address
```

3. Go in the server directory and launch the WhiteBoardServer (WebSocket server) with the following command:
```
$> node WhiteBoardServer.js ///run the websocket server on port 8888
```

4. Launch the WhiteBoardWebServer (web server) with the following command:
```
$> node WhiteBoardWebServer.js //run the web server on port 8080
```
5. Go to http://$your_hostname$:8080/
