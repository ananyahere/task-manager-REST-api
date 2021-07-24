const express = require("express");
const multer = require('multer')
const sharp = require('sharp')
const auth = require("../middleware/auth")
// create a router
const router = new express.Router();
const User = require("../models/user");

// sign up
router.post("/users", async (req, res) => {
  //create a new user
  const user = new User(req.body);
  // Error handing
  try {
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

// log in
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
});

// logout
router.post("/users/logout", auth, async (req, res) => {
  try {
    // filtering tokens array of authenticated user
    req.user.tokens = req.user.tokens.filter((tokenObj) => {
      return tokenObj.token !== req.token;
    });
    await req.user.save();

    res.send({ msg: "logged out form desired device" });
  } catch (e) {
    res.status(500).send();
  }
});

// logout of all the sessions
router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    // set token array to [] to remove all the tokens
    req.user.tokens = [];
    await req.user.save();
    res.send({ msg: "logget out from all sessions" });
  } catch (e) {
    res.status(500).send();
  }
});

// get profile
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

// update individual user by id
router.patch("/users/me", auth, async (req, res) => {
  //get array (of strings) of properties request-body wants to update
  const desiredUpdates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age "];
  const isValidOperation = desiredUpdates.every((desiredUpdate) =>
    allowedUpdates.includes(desiredUpdate)
  );

  if (!isValidOperation)
    return res.status(400).send({ error: "Invalid update(s)!" });

  try {
    desiredUpdates.forEach((update) => {
      // access property
      req.user[update] = req.body[update];
    });
    //save updates
    await req.user.save();

    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

// delete individual user by id
router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if(!file.originalname.match(/\.(jpeg|png|jpg)$/)){
      return cb(new Error('Please upload an image(.jpeg, .png or .jpg)'))
    }
    cb(undefined, true)
  }
})

// upload profile pic
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req,res) => {
  const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250}).png().toBuffer()
  req.user.avatar = buffer
  await req.user.save()
  res.send()
}, (error, req, res, next) => {
  res.status(400).send({error: error.message})
})

// delete profile pic
router.delete('/users/me/avatar', auth, async (req, res) => {
  req.user.avatar = undefined 
  await req.user.save()
  res.status(200).send()
})

// Get url to profile pic
router.get('/users/:id/avatar', async (req, res) => {
  try{
    const user = await User.findById(req.params.id)
    if(!user || !user.avatar){
      throw new Error()
    }

    res.set('Content-Type','image/png')
    res.send(user.avatar)
    }catch(e){
        res.status(404).send() 
  }
})

module.exports = router;
