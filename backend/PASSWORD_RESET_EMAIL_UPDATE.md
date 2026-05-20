# Password Reset Email Update - Mobile-First Design

## Overview
Updated the password reset email template to display the reset code directly instead of a clickable link, optimized for the ProfSale mobile app.

## Changes Made

### File Modified
- `/src/utils/emailService.ts`

### What Changed

**Before:**
- Email contained a clickable reset link
- Link format: `https://app.profsale.com/reset-password?token=abc123`
- User had to click link or copy-paste URL
- Not ideal for mobile users

**After:**
- Email displays a prominent reset code
- Code format: Large, easy-to-read 6-digit code
- User enters code directly in the mobile app
- Better UX for mobile-first application

## Email Template Features

### 1. Prominent Reset Code Display
```
┌─────────────────────────────┐
│  Your Reset Code:           │
│  123456                     │
│  Expires in 1 hour          │
└─────────────────────────────┘
```

### 2. Step-by-Step Instructions
Clear instructions for mobile app users:
1. Open the ProfSale mobile app
2. Go to the Login screen
3. Tap "Forgot Password?"
4. Enter your phone number or email
5. Enter the reset code
6. Create your new password
7. Log in with your new password

### 3. Security Notice
- Warning about code confidentiality
- Note that ProfSale support will never ask for the code
- Expiration time clearly stated (1 hour)

### 4. Professional Design
- Orange header matching ProfSale branding
- Yellow highlighted code box for visibility
- Clear typography and spacing
- Mobile-responsive layout

## Implementation Details

### Function Signature
```typescript
async sendPasswordResetEmail(
  email: string,
  firstName: string,
  resetCode: string,  // Changed from resetToken
): Promise<boolean>
```

### Email Content
- **Subject:** "Reset Your ProfSale Password"
- **Code Format:** 6-digit numeric code (e.g., "123456")
- **Expiration:** 1 hour
- **Delivery:** Via Gmail SMTP (configured in .env)

## Integration with Auth Routes

The auth routes already generate reset codes:
```typescript
// From auth.routes.ts
const resetCode = Math.random().toString().slice(2, 8); // 6-digit code

// Send email with code
await emailService.sendPasswordResetEmail(
  user.email,
  user.first_name,
  resetCode
);
```

## Mobile App Integration

The mobile app's forgot password flow:
1. User enters phone/email
2. Backend generates 6-digit code
3. Email sent with code
4. User enters code in app
5. Backend verifies code
6. User sets new password

## Benefits

✅ **Mobile-Optimized** - No need to click links or copy URLs  
✅ **Better UX** - Simple 6-digit code entry  
✅ **Security** - Code expires in 1 hour  
✅ **Clear Instructions** - Step-by-step guide for users  
✅ **Professional** - Branded email template  
✅ **Accessible** - Works on all devices and email clients  

## Testing

### Test Email
```bash
# Send test password reset email
curl -X POST http://localhost:8080/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"contact": "user@example.com"}'
```

### Expected Response (Development)
```json
{
  "success": true,
  "message": "Reset code has been sent to your email",
  "resetCode": "123456"
}
```

### Expected Email
- Contains reset code: "123456"
- Contains instructions
- Contains security notice
- Professional formatting

## Configuration

### Environment Variables
```bash
# .env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=profsaleug@gmail.com
EMAIL_PASSWORD=mzqcchbvscyvvicq
EMAIL_FROM_NAME=ProfSale
EMAIL_FROM_ADDRESS=noreply@profsale.com
```

## Security Considerations

1. **Code Expiration:** 1 hour (configurable)
2. **Code Format:** 6-digit numeric (1 million combinations)
3. **Rate Limiting:** Applied via middleware
4. **Email Verification:** Sent via authenticated SMTP
5. **No Sensitive Data:** Code not logged in plain text

## Future Enhancements

- [ ] SMS delivery option for reset codes
- [ ] Customizable code length
- [ ] Resend code functionality
- [ ] Code attempt limiting
- [ ] Multi-language email templates

## Rollback

If needed, revert to link-based reset:
1. Change `resetCode` parameter back to `resetToken`
2. Update template to include reset URL
3. Redeploy

## References

- `/src/routes/auth.routes.ts` - Password reset endpoint
- `/src/utils/emailService.ts` - Email service implementation
- `/src/config/database.ts` - Database configuration
