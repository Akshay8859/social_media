require('dotenv').config();
const express=require('express')
const http = require('http'); // 👉 for creating the server manually
const { Server } = require('socket.io'); // 👉 socket.io import

const cors=require('cors')
const AuthRouter=require('./routes/auth');
const ProfileRouter=require('./routes/profile');
const MatchRouter=require('./routes/match')

const {setUpChatSocket}=require('./chatSocket')


const app=express()
const port =5000
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
      origin: "*", // or your frontend URL
      methods: ["GET", "POST"]
    }
  });
app.use(express.json())

app.use(cors())
setUpChatSocket(io) // Initialize the chat socket

app.use("/auth",AuthRouter)
app.use("/profile",ProfileRouter)
app.use("/match",MatchRouter)

app.get('/',(req,res)=>{
    res.send('hello from backend')
})
app.get('/home',(req,res)=>{
    res.send('home')
})
app.get('/home/:id/:name',(req,res)=>{
    const userid=req.params.id
    const name=req.params.name
    console.log(name)
    res.send(`hi ${name} having roll no ${userid}`)
})

server.listen(port,()=>{
    
    console.log("running")
})