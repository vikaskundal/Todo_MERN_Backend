const bcrypt = require('bcryptjs');
const User = require('../Models/User');
const mongoose = require('mongoose');
const { generateToken } = require('../middleware/authenticate');
const sendEmail = require('../Config/email');
const { setOTP, verifyOTP } = require('../Config/otpStore');

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// API for SignUp (Step 1: send OTP)
async function signUp(req, res) {
  try {
    const { username, email, password } = req.body;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
        }
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setOTP(email, otp);
    // Send OTP to email
    await sendEmail(email, 'Your OTP for Todo App Signup', `Your OTP is: ${otp}`);
    // Store username/password temporarily in client (or send back for next step)
    res.status(200).json({ message: 'OTP sent to email. Please verify to complete signup.' });
  } catch (error) {
    console.log('signup error', error.message);
    res.status(500).json({ message: 'Signup failed. Please try again.' });
  }
}

// API for OTP Verification (Step 2: create user)
async function verifyOtpAndCreateUser(req, res) {
  try {
    const { username, email, password, otp } = req.body;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (!verifyOTP(email, otp)) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    const hashedpassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({ username, email, password: hashedpassword });
        await newUser.save();
    const token = generateToken({ userId: newUser._id, username: newUser.username, email: newUser.email });
    res.status(201).json({ data: token });
  } catch (error) {
    console.log('verify otp error', error.message);
    res.status(500).json({ message: 'OTP verification failed. Please try again.' });
  }
    }

// Login (now with email)
async function logIn(req, res) {
  try {
    const { email, password } = req.body;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
        // check user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
        }
    const ispasswordValid = await bcrypt.compare(password, user.password);
    if (!ispasswordValid) {
      return res.status(404).json({ message: 'Incorrect password' });
        }
    const token = generateToken({ userId: user._id, username: user.username, email: user.email });
    res.status(201).json({ data: token });
  } catch (error) {
    console.log('unable to login', error.message);
    res.status(500).json({ message: 'Unable to login. Try again.' });
  }
 }

module.exports = {
    signUp,
  verifyOtpAndCreateUser,
  logIn,
 };