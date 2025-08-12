const mongoose = require('mongoose'); 
const moment=require('moment');
const TodoSchema= mongoose.Schema({
    
    title:{type:String,required:true},
    description:{type:String,required:true},
    date:{
        type: String,
    set: function(v) {
      return moment(v).format('DD/MM/YYYY');
    },
    get: function(v) {
      return moment(v, 'DD/MM/YYYY').toDate();
    }
    },
    time:{type:String,required:true},
    done:{type:Boolean, default:false},
    userId:{
      type:mongoose.Schema.ObjectId,
      ref:'User',
      required:true
    }

});



const Todo=mongoose.model('Todo',TodoSchema); 

module.exports=Todo;