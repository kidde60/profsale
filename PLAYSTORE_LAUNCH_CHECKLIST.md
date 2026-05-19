# ProfSale Play Store Launch Checklist

## Pre-Launch Requirements

### Account & Registration
- [ ] Google Play Developer Account created
- [ ] $25 registration fee paid
- [ ] Developer profile completed
- [ ] Payment method added
- [ ] Business information verified

### App Build
- [ ] Android App Bundle (AAB) generated: `app-release.aab`
- [ ] Signing credentials configured in `gradle.properties`
- [ ] Version code incremented (e.g., 1)
- [ ] Version name set (e.g., 1.0.0)
- [ ] App tested on multiple devices
- [ ] No crashes or major bugs

### App Assets
- [ ] App icon created (512x512 px, PNG/JPEG)
- [ ] Feature graphic created (1024x500 px)
- [ ] Screenshots prepared (minimum 2 per device type):
  - [ ] Phone screenshots (1080x1920 px)
  - [ ] Tablet screenshots (1440x2560 px)
- [ ] All assets in high quality
- [ ] Screenshots show key features

### Legal & Compliance
- [ ] Privacy Policy created and accessible
  - [ ] Data collection practices explained
  - [ ] User rights documented
  - [ ] Contact information included
  - [ ] Uganda Data Protection Act compliance
- [ ] Terms of Service created and accessible
- [ ] Privacy Policy URL ready (or use in-app link)
- [ ] Terms of Service URL ready (or use in-app link)

### Content & Description
- [ ] App name finalized: **ProfSale**
- [ ] Short description written (80 characters max)
- [ ] Full description written (4000 characters max)
- [ ] App category selected: **Business**
- [ ] Content rating completed
- [ ] Target audience set: **18+, Professionals**
- [ ] Release notes prepared for version 1.0.0

### Data & Security
- [ ] Data safety form completed
- [ ] Data collection types declared
- [ ] Data usage purposes documented
- [ ] Data retention policies specified
- [ ] Data sharing practices disclosed
- [ ] Security measures documented
- [ ] User rights explained

### Distribution
- [ ] Target countries selected:
  - [ ] Uganda (primary)
  - [ ] Kenya
  - [ ] Tanzania
  - [ ] Rwanda
  - [ ] Other East African countries
- [ ] App set as free
- [ ] No restricted content
- [ ] No policy violations

## Play Store Setup Steps

### Step 1: Create App Listing
- [ ] Go to Google Play Console
- [ ] Click "Create app"
- [ ] Enter app name: ProfSale
- [ ] Select language: English
- [ ] Select type: Business
- [ ] Select category: Business
- [ ] Mark as free
- [ ] Click "Create app"

### Step 2: Complete Store Listing
- [ ] Add short description
- [ ] Add full description
- [ ] Add app icon
- [ ] Add feature graphic
- [ ] Add screenshots (2-8 per device)
- [ ] Add privacy policy link
- [ ] Add terms of service link
- [ ] Select content rating

### Step 3: Upload App Bundle
- [ ] Go to Release → Production
- [ ] Click "Create new release"
- [ ] Upload AAB file: `app-release.aab`
- [ ] Wait for validation
- [ ] Review version details
- [ ] Add release notes

### Step 4: Complete Forms
- [ ] Fill content rating questionnaire
- [ ] Complete data safety form
- [ ] Set target audience
- [ ] Select distribution countries
- [ ] Review all sections

### Step 5: Review & Submit
- [ ] Check all sections for completeness
- [ ] Verify no errors or warnings
- [ ] Review app preview
- [ ] Click "Review release"
- [ ] Click "Start rollout to Production"

## Post-Submission

### During Review (24-48 hours)
- [ ] Monitor email for review status
- [ ] Check Play Console for updates
- [ ] Prepare for potential rejections

### If Rejected
- [ ] Read rejection reason carefully
- [ ] Make required changes
- [ ] Build new AAB if needed
- [ ] Resubmit for review

### After Approval
- [ ] App appears on Play Store
- [ ] Share app link with users
- [ ] Monitor downloads and ratings
- [ ] Respond to user reviews
- [ ] Track analytics

## Important Files & Links

### Local Files
- AAB File: `/android/app/build/outputs/bundle/release/app-release.aab`
- Gradle Config: `/android/gradle.properties`
- Privacy Policy: `/web/src/pages/PrivacyPolicy.tsx`
- Terms of Service: `/web/src/pages/TermsOfService.tsx`
- Mobile Privacy Policy: `/src/screens/PrivacyPolicyScreen.tsx`

### External Links
- Google Play Console: https://play.google.com/console
- Google Play Policies: https://play.google.com/about/developer-content-policy/
- Android Documentation: https://developer.android.com/distribute

## Contact Information

**ProfSale:**
- Email: profsaleug@gmail.com
- Phone: +256771362017
- Location: Kampala, Uganda

## Version Information

- **App Name:** ProfSale
- **Version Code:** 1
- **Version Name:** 1.0.0
- **Min SDK:** 21 (Android 5.0)
- **Target SDK:** 34 (Android 14)
- **Package Name:** com.profsale (or your package name)

## Timeline

| Day | Task | Status |
|-----|------|--------|
| 1 | Create developer account | ⏳ |
| 2 | Create app listing | ⏳ |
| 3 | Upload AAB and assets | ⏳ |
| 4 | Submit for review | ⏳ |
| 5-6 | Google review | ⏳ |
| 7 | App goes live | ⏳ |

## Notes

- Keep all credentials secure
- Monitor app performance regularly
- Respond to user feedback promptly
- Plan regular updates and improvements
- Keep privacy policy and terms updated
- Maintain compliance with all regulations

## Success Criteria

✅ App successfully uploaded to Play Store
✅ App passes Google Play review
✅ App is available for download
✅ Users can install and use ProfSale
✅ Positive user ratings and reviews
✅ Growing user base in target markets

---

**Last Updated:** May 2026
**Status:** Ready for Launch
**Next Step:** Create Google Play Developer Account
