# Auth Routes - Quick Reference

## Endpoints

### 1. Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "phone": "0771234567",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "businessName": "My Business",
  "businessType": "retail",
  "password": "SecurePassword123"
}

Response (201):
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": 1,
      "phone": "+256771234567",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "businessId": 1,
      "businessName": "My Business"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 2. Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "login": "0771234567",  // phone or email
  "password": "SecurePassword123"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "phone": "+256771234567",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "businessId": 1,
      "businessName": "My Business",
      "role": "owner",
      "permissions": {...},
      "isVerified": true,
      "userType": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 3. Get User Profile
```
GET /api/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Response (200):
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "phone": "+256771234567",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isVerified": true,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "business": {
        "id": 1,
        "name": "My Business",
        "type": "retail"
      },
      "role": "owner",
      "permissions": {...},
      "joinedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

### 4. Forgot Password
```
POST /api/auth/forgot-password
Content-Type: application/json

{
  "contact": "0771234567"  // phone or email
}

Response (200):
{
  "success": true,
  "message": "Reset code has been sent to your phone",
  "resetCode": "123456"  // Only in development
}
```

### 5. Reset Password
```
POST /api/auth/reset-password
Content-Type: application/json

{
  "contact": "0771234567",
  "resetCode": "123456",
  "newPassword": "NewPassword123"
}

Response (200):
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

### 6. Test Auth
```
GET /api/auth/test

Response (200):
{
  "success": true,
  "message": "Auth routes are working",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields: phone, firstName, lastName, businessName, password"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Business account is inactive"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "User with this phone number or email already exists"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Operation failed",
  "error": "Detailed error message (development only)"
}
```

## Validation Rules

### Phone Number
- Required for registration and login
- Formats accepted: `0771234567`, `+256771234567`, `256771234567`
- Automatically normalized to `+256771234567`

### Email
- Optional for registration
- Must be valid email format: `user@example.com`
- Validated with regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

### Password
- Required for registration and password reset
- Minimum 6 characters
- Hashed with bcrypt (10 salt rounds)
- Not returned in any response

### First Name / Last Name
- Required for registration
- String format
- No length restrictions

### Business Name
- Required for registration
- String format
- No length restrictions

### Business Type
- Optional (defaults to 'retail')
- Common values: 'retail', 'wholesale', 'service', etc.

## Constants

```typescript
BCRYPT_SALT_ROUNDS = 10
MIN_PASSWORD_LENGTH = 6
PASSWORD_RESET_EXPIRY_MS = 3600000 (1 hour)
TRIAL_DAYS = 60
DEFAULT_PHONE_PREFIX = '+256'
DEFAULT_CURRENCY = 'UGX'
DEFAULT_TIMEZONE = 'Africa/Kampala'
JWT_EXPIRES_IN = '7d' (from env)
```

## Utility Functions

### `normalizePhoneNumber(phone: string): string`
Converts phone numbers to standard format.
```typescript
normalizePhoneNumber('0771234567')  // '+256771234567'
normalizePhoneNumber('771234567')   // '+256771234567'
normalizePhoneNumber('+256771234567') // '+256771234567'
```

### `validateEmail(email: string): boolean`
Validates email format.
```typescript
validateEmail('test@example.com')  // true
validateEmail('invalid.email')     // false
```

### `validatePassword(password: string): { valid: boolean; message?: string }`
Validates password strength.
```typescript
validatePassword('short')  // { valid: false, message: '...' }
validatePassword('ValidPassword123')  // { valid: true }
```

### `sendErrorResponse(res: Response, statusCode: number, message: string, error?: string): void`
Sends standardized error response.
```typescript
sendErrorResponse(res, 400, 'Invalid input', 'Detailed error');
```

## Security Features

✅ **Password Security**
- Bcrypt hashing (10 rounds)
- Minimum 6 characters
- Async hashing (non-blocking)

✅ **JWT Security**
- JWT_SECRET validation
- Configurable expiry (default 7 days)
- Type-safe token payload

✅ **Input Validation**
- Email format validation
- Phone number normalization
- Required field validation
- Password strength validation

✅ **Error Handling**
- No sensitive data in production
- Proper error logging
- User enumeration prevention
- Generic error messages

✅ **Database Security**
- Parameterized queries
- Transaction management
- Connection pooling
- Proper cleanup

## Environment Variables

```bash
# Required
JWT_SECRET=your-secret-key-here
DB_HOST=localhost
DB_USER=dangotech_profsale
DB_PASSWORD=your-password
DB_NAME=dangotech_ptofsale

# Optional
JWT_EXPIRES_IN=7d
NODE_ENV=production
DB_PORT=3306
```

## Common Issues

### Issue: "JWT_SECRET is not configured"
**Solution:** Set `JWT_SECRET` environment variable

### Issue: "Invalid credentials"
**Solution:** Verify phone/email and password are correct

### Issue: "User with this phone number or email already exists"
**Solution:** Use different phone/email or login instead

### Issue: "Business account is inactive"
**Solution:** Contact support to reactivate account

### Issue: "Reset code has expired"
**Solution:** Request a new reset code (valid for 1 hour)

## Testing with cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0771234567",
    "email": "test@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "businessName": "Test Business",
    "password": "SecurePassword123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "0771234567",
    "password": "SecurePassword123"
  }'

# Get Profile (replace TOKEN with actual token)
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer TOKEN"

# Test
curl http://localhost:5000/api/auth/test
```

## Response Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Login successful, profile retrieved |
| 201 | Created | User registered successfully |
| 400 | Bad Request | Missing fields, invalid input |
| 401 | Unauthorized | Invalid credentials, missing token |
| 403 | Forbidden | Invalid/expired token, inactive account |
| 404 | Not Found | User not found |
| 409 | Conflict | User already exists |
| 500 | Server Error | Database error, unexpected error |

## Rate Limiting

Rate limiting is configured via middleware. Check `/src/middleware/rateLimiter.ts` for current limits.

## Logging

All errors are logged to console and log files. Check `/logs/` directory for detailed logs.

## Support

For issues or questions, refer to:
- `AUTH_BEST_PRACTICES.md` - Detailed explanations
- `AUTH_REFACTORING_SUMMARY.md` - What changed and why
- `src/routes/auth.routes.ts` - Source code with comments
