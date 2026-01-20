# Email Service Integration - Quick Start Guide

## ✅ What's Been Set Up

I've integrated a complete email service into your ProfSale application using Gmail SMTP. Here's what's ready:

### 1. **Email Service** (`backend/src/utils/emailService.ts`)

- Nodemailer configuration with Gmail SMTP
- 6 pre-built email templates
- Easy-to-use methods for sending emails

### 2. **Email Templates**

- ✉️ **Welcome Email** - Sent on user registration
- 🔐 **Password Reset Email** - Sent when user requests password reset
- ✅ **Email Verification** - Ready for email verification flow
- 👥 **Staff Invitation** - Ready for inviting staff members
- 📦 **Low Stock Alert** - Ready for inventory alerts
- 🧾 **Receipt Email** - Ready for sending purchase receipts

### 3. **Integration Points**

- User registration now sends welcome emails
- Password reset now sends reset code via email
- All other templates are ready to use when needed

### 4. **Database Migration**

- Created `password_resets` table migration

## 🚀 Setup Instructions

### Step 1: Configure Gmail App Password

1. **Enable 2-Factor Authentication** on your Gmail account:

   - Go to https://myaccount.google.com
   - Security → 2-Step Verification

2. **Generate App Password**:
   - Go to https://myaccount.google.com
   - Security → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Name it "ProfSale Backend"
   - Copy the 16-character password

### Step 2: Update Environment Variables

Edit `backend/.env` and update these values:

```env
# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password-here
EMAIL_FROM_NAME=ProfSale
EMAIL_FROM_ADDRESS=your-actual-email@gmail.com

# Application URL (for email links)
APP_URL=http://localhost:19006
```

Replace:

- `your-actual-email@gmail.com` with your Gmail address
- `your-16-char-app-password-here` with the app password from Step 1

### Step 3: Run Database Migration

Run the password_resets table migration:

```bash
cd backend
mysql -u root -p prof_sale < migrations/add_password_resets_table.sql
```

Or if using the migration runner:

```bash
cd backend
npm run db:migrate
```

### Step 4: Restart Your Backend Server

```bash
cd backend
npm run dev
```

You should see in the logs:

```
Email service is ready to send emails
```

## 🧪 Testing

### Test 1: Welcome Email on Registration

Register a new user with a valid email address:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0700000001",
    "email": "your-test-email@gmail.com",
    "firstName": "Test",
    "lastName": "User",
    "businessName": "Test Business",
    "businessType": "retail",
    "password": "password123"
  }'
```

Check your email inbox for the welcome email!

### Test 2: Password Reset Email

Request a password reset:

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "contact": "your-test-email@gmail.com"
  }'
```

Check your email for the reset code.

### Test 3: Optional - Direct Email Test

You can add this test endpoint to `backend/src/routes/auth.routes.ts`:

```typescript
router.post('/test-email', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const result = await emailService.sendEmail({
      to: email,
      subject: 'Test Email from ProfSale',
      html: '<h1>Success!</h1><p>Your email service is working correctly.</p>',
    });

    res.json({
      success: result,
      message: result ? 'Email sent!' : 'Failed to send',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});
```

## 📧 How to Use the Email Service

### In Your Code

Import the email service:

```typescript
import { emailService } from '../utils/emailService';
```

### Send Welcome Email

```typescript
await emailService.sendWelcomeEmail('user@example.com', 'John', 'My Business');
```

### Send Password Reset Email

```typescript
await emailService.sendPasswordResetEmail(
  'user@example.com',
  'John',
  '123456', // reset token/code
);
```

### Send Staff Invitation

```typescript
await emailService.sendStaffInviteEmail(
  'staff@example.com',
  'Jane Doe',
  'My Business',
  'tempPassword123',
);
```

### Send Low Stock Alert

```typescript
await emailService.sendLowStockAlert('owner@example.com', 'My Business', [
  { name: 'Product A', quantity: 5 },
  { name: 'Product B', quantity: 2 },
]);
```

### Send Receipt Email

```typescript
await emailService.sendReceiptEmail('customer@example.com', 'Customer Name', {
  receiptNumber: 'RCP-001',
  date: new Date(),
  businessName: 'My Business',
  items: [
    { name: 'Item 1', quantity: 2, price: 5000, total: 10000 },
    { name: 'Item 2', quantity: 1, price: 15000, total: 15000 },
  ],
  total: 25000,
});
```

### Send Custom Email

```typescript
await emailService.sendEmail({
  to: 'recipient@example.com',
  subject: 'Your Subject',
  html: '<h1>Your HTML content</h1>',
  text: 'Plain text fallback', // optional
});
```

## 🔍 Where Emails Are Sent

### Currently Active

1. **User Registration** (`/api/auth/register`)

   - Sends welcome email to new users
   - File: `backend/src/routes/auth.routes.ts` (line ~158)

2. **Password Reset** (`/api/auth/forgot-password`)
   - Sends reset code via email
   - File: `backend/src/routes/auth.routes.ts` (line ~534)

### Ready to Use (Not Yet Integrated)

These templates are created but not yet integrated:

- Email verification
- Staff invitations
- Low stock alerts
- Receipt emails

You can integrate them when needed!

## 📊 Email Service Features

- ✅ Gmail SMTP integration
- ✅ Beautiful HTML email templates
- ✅ Responsive design (mobile-friendly)
- ✅ Automatic error handling
- ✅ Non-blocking email sending (won't slow down API responses)
- ✅ Logging for debugging
- ✅ Development and production ready

## ⚠️ Important Notes

1. **Gmail Limits**: Free Gmail accounts can send up to 500 emails/day
2. **App Password**: Use the 16-character app password, NOT your regular password
3. **Security**: Never commit your `.env` file to version control
4. **Production**: For high-volume emails, consider SendGrid, Amazon SES, or Mailgun

## 🐛 Troubleshooting

### "Invalid login" error

- Make sure you're using an App Password
- Verify 2-Step Verification is enabled
- Regenerate the app password

### Emails not received

- Check spam/junk folder
- Verify email address is correct
- Check backend logs for errors

### Connection timeout

- Check internet connection
- Ensure port 587 is not blocked
- Try port 465 with `EMAIL_SECURE=true`

## 📚 More Information

For detailed setup instructions, see [GMAIL_SETUP_GUIDE.md](./GMAIL_SETUP_GUIDE.md)

## ✨ Next Steps

1. ✅ Configure Gmail credentials in `.env`
2. ✅ Run the database migration
3. ✅ Test the email functionality
4. 🔜 Implement email verification flow
5. 🔜 Add staff invitation emails
6. 🔜 Set up low stock alerts
7. 🔜 Add receipt emails

---

**Your email service is ready to go! Just add your Gmail credentials and start sending emails! 🚀**
