const Todo = require('../Models/Todo');
const sendEmail = require('../Config/email');
//  get all the todos in the account
async function getTodo(req,res){
    try{
        const todos= await Todo.find({userId:req.user.userId,done:false});
        res.status(200).json(todos);

    }catch{
        res.status(500).json({message:'Error Fetching the todos'
        });

    }


}

// create new todos
async function createTodo(req,res){
    console.log('User object:', req.user);
    console.log('User ID:', req.user.userId);
    try{
        const {title,description,date,time,done}=req.body;
        const userId= req.user.userId;
        
        if (!userId) {
            return res.status(400).json({message: 'User ID is required'});
        }
        
        const newTodo= new Todo({
            title,
            description,
            date,
            time,
            done,
            userId
           

        })
        
        await newTodo.save();
         res.status(201).json(newTodo);
    }catch(error){
        console.log('error is :' ,error);
        res.status(500).json({message:'unable to create the Todo'})

    }

}

// update the todos

async function updateTodo(req,res){
    try{
        const {id}=req.params; 
        console.log(id);
        const updatedTodo=await Todo.findByIdAndUpdate(id,{done:true},{new:true});
        res.status(200).json(updatedTodo);
    }catch{
        res.status(500).json({
            message:'Error updating the todos'
        });
    }

}

// Deleting the todos 

async function deleteTodo(req,res){
    try{
        const {id}=req.params;
        
        
        const deletedTodo=await Todo.findByIdAndDelete(id);
        if(!deletedTodo){
            res.status(404).json({
                message:'Todo not found'
            })
        }
        res.status(200).json({
            message:'Todo deleted successfully'
        })

    }catch{
        res.status(500).json({
            message:'Error deleting the Todo'
        })

    }
}

// Send all todos to user's email
async function sendTodosToEmail(req, res) {
    try {
        const userId = req.user.userId;
        const userEmail = req.user.email;
        if (!userId || !userEmail) {
            return res.status(400).json({ message: 'User ID and email required' });
        }
        const todos = await Todo.find({ userId });
        if (!todos.length) {
            return res.status(400).json({ message: 'No todos to send.' });
        }
        // Format todos as a readable list
        const todoList = todos.map((todo, idx) => `${idx + 1}. ${todo.title} - ${todo.description} (${todo.date} ${todo.time})${todo.done ? ' [Done]' : ''}`).join('\n');
        const emailBody = `Here are your todos:\n\n${todoList}`;
        await sendEmail(userEmail, 'Your Todo List', emailBody);
        res.status(200).json({ message: 'Todos sent to your email!' });
    } catch (error) {
        console.log('Error sending todos to email:', error);
        res.status(500).json({ message: 'Failed to send todos to email.' });
    }
}

module.exports = {
    getTodo,
    createTodo,
    updateTodo,
    deleteTodo,
    sendTodosToEmail
};

    