const express = require("express");
// connects moongose to db
require("./db/mongoose");
const User = require("./models/user");
const Task = require("./models/task");
const { translateAliases } = require("./models/user");

const app = express();
const port = process.env.PORT;

// Routers
const userRouter = require("./routers/user")
const taskRouter = require("./routers/task")

app.use(express.json());

// Register Routers
app.use(userRouter);    
app.use(taskRouter);

app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});





