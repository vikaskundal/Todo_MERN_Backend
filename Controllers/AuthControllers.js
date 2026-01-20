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
    console.log('\n📝 SIGNUP ATTEMPT');
    console.log('Request received at:', new Date().toISOString());
    console.log('Request body:', { 
      username: req.body.username ? req.body.username : 'MISSING',
      email: req.body.email ? req.body.email : 'MISSING',
      password: req.body.password ? '***' : 'MISSING'
    });
    
    const { username, email, password } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      console.log('❌ Validation failed: Missing required fields');
      console.log('   Username:', username ? '✓' : '✗ MISSING');
      console.log('   Email:', email ? '✓' : '✗ MISSING');
      console.log('   Password:', password ? '✓' : '✗ MISSING');
      return res.status(400).json({ 
        success: false,
        message: 'Username, email, and password are required' 
      });
    }
    if (!emailRegex.test(email)) {
      console.log('❌ Validation failed: Invalid email format');
      console.log('   Email provided:', email);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email format' 
      });
    }
    if (password.length < 6) {
      console.log('❌ Validation failed: Password too short');
      console.log('   Password length:', password.length);
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long' 
      });
    }
    
    console.log('✅ Validation passed, checking for existing user...');
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }
    
    console.log('✅ User does not exist, generating OTP...');
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('OTP generated:', otp);
    setOTP(email, otp, username, password);
    
    // Send OTP to email with HTML template
    try {
      console.log('Sending OTP email to:', email);
      const htmlContent = generateOTPEmailHTML(otp, 'signup');
      const textContent = `Your OTP for Todo App Signup is: ${otp}. This code will expire in 5 minutes.`;
      await sendEmail(email, 'Your OTP for Todo App Signup', textContent, htmlContent);
      console.log('✅ OTP email sent successfully\n');
      res.status(200).json({ 
        success: true,
        message: 'OTP sent to email. Please verify to complete signup.',
        email: email // Return email so frontend knows which email to verify
      });
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError.message);
      console.error('Error stack:', emailError.stack);
      clearOTP(email);
      return res.status(500).json({ 
        success: false,
        message: 'Failed to send OTP email. Please check your email configuration.' 
      });
    }
  } catch (error) {
    console.error('❌ SIGNUP ERROR:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Signup failed. Please try again.' 
    });
  }
}

// API for OTP Verification (Step 2: create user)
async function verifyOtpAndCreateUser(req, res) {
  try {
    console.log('\n🔐 OTP VERIFICATION ATTEMPT');
    console.log('Request received at:', new Date().toISOString());
    console.log('Request body:', { email: req.body.email, otp: req.body.otp ? '***' : 'MISSING' });
    
    const { email, otp } = req.body;
    
    // Validation
    if (!email || !otp) {
      console.log('❌ Validation failed: Missing email or OTP');
      return res.status(400).json({ 
        success: false,
        message: 'Email and OTP are required' 
      });
    }
    if (!emailRegex.test(email)) {
      console.log('❌ Validation failed: Invalid email format');
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email format' 
      });
    }
    
    // Verify OTP
    console.log('Verifying OTP...');
    if (!verifyOTP(email, otp)) {
      console.log('❌ Invalid or expired OTP');
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired OTP' 
      });
    }
    
    // Get stored user data
    const otpData = getOTPData(email);
    if (!otpData) {
      console.log('❌ OTP data not found');
      return res.status(400).json({ 
        success: false,
        message: 'OTP data not found or expired' 
      });
    }
    
    const { username, password } = otpData;
    
    // Check if user already exists (double check)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already exists');
      clearOTP(email);
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }
    
    console.log('✅ OTP verified, creating user...');
    
    // Create user
    const hashedpassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({ username, email, password: hashedpassword });
    await newUser.save();
    
    // Clear OTP after successful creation
    clearOTP(email);
    
    const token = generateToken({ userId: newUser._id, username: newUser.username, email: newUser.email });
    
    console.log('✅ User created successfully!');
    console.log('User ID:', newUser._id);
    console.log('Token generated\n');
    
    // Return token and user data for frontend
    res.status(201).json({ 
      success: true,
      message: 'User created successfully',
      data: {
        token: token,
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email
        }
      }
    });
  } catch (error) {
    console.error('❌ OTP VERIFICATION ERROR:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'OTP verification failed. Please try again.' 
    });
  }
}

// Login (now with email)
async function logIn(req, res) {
  try {
    console.log('\n🔐 LOGIN ATTEMPT');
    console.log('Request received at:', new Date().toISOString());
    console.log('Request body:', { email: req.body.email, password: req.body.password ? '***' : 'missing' });
    
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      console.log('❌ Validation failed: Missing email or password');
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }
    if (!emailRegex.test(email)) {
      console.log('❌ Validation failed: Invalid email format');
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email format' 
      });
    }
    
    console.log('✅ Validation passed, searching for user...');
    
    // Check user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }
    
    console.log(`✅ User found: ${user.email} (ID: ${user._id})`);
    console.log('Comparing password...');
    
    const ispasswordValid = await bcrypt.compare(password, user.password);
    if (!ispasswordValid) {
      console.log('❌ Password mismatch');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }
    
    console.log('✅ Password valid, generating token...');
    const token = generateToken({ userId: user._id, username: user.username, email: user.email });
    console.log('✅ Login successful! Token generated');
    console.log('Token preview:', token.substring(0, 50) + '...\n');
    
    // Return token and user data for frontend
    res.status(200).json({ 
      success: true,
      message: 'Login successful',
      data: {
        token: token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('❌ LOGIN ERROR:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Unable to login. Try again.' 
    });
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