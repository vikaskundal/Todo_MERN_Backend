# Update Username API Endpoint

## 🔄 Update Username

This endpoint allows authenticated users to change their username. After updating, a new JWT token is returned with the updated username.

```http
PUT /auth/update-username
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "newUsername": "new_username_123"
}

Success Response (200):
{
  "message": "Username updated successfully",
  "data": {
    "username": "new_username_123",
    "email": "user@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // New JWT token with updated username
  }
}

Error Responses:
- 400: Missing newUsername, invalid username format, or username already taken
- 401: Unauthorized (missing/invalid token)
- 404: User not found
- 500: Server error
```

## Username Validation Rules

- **Length**: 3-20 characters
- **Allowed characters**: Letters (a-z, A-Z), numbers (0-9), underscores (_), and hyphens (-)
- **Not allowed**: Spaces, special characters, or other symbols

## Frontend Implementation Example

### React Example

```javascript
import { useState } from 'react';
import api from './api'; // Your axios instance

const UpdateUsername = () => {
  const [newUsername, setNewUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpdateUsername = async () => {
    // Validation
    if (!newUsername.trim()) {
      setError('Username is required');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(newUsername)) {
      setError('Username must be 3-20 characters and can only contain letters, numbers, underscores, and hyphens');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put('/auth/update-username', {
        newUsername: newUsername.trim()
      });

      // Update token in localStorage
      localStorage.setItem('token', response.data.data.token);
      
      // Update user state/context with new username
      // updateUserContext({ username: response.data.data.username });
      
      setSuccess('Username updated successfully!');
      setIsEditing(false);
      
      // Optionally refresh the page or update global state
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update username');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="username-section">
      {!isEditing ? (
        <div>
          <span>Username: {currentUsername}</span>
          <button onClick={() => setIsEditing(true)}>Edit</button>
        </div>
      ) : (
        <div>
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Enter new username"
            maxLength={20}
          />
          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}
          <button onClick={handleUpdateUsername} disabled={loading}>
            {loading ? 'Updating...' : 'Save'}
          </button>
          <button onClick={() => {
            setIsEditing(false);
            setNewUsername('');
            setError('');
          }}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default UpdateUsername;
```

### JavaScript/API Function

```javascript
// Update username function
const updateUsername = async (newUsername) => {
  try {
    const response = await api.put('/auth/update-username', {
      newUsername: newUsername.trim()
    });
    
    // IMPORTANT: Update the token in localStorage
    localStorage.setItem('token', response.data.data.token);
    
    return {
      success: true,
      username: response.data.data.username,
      token: response.data.data.token,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update username'
    };
  }
};
```

## Important Notes

1. **Token Update**: After successful username update, the backend returns a new JWT token. **You MUST update the token in localStorage/sessionStorage** because the token contains the username, and it needs to be refreshed.

2. **Username Validation**: Validate on the frontend before sending the request:
   - Length: 3-20 characters
   - Pattern: `/^[a-zA-Z0-9_-]{3,20}$/`

3. **Error Handling**: 
   - If username is already taken, show: "Username already taken"
   - If format is invalid, show: "Username must be 3-20 characters and can only contain letters, numbers, underscores, and hyphens"

4. **UI/UX Suggestions**:
   - Show current username with an "Edit" button
   - When editing, show an input field with Save/Cancel buttons
   - Show loading state during API call
   - Display success/error messages
   - After successful update, refresh user data or reload the page

5. **State Management**: After updating username, update your global state/context with the new username and token to keep the UI in sync.

## Testing

Test cases to verify:
- ✅ Update username with valid format
- ✅ Try to update with invalid format (show error)
- ✅ Try to update with existing username (show error)
- ✅ Verify new token is saved after update
- ✅ Verify username is updated in UI after successful update
- ✅ Test with expired/invalid token (should get 401)
