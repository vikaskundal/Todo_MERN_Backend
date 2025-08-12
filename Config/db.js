/*Connect the mongoDB */
const { error } = require('console');
const mongoose =require('mongoose');
require('dotenv').config();

 
const connectedDB=  async ()=>{
    try{
    await mongoose.connect(process.env.mongoDB_URL);

    console.log('DB is connected')
    }catch(error){
        console.log('Database-not-connected',error.message)
    }

}


module.exports = connectedDB;