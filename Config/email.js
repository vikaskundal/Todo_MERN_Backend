const nodemailer = require('nodemailer');
require('dotenv').config();

// Validate email configuration
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn('WARNING: EMAIL_USER or EMAIL_PASS is not defined. Email functionality may not work.');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Generate OTP Email HTML Template
 */
function generateOTPEmailHTML(otp, purpose = 'signup') {
  const purposeText = purpose === 'password-reset' ? 'Password Reset' : 'Account Signup';
  const color = purpose === 'password-reset' ? '#FF6B6B' : '#4ECDC4';
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${purposeText} OTP</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, ${color} 0%, #45B7D1 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Todo App</h1>
                            <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">${purposeText} Verification</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                Hello! 👋
                            </p>
                            <p style="margin: 0 0 30px 0; color: #555555; font-size: 15px; line-height: 1.6;">
                                You've requested a verification code for ${purpose === 'password-reset' ? 'resetting your password' : 'creating your account'}. 
                                Please use the code below to complete the process:
                            </p>
                            <!-- OTP Box -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <div style="background: linear-gradient(135deg, ${color} 0%, #45B7D1 100%); border-radius: 10px; padding: 25px; display: inline-block;">
                                            <p style="margin: 0; color: #ffffff; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                                ${otp}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 30px 0 0 0; color: #888888; font-size: 13px; line-height: 1.6; text-align: center;">
                                ⏰ This code will expire in 5 minutes.<br>
                                If you didn't request this code, please ignore this email.
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0; color: #6c757d; font-size: 12px;">
                                © ${new Date().getFullYear()} Todo App. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
}

/**
 * Generate Todo List Email HTML Template
 * @param {Array} todos - Array of todo objects
 * @param {string} username - User's username
 * @param {string} websiteUrl - Website URL to link to (optional)
 */
function generateTodoListEmailHTML(todos, username, websiteUrl = null) {
  const completedTodos = todos.filter(todo => todo.done);
  const pendingTodos = todos.filter(todo => !todo.done);
  
  const todoCardHTML = (todo, index) => {
    const cardColor = todo.done ? '#E8F5E9' : '#FFF3E0';
    const borderColor = todo.done ? '#4CAF50' : '#FF9800';
    const statusBadge = todo.done 
      ? '<span style="background-color: #4CAF50; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600;">✓ COMPLETED</span>'
      : '<span style="background-color: #FF9800; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600;">⏳ PENDING</span>';
    
    return `
    <tr>
        <td style="padding: 15px 0;">
            <div style="background-color: ${cardColor}; border-left: 4px solid ${borderColor}; border-radius: 8px; padding: 20px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td>
                            <h3 style="margin: 0 0 10px 0; color: #333333; font-size: 18px; font-weight: 600;">
                                ${index + 1}. ${todo.title}
                            </h3>
                            <p style="margin: 0 0 12px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                                ${todo.description || 'No description'}
                            </p>
                            <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                                ${statusBadge}
                                ${todo.date ? `<span style="color: #888888; font-size: 12px;">📅 ${todo.date}</span>` : ''}
                                ${todo.time ? `<span style="color: #888888; font-size: 12px;">🕐 ${todo.time}</span>` : ''}
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
        </td>
    </tr>
    `;
  };
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Todo List</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">📋 Your Todo List</h1>
                            <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Hello, ${username || 'User'}!</p>
                        </td>
                    </tr>
                    <!-- Stats -->
                    <tr>
                        <td style="padding: 30px; background-color: #f8f9fa;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td width="50%" align="center" style="padding: 15px; background-color: #E8F5E9; border-radius: 8px; margin-right: 10px;">
                                        <p style="margin: 0; font-size: 32px; font-weight: bold; color: #4CAF50;">${completedTodos.length}</p>
                                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #666666;">Completed</p>
                                    </td>
                                    <td width="50%" align="center" style="padding: 15px; background-color: #FFF3E0; border-radius: 8px; margin-left: 10px;">
                                        <p style="margin: 0; font-size: 32px; font-weight: bold; color: #FF9800;">${pendingTodos.length}</p>
                                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #666666;">Pending</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Todos -->
                    <tr>
                        <td style="padding: 30px;">
                            ${pendingTodos.length > 0 ? `
                            <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 20px; font-weight: 600;">⏳ Pending Tasks (${pendingTodos.length})</h2>
                            ` : ''}
                            ${pendingTodos.map((todo, idx) => todoCardHTML(todo, idx)).join('')}
                            
                            ${completedTodos.length > 0 ? `
                            <h2 style="margin: 30px 0 20px 0; color: #333333; font-size: 20px; font-weight: 600;">✓ Completed Tasks (${completedTodos.length})</h2>
                            ` : ''}
                            ${completedTodos.map((todo, idx) => todoCardHTML(todo, pendingTodos.length + idx)).join('')}
                        </td>
                    </tr>
                    <!-- Call to Action Button -->
                    ${websiteUrl ? `
                    <tr>
                        <td style="padding: 30px; text-align: center;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="${websiteUrl}" style="display: inline-block; background: linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: all 0.3s ease;">
                                            🚀 Open Todo App
                                        </a>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 15px;">
                                        <p style="margin: 0; color: #666666; font-size: 14px;">
                                            Click the button above to manage your todos online
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    ` : ''}
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0; color: #6c757d; font-size: 12px;">
                                Keep up the great work! 💪<br>
                                ${websiteUrl ? `<a href="${websiteUrl}" style="color: #4ECDC4; text-decoration: none;">Visit our website</a> | ` : ''}
                                © ${new Date().getFullYear()} Todo App. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
}

/**
 * Send an email (supports both text and HTML)
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Email body (plain text)
 * @param {string} html - Email body (HTML) - optional
 * @returns {Promise}
 */
function sendEmail(to, subject, text, html = null) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email configuration is missing. Please set EMAIL_USER and EMAIL_PASS in your .env file');
  }
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    ...(html && { html }),
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendEmail, generateOTPEmailHTML, generateTodoListEmailHTML }; 