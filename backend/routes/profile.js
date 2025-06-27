const express=require('express');
const authenticationMiddleware = require('../middleware/auth');
const { getProfile, getUserProfile, updateProfile } = require('../controllers/profile');
const router=express.Router();
router.use(authenticationMiddleware)

router.get("/me",getProfile)
router.get("/:userId", getUserProfile);
router.put("/update", updateProfile);

module.exports=router;