var express =require('express');
const cors = require('cors');
var app=express();
require('dotenv').config();
const connectedDB = require('./Config/db');
const authRoutes= require('./Routes/AuthRouters');
const todoRoutes= require('./Routes/TodoRouters');
const {verifyToken}=require('./middleware/authenticate')
connectedDB();


app.use(express.json());
app.use(cors());
app.use('/auth', authRoutes);
app.use('/api', todoRoutes); 

app.get('/', (req,res)=>{
   res.send({
      'data':'server was running'
   })      
 });
    
 const PORT= process.env.PORT || 8000;

 app.listen( PORT,()=>{
    console.log(`server is running on the ${PORT}`)
 });

