// defining the Scheme of DB
const mongoose = require('mongoose'); 

const UserSchema= new mongoose.Schema({
    username:{type:String, required:true},
    email:{type:String,required:true},
    password:{type:String,required:true}
});
// defining the model

const User= mongoose.model('User',UserSchema);

module.exports= User;
