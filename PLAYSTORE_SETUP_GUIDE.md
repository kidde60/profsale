# ProfSale Play Store Setup Guide

## Overview
This guide walks you through setting up ProfSale on Google Play Store for distribution in Uganda and internationally.

## Prerequisites

Before starting, ensure you have:
- ✅ Google Play Developer Account ($25 one-time registration fee)
- ✅ Android App Bundle (AAB) file: `app-release.aab` (already built)
- ✅ Signing credentials configured (already done in gradle.properties)
- ✅ Privacy Policy and Terms of Service (already created)
- ✅ App icon (192x192 px minimum)
- ✅ Screenshots (at least 2, up to 8 per device type)
- ✅ Feature graphic (1024x500 px)

## Step 1: Create Google Play Developer Account

### 1.1 Register
1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create account"
3. Sign in with your Google account (or create one)
4. Accept the Developer Agreement and Policy
5. Pay the $25 registration fee

### 1.2 Complete Account Setup
1. Add your developer profile information
2. Verify your identity
3. Set up payment method
4. Complete business information

## Step 2: Create Your App on Play Store

### 2.1 Create New App
1. In Play Console, click "Create app"
2. Enter app name: **ProfSale**
3. Select default language: **English**
4. Select app type: **Business**
5. Select category: **Business** or **Productivity**
6. Indicate if it's free or paid: **Free**
7. Click "Create app"

### 2.2 Complete App Details

#### Store Listing
1. Go to **Store listing** section
2. Fill in the following:

**Short description (80 characters max):**
```
Professional Point of Sale System for Retail Businesses
```

**Full description (4000 characters max):**
```
ProfSale is a comprehensive Point of Sale (POS) system designed for retail businesses in Uganda and across Africa. Manage your inventory, sales, customers, and finances all in one place.

Key Features:
• Real-time inventory management
• Complete sales tracking and reporting
• Customer management with credit tracking
• Multi-user support with role-based permissions
• Offline functionality
• Detailed profit & loss reports
• Staff management and performance tracking
• Expense tracking
• Mobile and web access
• Secure data encryption

Perfect for:
• Retail shops
• Supermarkets
• Convenience stores
• Small to medium businesses

Get started with ProfSale today and streamline your business operations!
```

**App category:** Business

**Content rating:** Select appropriate rating

**Privacy policy:** https://your-domain.com/privacy-policy
(Update with your actual domain)

**Terms of Service:** https://your-domain.com/terms-of-service
(Update with your actual domain)

## Step 3: Add App Icon and Graphics

### 3.1 App Icon
- Size: 512 x 512 pixels
- Format: PNG or JPEG
- Must be a square
- No rounded corners (Play Store will add them)

### 3.2 Screenshots
1. Minimum: 2 screenshots per device type
2. Recommended: 4-8 screenshots
3. Sizes:
   - Phone: 1080 x 1920 px (9:16 aspect ratio)
   - Tablet: 1440 x 2560 px (9:16 aspect ratio)

**Suggested screenshots:**
- Dashboard/Home screen
- Sales/POS screen
- Products management
- Reports/Analytics
- Customer management
- Settings/Features

### 3.3 Feature Graphic
- Size: 1024 x 500 pixels
- Format: PNG or JPEG
- Used for promotional purposes

## Step 4: Upload APK/AAB

### 4.1 Prepare Release
1. Go to **Release** section
2. Click **Production** track
3. Click **Create new release**

### 4.2 Upload App Bundle
1. Click **Browse files** under "App bundles"
2. Select your `app-release.aab` file from:
   ```
   android/app/build/outputs/bundle/release/app-release.aab
   ```
3. Click **Upload**
4. Wait for validation (usually 5-10 minutes)

### 4.3 Review Release Details
1. Check app version code and version name
2. Review release notes:
   ```
   Version 1.0.0 - Initial Release
   
   Welcome to ProfSale! This is the first release of our comprehensive Point of Sale system.
   
   Features:
   - Complete inventory management
   - Sales tracking and reporting
   - Customer management
   - Multi-user support
   - Offline functionality
   - Detailed analytics
   
   Thank you for choosing ProfSale!
   ```

## Step 5: Content Rating Questionnaire

1. Go to **Content rating** section
2. Complete the questionnaire:
   - Violence: None
   - Sexual content: None
   - Profanity: None
   - Alcohol/Tobacco: None
   - Gambling: None
   - Other: None
