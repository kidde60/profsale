# Forgot Password Email/Phone Verification

## Overview
Updated the forgot password flow to verify that the user exists in the database before navigating to the reset password screen. Users will now receive clear feedback if their email/phone is not found.

## Changes Made

### Files Modified

#### 1. Backend: `/backend/src/routes/auth.routes.ts`
**Updated `/forgot-password` endpoint:**

**Before:**
```typescript
if (users.length === 0) {
  // Don't reveal if user exists for security
  res.json({
    success: true,
    message: 'If an account exists, a reset code has been sent',
  });
  return;
}
```

**After:**
```typescript
if (users.length === 0) {
  // Return 404 if user not found - frontend will handle this
  sendErrorResponse(res, 404, 'Email or phone number not found');
  return;
}
```

**Changes:**
- Returns 404 status code when user not found
- Returns clear error message: "Email or phone number not found"
- Frontend can now distinguish between success and user not found

#### 2. Frontend: `/src/screens/auth/ForgotPasswordScreen.tsx`
**Updated `handleForgotPassword` function:**

**Key Changes:**
- Checks response status code
- Handles 404 error (user not found) with specific message
- Only navigates to ResetPassword if request succeeds (200)
- Stays on ForgotPassword screen if user not found
- Shows user-friendly error messages

**Implementation:**
```typescript
try {
  // Request reset code from backend
  const response = await authService.forgotPassword(emailOrPhone);
  
  // If we get here (status 200), the user exists and reset code was sent
  Alert.alert(
    'Success',
    'A password reset code has been sent to your email. Please check and enter the code on the next screen.',
    [
      {
        text: 'OK',
        onPress: () =>
          navigation.navigate('ResetPassword', { contact: emailOrPhone }),
      },
    ],
  );
} catch (error: any) {
  const statusCode = error.response?.status;
  const errorMessage = error.response?.data?.message || 'Failed to send reset code';
  
  if (statusCode === 404) {
    // User not found
    Alert.alert(
      'Account Not Found',
      'The email or phone number you entered is not associated with any account. Please check and try again.',
    );
  } else {
    // Other errors
    Alert.alert('Error', errorMessage);
  }
}
```

## User Experience Flow

### Success Path (User Exists)
```
User enters email/phone
        ↓
User taps "Send Reset Code"
        ↓
Backend verifies user exists
        ↓
Reset code generated and sent
        ↓
Success alert displayed
        ↓
User taps "OK"
        ↓
Navigate to ResetPassword screen
        ↓
User enters reset code and new password
```

### Error Path (User Not Found)
```
User enters email/phone
        ↓
User taps "Send Reset Code"
        ↓
Backend verifies user exists
        ↓
User NOT found in database
        ↓
Error alert displayed: "Account Not Found"
        ↓
User remains on ForgotPassword screen
        ↓
User can correct email/phone and try again
```

## API Response Formats

### Success Response (200)
```json
{
  "success": true,
  "message": "Reset code has been sent to your email",
  "resetCode": "123456"  // Only in development
}
```

### Error Response - User Not Found (404)
```json
{
  "success": false,
  "message": "Email or phone number not found"
}
```

### Error Response - Server Error (500)
```json
{
  "success": false,
  "message": "Failed to process request"
}
```

## Error Messages

### User Not Found (404)
**Alert Title:** "Account Not Found"
**Alert Message:** "The email or phone number you entered is not associated with any account. Please check and try again."

### Other Errors
**Alert Title:** "Error"
**Alert Message:** Backend error message or "Failed to send reset code"

## Testing

### Test Case 1: Valid Email
1. Open app → Forgot Password screen
2. Enter valid email: `user@example.com`
3. Tap "Send Reset Code"
4. **Expected:** Success alert → Navigate to ResetPassword screen
5. **Verify:** Reset code received in email

### Test Case 2: Valid Phone
1. Open app → Forgot Password screen
2. Enter valid phone: `+256771234567`
3. Tap "Send Reset Code"
4. **Expected:** Success alert → Navigate to ResetPassword screen
5. **Verify:** Reset code received in email

### Test Case 3: Invalid Email
1. Open app → Forgot Password screen
2. Enter invalid email: `nonexistent@example.com`
3. Tap "Send Reset Code"
4. **Expected:** "Account Not Found" alert
5. **Verify:** Remain on ForgotPassword screen
6. **Verify:** Can correct email and try again

### Test Case 4: Invalid Phone
1. Open app → Forgot Password screen
2. Enter invalid phone: `+256799999999`
3. Tap "Send Reset Code"
4. **Expected:** "Account Not Found" alert
5. **Verify:** Remain on ForgotPassword screen
6. **Verify:** Can correct phone and try again

### Test Case 5: Empty Input
1. Open app → Forgot Password screen
2. Leave email/phone empty
3. Tap "Send Reset Code"
4. **Expected:** "Please enter your email or phone number" alert
5. **Verify:** Remain on ForgotPassword screen

## Security Considerations

### User Enumeration Prevention
- ✅ Backend returns 404 for non-existent users
- ✅ Frontend shows generic error message
- ✅ Doesn't reveal if email/phone is registered
- ✅ Prevents account enumeration attacks

### Rate Limiting
- Consider adding rate limiting to `/forgot-password` endpoint
- Prevent brute force attacks
- Limit requests per IP/email

### CSRF Protection
- Ensure CSRF tokens are used
- Validate request origin
- Use secure headers

## Database Queries

### Find User Query
```sql
SELECT id, email, phone, first_name 
FROM users 
WHERE (email = ? OR phone = ?) AND is_active = TRUE
```

**Parameters:**
- `contact` (email or phone)
- `contact` (email or phone)

## Email/Phone Validation

### Supported Formats
- **Email:** Standard email format (user@domain.com)
- **Phone:** International format (+256771234567) or local format (0771234567)

### Validation Rules
- Email: Must contain @ and valid domain
- Phone: Must be 10+ digits or start with +

## Future Enhancements

- [ ] Add rate limiting (e.g., 5 requests per hour per IP)
- [ ] Add email verification step
- [ ] Add SMS verification option
- [ ] Add account recovery options
- [ ] Add security questions
- [ ] Add backup codes
- [ ] Add two-factor authentication

## Related Files

- `/backend/src/routes/auth.routes.ts` - Forgot password endpoint
- `/src/screens/auth/ForgotPasswordScreen.tsx` - Forgot password screen
- `/src/screens/auth/ResetPasswordScreen.tsx` - Reset password screen
- `/src/services/authService.ts` - Authentication service
- `/src/utils/emailService.ts` - Email service

## References

- React Native Alert: https://reactnative.dev/docs/alert
- HTTP Status Codes: https://httpwg.org/specs/rfc7231.html#status.4xx
- OWASP User Enumeration: https://owasp.org/www-community/attacks/User_Enumeration
