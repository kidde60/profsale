# Gmail Email Setup Guide for ProfSale

This guide will help you configure Gmail to send emails in your ProfSale application for registration, password reset, and other notifications.

## Prerequisites

- A Gmail account
- Access to your Gmail account settings

## Step 1: Enable 2-Factor Authentication (if not already enabled)

1. Go to your Google Account: https://myaccount.google.com
2. Navigate to **Security**
3. Under "Signing in to Google", select **2-Step Verification**
4. Follow the prompts to set up 2-Step Verification

## Step 2: Generate an App Password

Since Gmail requires secure authentication, you cannot use your regular Gmail password. You need to generate an "App Password".

1. Go to your Google Account: https://myaccount.google.com
2. Navigate to **Security**
3. Under "Signing in to Google", select **App passwords**
   - If you don't see this option, make sure 2-Step Verification is enabled
4. In the "Select app" dropdown, choose **Mail**
5. In the "Select device" dropdown, choose **Other (Custom name)**
6. Enter a custom name like "ProfSale Backend"
7. Click **Generate**
8. Google will display a 16-character app password
9. **Copy this password** - you won't be able to see it again

## Step 3: Update Your .env File

Update your `backend/.env` file with your Gmail credentials:

```env
# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_FROM_NAME=ProfSale
EMAIL_FROM_ADDRESS=your-actual-email@gmail.com
```

Replace:

- `your-actual-email@gmail.com` with your Gmail address
- `xxxx xxxx xxxx xxxx` with the 16-character app password you generated

**Important:**

- Use the 16-character app password, NOT your regular Gmail password
- You can remove the spaces from the app password: `xxxxxxxxxxxxxxxx`

## Step 4: Test the Email Service

### Option 1: Test via API endpoint

Create a test endpoint in your auth routes to send a test email:

```typescript
// Add this to backend/src/routes/auth.routes.ts
router.post('/test-email', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required',
      });
      return;
    }

    const result = await emailService.sendEmail({
      to: email,
      subject: 'Test Email from ProfSale',
      html: '<h1>Hello!</h1><p>This is a test email from your ProfSale application.</p>',
    });

    res.json({
      success: result,
      message: result ? 'Email sent successfully' : 'Failed to send email',
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: (error as Error).message,
    });
  }
});
```

Then test with:

```bash
curl -X POST http://localhost:5000/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@gmail.com"}'
```

### Option 2: Test by registering a new user

Simply register a new user with an email address and check if you receive the welcome email.

## Emails Currently Configured

The following email templates are configured in your application:

1. **Welcome Email** - Sent when a new user registers
2. **Password Reset Email** - Sent when a user requests a password reset
3. **Email Verification** - Template ready for email verification flow
4. **Staff Invitation** - Template ready for inviting staff members
5. **Low Stock Alert** - Template ready for inventory alerts
6. **Receipt Email** - Template ready for sending purchase receipts

## Troubleshooting

### Error: "Invalid login: 535-5.7.8 Username and Password not accepted"

- Make sure you're using an App Password, not your regular Gmail password
- Verify that 2-Step Verification is enabled on your Google Account
- Regenerate the App Password if necessary

### Error: "Connection timeout"

- Check your internet connection
- Ensure port 587 is not blocked by your firewall
- Try using port 465 with `EMAIL_SECURE=true`

### Error: "self signed certificate in certificate chain"

- This usually happens in development environments
- Add to your email service constructor (for development only):
  ```typescript
  tls: {
    rejectUnauthorized: false;
  }
  ```

### Emails not being received

- Check your spam/junk folder
- Verify the recipient email address is correct
- Check the backend logs for any error messages
- Make sure your Gmail account is not hitting sending limits

## Gmail Sending Limits

Free Gmail accounts have sending limits:

- **500 emails per day** for regular Gmail accounts
- **2000 emails per day** for Google Workspace accounts

For production with higher volume:

1. Consider using Google Workspace
2. Or use a dedicated email service like:
   - SendGrid
   - Amazon SES
   - Mailgun
   - Postmark

## Security Best Practices

1. **Never commit your .env file** to version control
2. **Use different email accounts** for development and production
3. **Rotate your app passwords** regularly
4. **Monitor your email sending** for unusual activity
5. **Implement rate limiting** on email-sending endpoints

## Optional: Add Environment Variable for App URL

Add this to your `.env` file for proper links in emails:

```env
# Application URL (for email links)
APP_URL=http://localhost:19006
```

In production, update this to your actual app URL:

```env
APP_URL=https://yourapp.com
```

## Next Steps

After setting up Gmail:

1. Test all email functionalities:

   - User registration
   - Password reset
   - Email verification (if implemented)

2. Consider implementing:

   - Email verification flow
   - Staff invitation emails
   - Low stock alerts
   - Receipt emails for customers

3. Set up email analytics to track:
   - Delivery rates
   - Open rates
   - Bounce rates

## Support

If you encounter any issues:

1. Check the backend logs: `backend/logs/`
2. Review the email service code: `backend/src/utils/emailService.ts`
3. Verify your Gmail settings
4. Check the troubleshooting section above

---

**Note:** This setup is suitable for development and small-scale production. For large-scale production applications, consider using a dedicated transactional email service.
