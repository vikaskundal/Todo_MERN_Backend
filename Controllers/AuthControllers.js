const bcrypt = require('bcryptjs');
const User = require('../Models/User');
const mongoose = require('mongoose');
const { generateToken } = require('../middleware/authenticate');
const { sendEmail, generateOTPEmailHTML } = require('../Config/email');
const { setOTP, verifyOTP, getOTPData, clearOTP } = require('../Config/otpStore');

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// API for SignUp (Step 1: send OTP)
async function signUp(req, res) {
  try {
    const { username, email, password } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setOTP(email, otp, username, password);
    
    // Send OTP to email with HTML template
    try {
      const htmlContent = generateOTPEmailHTML(otp, 'signup');
      const textContent = `Your OTP for Todo App Signup is: ${otp}. This code will expire in 5 minutes.`;
      await sendEmail(email, 'Your OTP for Todo App Signup', textContent, htmlContent);
      res.status(200).json({ message: 'OTP sent to email. Please verify to complete signup.' });
    } catch (emailError) {
      console.error('Email sending error:', emailError.message);
      clearOTP(email);
      return res.status(500).json({ message: 'Failed to send OTP email. Please check your email configuration.' });
    }
  } catch (error) {
    console.error('signup error:', error.message);
    res.status(500).json({ message: 'Signup failed. Please try again.' });
  }
}

// API for OTP Verification (Step 2: create user)
async function verifyOtpAndCreateUser(req, res) {
  try {
    const { email, otp } = req.body;
    
    // Validation
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // Verify OTP
    if (!verifyOTP(email, otp)) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    // Get stored user data
    const otpData = getOTPData(email);
    if (!otpData) {
      return res.status(400).json({ message: 'OTP data not found or expired' });
    }
    
    const { username, password } = otpData;
    
    // Check if user already exists (double check)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      clearOTP(email);
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    // Create user
    const hashedpassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({ username, email, password: hashedpassword });
    await newUser.save();
    
    // Clear OTP after successful creation
    clearOTP(email);
    
    const token = generateToken({ userId: newUser._id, username: newUser.username, email: newUser.email });
    res.status(201).json({ data: token });
  } catch (error) {
    console.error('verify otp error:', error.message);
    res.status(500).json({ message: 'OTP verification failed. Please try again.' });
  }
}

// Login (now with email)
async function logIn(req, res) {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // Check user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const ispasswordValid = await bcrypt.compare(password, user.password);
    if (!ispasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const token = generateToken({ userId: user._id, username: user.username, email: user.email });
    res.status(200).json({ data: token });
  } catch (error) {
    console.error('login error:', error.message);
    res.status(500).json({ message: 'Unable to login. Try again.' });
  }
}

// Request Password Reset (Step 1: send OTP)
async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body;
    
    // Validation
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({ message: 'If an account exists with this email, a password reset OTP has been sent.' });
    }
    
    // Generate OTP for password reset
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setOTP(email, otp, null, null, 'password-reset');
    
    // Send OTP to email with HTML template
    try {
      const htmlContent = generateOTPEmailHTML(otp, 'password-reset');
      const textContent = `Your password reset OTP is: ${otp}. This code will expire in 5 minutes.`;
      await sendEmail(email, 'Password Reset - Todo App', textContent, htmlContent);
      res.status(200).json({ message: 'If an account exists with this email, a password reset OTP has been sent.' });
    } catch (emailError) {
      console.error('Email sending error:', emailError.message);
      clearOTP(email);
      return res.status(500).json({ message: 'Failed to send password reset email. Please try again later.' });
    }
  } catch (error) {
    console.error('password reset request error:', error.message);
    res.status(500).json({ message: 'Failed to process password reset request. Please try again.' });
  }
}

// Verify Password Reset OTP (Step 2: verify OTP)
async function verifyPasswordResetOTP(req, res) {
  try {
    const { email, otp } = req.body;
    
    // Validation
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // Verify OTP for password reset
    if (!verifyOTP(email, otp, 'password-reset')) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    // OTP is valid, allow password reset
    res.status(200).json({ message: 'OTP verified successfully. You can now reset your password.' });
  } catch (error) {
    console.error('verify password reset OTP error:', error.message);
    res.status(500).json({ message: 'Failed to verify OTP. Please try again.' });
  }
}

// Reset Password (Step 3: set new password)
async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    
    // Validation
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    // Verify OTP again
    if (!verifyOTP(email, otp, 'password-reset')) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      clearOTP(email);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();
    
    // Clear OTP after successful reset
    clearOTP(email);
    
    res.status(200).json({ message: 'Password reset successfully. You can now login with your new password.' });
  } catch (error) {
    console.error('reset password error:', error.message);
    res.status(500).json({ message: 'Failed to reset password. Please try again.' });
  }
}

// Update Username
async function updateUsername(req, res) {
  try {
    const { newUsername } = req.body;
    const userId = req.user.userId; // From JWT token
    
    // Validation
    if (!newUsername) {
      return res.status(400).json({ message: 'New username is required' });
    }
    
    // Username validation (alphanumeric, underscore, hyphen, 3-20 chars)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(newUsername)) {
      return res.status(400).json({ 
        message: 'Username must be 3-20 characters long and can only contain letters, numbers, underscores, and hyphens' 
      });
    }
    
    // Check if username already exists
    const existingUser = await User.findOne({ username: newUsername });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json({ message: 'Username already taken' });
    }
    
    // Find and update user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update username
    user.username = newUsername;
    await user.save();
    
    // Generate new token with updated username
    const token = generateToken({ 
      userId: user._id, 
      username: user.username, 
      email: user.email 
    });
    
    res.status(200).json({ 
      message: 'Username updated successfully',
      data: {
        username: user.username,
        email: user.email,
        token: token // Return new token with updated username
      }
    });
  } catch (error) {
    console.error('update username error:', error.message);
    res.status(500).json({ message: 'Failed to update username. Please try again.' });
  }
}

module.exports = {
  signUp,
  verifyOtpAndCreateUser,
  logIn,
  requestPasswordReset,
  verifyPasswordResetOTP,
  resetPassword,
  updateUsername,
};