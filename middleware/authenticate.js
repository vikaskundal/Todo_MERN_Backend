//for the jwt middleware
// generating the jsonwebtoken
const jwt =require('jsonwebtoken');
require('dotenv').config();
const secretKey= process.env.jwtKey


// generating the jwt
const generateToken=(payload)=>{
    
    return jwt.sign(payload,secretKey,{expiresIn:'1h'});
}

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
 // Assuming token is sent in headers
  
    if (!token) {
      return res.status(401).json({ message: 'Authorization token is required.' });
    }
  
    try {
      const actualToken = token.split(' ')[1];
      const decoded = jwt.verify(actualToken, secretKey);
      req.user = decoded;
      
     
      next(); // Move to the next middleware or route handler
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token.' });
    }
  };
    
    


module.exports= {verifyToken,generateToken};
