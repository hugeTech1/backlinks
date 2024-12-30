const express = require("express");
const http = require("http");
const app = express();
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv/config");
const authJwt = require("./helpers/jwt");
const errHandler = require("./helpers/error-handler");

app.use(cors());
app.options("*", cors());

// Middleware
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(authJwt());
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));
app.use(errHandler);

// Routes

const usersRoutes = require("./routers/users");
const indexLinks = require("./routers/index-links");

const api = process.env.API_URL;

app.use(`${api}/users`, usersRoutes);
app.use(`${api}/links`, indexLinks);

mongoose
  .connect(process.env.CONNECTION_STRING, {
    dbName: "index_link_db",
  })
  .then(() => {
    console.log("Database connection ready");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1); // Exit the process to allow nodemon to restart it
  });

const server = app.listen(5000, () => {
  console.log("Server started on port 5000");
});

// Graceful shutdown and error handling
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  shutdown(server);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  shutdown(server);
});

function shutdown(server) {
  server.close(() => {
    console.log("Shutting down gracefully...");
    process.exit(1); // Exit the process to allow nodemon to restart it
  });
}
