const toysRouter = require("./toys");
const usersRouter = require("./users");
const indexRouter = require("./index");

exports.configRoutes = (app) => {
  app.use("/", indexRouter);
  app.use("/toys", toysRouter);
  app.use("/users", usersRouter);
};