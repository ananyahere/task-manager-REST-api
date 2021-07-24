const express = require("express");
const router = new express.Router();
const Task = require("../models/task");
const auth = require("../middleware/auth");

// add new task
router.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });

  try {
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

// GET /tasks?isCompleted=true
// GET /tasks?limit=4&skip=4
// GET /tasks?sortBy=createdAt_desc
// get all tasks
router.get("/tasks", auth, async (req, res) => {
  const match = {}
  const sort = {}

  if (req.query.isCompleted){
    match.isCompleted = req.query.isCompleted === 'true'
  }
  if (req.query.sortBy) {
     const parts = req.query.sortBy.split('_')
     sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
  }

  try {
    await req.user.populate({
      path: 'tasks', 
      match,
      options:{
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    }).execPopulate();
    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send();
  }
});

// get individual task by id
router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task)
      return res.status(404).send({ error: `No task with id ${_id} found` });
    res.send(task);
  } catch (e) {
    res.status(500).send();
  }
});

// update individual task by id
router.patch("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  //get array (of strings) of properties request-body wants to update
  const desiredUpdates = Object.keys(req.body);
  const allowedUpdates = ["isCompleted", "description"];
  const isValidOperation = desiredUpdates.every((desiredUpdate) =>
    allowedUpdates.includes(desiredUpdate)
  );

  if (!isValidOperation)
    return res.status(404).send({ error: "Invalid update(s)!" });
  try {
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) return res.status(404).send({ error: `Task not found` });

    desiredUpdates.forEach((update) => {
      task[update] = req.body[update];
    });
    await task.save();
    res.send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

// delete individual task by id
router.delete("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id; //task id

  try {
    
    const task = await Task.findOneAndDelete({ _id, owner: req.user._id });

    if (!task)
      return res.status(404).send({ error: `No task found` });
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
