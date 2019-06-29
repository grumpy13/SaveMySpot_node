var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var axios = require("axios");

http.listen(3000, function() {
  console.log("Listening on port 3000");
});

io.on("connection", function(socket) {
  console.log("connected", socket.id);
});

function getRestaurantQ(socket, restaurantID, user) {
  axios
    .get(`http://127.0.0.1:8000/restaurant/detail/${restaurantID}/`, {
      params: { restaurant: restaurantID }
    })
    .then(res => res.data)
    .then(restaurant => {
      socket.join(restaurant.id);
      let found = false;
      if (restaurant.queue.length > 0) {
        restaurant.queue.forEach(spot => {
          if (user !== null && spot.user.id === user) {
            io.to(socket.id).emit("user spot", {
              spot: spot
            });
            found = true;
          }
        });
        if (!found) {
          io.to(socket.id).emit("user spot", {
            spot: null
          });
        }
        io.to(restaurant.id).emit("q info", {
          restaurantQ: restaurant.queue[0].position
        });
      } else {
        io.to(restaurant.id).emit("q info", {
          restaurantQ: 0
        });
        io.to(restaurant.id).emit("user spot", {
          spot: null
        });
      }
    })
    .catch(err => console.error(err));
}

io.on("connection", function(socket) {
  socket.on("restaurant room", function(data) {
    socket.join(data.restaurant.id);
    getRestaurantQ(socket, data.restaurant.id, data.user);
  });

  socket.on("back", function(data) {
    socket.leave(data);
  });

  socket.on("join q", function(data) {
    axios
      .post("http://127.0.0.1:8000/queue/create/", data)
      .then(res => res.data)
      .then(restaurant => {
        io.in(restaurant.id).emit("update queue");
      })
      .catch(err => console.error(err));
  });

  socket.on("leave q", data => {
    axios
      .delete(`http://127.0.0.1:8000/queue/delete/${data.id}/`)
      .then(res => res.data)
      .then(restaurant => {
        io.to(restaurant.id).emit("restaurantQ", restaurant.queue);
        io.to(restaurant.id).emit("update queue");
      })
      .catch(err => console.error(err));
  });

  socket.on("restaurant request", data => {
    getMyQ(socket, data);
  });
});

function getMyQ(socket, restaurantID) {
  axios
    .get(`http://127.0.0.1:8000/restaurant/detail/${restaurantID}/`)
    .then(res => res.data)
    .then(restaurant => {
      socket.join(restaurant.id);
      io.to(socket.id).emit("restaurantQ", restaurant);
    })
    .catch(err => console.error(err));
}
