const express=require('express');
const authenticationMiddleware = require('../middleware/auth');
const { getUsers, likeUser } = require('../controllers/match');
const router=express.Router();

router.use(authenticationMiddleware)

router.get("/getUsers",getUsers)
router.post("/like",likeUser)

module.exports=router;