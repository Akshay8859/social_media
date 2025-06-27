const express=require('express');
const router=express.Router();
const {signUp, login, refreshToken, logOut}=require('../controllers/auth');
const authenticationMiddleware = require('../middleware/auth');

router.post('/signup',signUp);
router.post('/login',login)
router.post('/refresh',refreshToken)
router.get('/logOut',authenticationMiddleware,logOut)

module.exports=router;