// Simple in-memory OTP store: { email: { otp, expiresAt } }
const otpStore = {};

function setOTP(email, otp, expiresInMs = 5 * 60 * 1000) {
  otpStore[email] = {
    otp,
    expiresAt: Date.now() + expiresInMs,
  };
}

function verifyOTP(email, otp) {
  const record = otpStore[email];
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    return false;
  }
  const isValid = record.otp === otp;
  if (isValid) delete otpStore[email];
  return isValid;
}

module.exports = { setOTP, verifyOTP }; 