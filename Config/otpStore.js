// Simple in-memory OTP store: { email: { otp, expiresAt, username, password, type } }
// type can be 'signup' or 'password-reset'
const otpStore = {};

function setOTP(email, otp, username = null, password = null, type = 'signup', expiresInMs = 5 * 60 * 1000) {
  otpStore[email] = {
    otp,
    username,
    password,
    type,
    expiresAt: Date.now() + expiresInMs,
  };
}

function verifyOTP(email, otp, type = null) {
  const record = otpStore[email];
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    return false;
  }
  // If type is specified, verify it matches
  if (type && record.type !== type) {
    return false;
  }
  const isValid = record.otp === otp;
  return isValid;
}

function getOTPData(email) {
  const record = otpStore[email];
  if (!record) return null;
  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    return null;
  }
  return {
    username: record.username,
    password: record.password,
    type: record.type,
  };
}

function clearOTP(email) {
  delete otpStore[email];
}

module.exports = { setOTP, verifyOTP, getOTPData, clearOTP }; 