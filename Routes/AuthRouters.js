// checking while the user is signing up that is the account already made or not 
const express = require('express');
const router = express.Router();
const {
  signUp, 
  logIn, 
  verifyOtpAndCreateUser,
  requestPasswordReset,
  verifyPasswordResetOTP,
  resetPassword,
  updateUsername
} = require('../Controllers/AuthControllers');
const { verifyToken } = require('../middleware/authenticate');

// for handling the signup operation 
router.post('/signup', signUp);
// for handling the OTP verification and user creation
router.post('/verify-otp', verifyOtpAndCreateUser);
// for handling the login operation 
router.post('/login', logIn);
// for handling password reset - request OTP
router.post('/forgot-password', requestPasswordReset);
// for handling password reset - verify OTP
router.post('/verify-reset-otp', verifyPasswordResetOTP);
// for handling password reset - set new password
router.post('/reset-password', resetPassword);
// for handling username update (requires authentication)
router.put('/update-username', verifyToken, updateUsername);

module.exports = router;