var express = require('express');
app = express();
app.configure(function () {
    app.use("/", express.static(__dirname + '/../client/'));
});
app.listen(8080);