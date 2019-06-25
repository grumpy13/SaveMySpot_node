var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var axios = require("axios");

http.listen(3000, function() {
  console.log("Listening on port 3000");
});