3. Submit for rating

## Step 6: Target Audience

1. Go to **Target audience** section
2. Select:
   - **Intended users:** Businesses, Professionals
   - **Age range:** 18+
   - **Restrictions:** None

## Step 7: Data Safety

### 7.1 Data Collection
1. Go to **Data safety** section
2. Declare data collection:

**Personal data collected:**
- Email address (for account login)
- Phone number (for customer management)
- Business information
- Sales data
- Customer data (as entered by user)

**Data usage:**
- Service provision
- Account management
- Analytics and improvements
- Security and fraud prevention

**Data sharing:**
- Not shared with third parties
- Only shared with payment processors for transactions

**Data retention:**
- Account data: While account is active
- Transaction data: 7 years (for compliance)
- Customer data: As long as needed for business

**Data security:**
- SSL/TLS encryption in transit
- Encrypted storage at rest
- Regular security audits
- Access controls

**User rights:**
- Users can request data deletion
- Users can export their data
- Users can update their information

## Step 8: Pricing and Distribution

### 8.1 Pricing
1. Go to **Pricing and distribution**
2. Select **Free** (or paid if applicable)

### 8.2 Countries
1. Select countries where app is available
2. Recommended for initial launch:
   - Uganda (primary market)
   - Kenya
   - Tanzania
   - Rwanda
   - East Africa region
   - Worldwide (optional)

## Step 9: Review and Submit

### 9.1 Pre-launch Checklist
- [ ] App name and description complete
- [ ] Icon and screenshots uploaded
- [ ] Privacy policy linked
- [ ] Terms of Service linked
- [ ] Content rating completed
- [ ] Data safety form completed
- [ ] AAB file uploaded and validated
- [ ] Release notes added
- [ ] Target audience set
- [ ] Countries selected

### 9.2 Submit for Review
1. Review all sections for completeness
2. Ensure no errors or warnings
3. Click **Review release**
4. Review summary
5. Click **Start rollout to Production**

## Step 10: After Submission

### 10.1 Review Process
- Google Play review typically takes 24-48 hours
- You'll receive email notification when review is complete
- App may be rejected if it doesn't meet policies

### 10.2 Common Rejection Reasons
- Missing privacy policy
- Incomplete app description
- Low-quality screenshots
- Misleading app name or description
- Policy violations

### 10.3 If Rejected
1. Read rejection reason carefully
2. Make required changes
3. Upload new AAB
4. Resubmit for review

## Step 11: Post-Launch

### 11.1 Monitor Performance
1. Check **Analytics** section regularly
2. Monitor:
   - Downloads
   - Active installs
   - Crash rates
   - Ratings and reviews
   - User feedback

### 11.2 Update App
1. Fix bugs and issues
2. Add new features
3. Improve performance
4. Increment version code
5. Build new AAB
6. Upload and submit new release

### 11.3 Respond to Reviews
1. Monitor user reviews
2. Respond professionally to feedback
3. Address issues and concerns
4. Thank users for positive reviews

## Contact Information

**ProfSale Support:**
- Email: profsaleug@gmail.com
- Phone: +256771362017
- Location: Kampala, Uganda

## Important Links

- [Google Play Console](https://play.google.com/console)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)
- [Android App Bundle Documentation](https://developer.android.com/guide/app-bundle)
- [Play Store Listing Best Practices](https://developer.android.com/distribute/best-practices/launch)

## Compliance Checklist

- [x] Privacy Policy created and accessible
- [x] Terms of Service created and accessible
- [x] Data Protection and Privacy Act compliant (Uganda)
- [x] GDPR compliant (for EU users)
- [x] CCPA compliant (for California users)
- [x] App signing configured
- [x] AAB file generated
- [x] Contact information provided
- [x] Data safety form completed

## Timeline

**Typical Play Store Launch Timeline:**
1. **Day 1:** Create developer account and app listing
2. **Day 2:** Upload AAB and complete store listing
3. **Day 3:** Submit for review
4. **Day 4-5:** Review and approval
5. **Day 5:** App goes live on Play Store

## Support

For questions about Play Store setup:
1. Check [Google Play Help Center](https://support.google.com/googleplay)
2. Contact Google Play Support
3. Email: profsaleug@gmail.com
4. Phone: +256771362017

---

**Last Updated:** May 2026
**Version:** 1.0
**Status:** Ready for Play Store Launch
