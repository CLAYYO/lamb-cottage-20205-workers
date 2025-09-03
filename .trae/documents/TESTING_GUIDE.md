# Pages CMS Testing Guide for Lamb Cottage

This comprehensive testing guide ensures all Pages CMS functionality works correctly before going live.

## 1. Pre-Testing Setup

### Environment Verification
- [ ] Pages CMS deployed to Vercel
- [ ] Supabase database configured and accessible
- [ ] Resend email service active
- [ ] GitHub App connected and functional
- [ ] All environment variables set correctly
- [ ] Custom domain configured (if applicable)

### Test Accounts
Create test accounts for different user roles:

1. **Admin Account**: `admin@lambcottage.com`
2. **Editor Account**: `editor@lambcottage.com`
3. **Viewer Account**: `viewer@lambcottage.com`

## 2. Authentication Testing

### User Registration
- [ ] **Test**: Sign up with new email address
- [ ] **Expected**: Account created successfully
- [ ] **Verify**: Welcome email received
- [ ] **Check**: User appears in Supabase users table

### User Login
- [ ] **Test**: Login with correct credentials
- [ ] **Expected**: Successful login, redirected to dashboard
- [ ] **Test**: Login with incorrect password
- [ ] **Expected**: Error message displayed
- [ ] **Test**: Login with non-existent email
- [ ] **Expected**: Appropriate error message

### Password Reset
- [ ] **Test**: Request password reset
- [ ] **Expected**: Reset email sent
- [ ] **Verify**: Reset link works
- [ ] **Test**: Reset with expired link
- [ ] **Expected**: Error message for expired link
- [ ] **Test**: Complete password reset process
- [ ] **Expected**: Can login with new password

### Session Management
- [ ] **Test**: Session persists across browser refresh
- [ ] **Test**: Session expires after timeout
- [ ] **Test**: Logout functionality
- [ ] **Expected**: Redirected to login page after logout

## 3. Content Management Testing

### Page Creation
- [ ] **Test**: Create new page as admin
- [ ] **Expected**: Page created successfully
- [ ] **Verify**: Page appears in pages list
- [ ] **Check**: Page data saved to database

#### Test Page Data
```markdown
Title: Test Page
Slug: test-page
Meta Title: Test Page - Lamb Cottage
Meta Description: This is a test page for functionality verification
Status: Draft
Content: 
# Test Page

This is a test page to verify Pages CMS functionality.

## Features to Test
- Content creation
- Image uploads
- Link functionality
```

### Page Editing
- [ ] **Test**: Edit existing page content
- [ ] **Expected**: Changes saved successfully
- [ ] **Test**: Edit page metadata (title, description)
- [ ] **Expected**: Metadata updated
- [ ] **Test**: Change page status (draft ↔ published)
- [ ] **Expected**: Status updated correctly

### Page Deletion
- [ ] **Test**: Delete page as admin
- [ ] **Expected**: Page removed from list
- [ ] **Verify**: Page data removed from database
- [ ] **Test**: Attempt to access deleted page URL
- [ ] **Expected**: 404 error or redirect

### Content Versioning
- [ ] **Test**: Make multiple edits to same page
- [ ] **Expected**: Version history maintained
- [ ] **Test**: Revert to previous version
- [ ] **Expected**: Content restored to selected version

## 4. Media Management Testing

### Image Upload
- [ ] **Test**: Upload single image
- [ ] **Expected**: Image uploaded successfully
- [ ] **Verify**: Image appears in media library
- [ ] **Check**: Image accessible via URL

#### Test Images
Prepare test images:
- Small image (< 1MB): `test-small.jpg`
- Large image (> 5MB): `test-large.jpg`
- Different formats: `.png`, `.gif`, `.webp`
- Invalid format: `.txt`, `.pdf`

### File Validation
- [ ] **Test**: Upload supported image formats
- [ ] **Expected**: All supported formats upload successfully
- [ ] **Test**: Upload unsupported file types
- [ ] **Expected**: Error message for unsupported types
- [ ] **Test**: Upload oversized files
- [ ] **Expected**: Error or automatic compression

### Media Organization
- [ ] **Test**: Create media folders
- [ ] **Expected**: Folders created successfully
- [ ] **Test**: Move images between folders
- [ ] **Expected**: Images moved correctly
- [ ] **Test**: Delete media files
- [ ] **Expected**: Files removed from storage

### Image Integration
- [ ] **Test**: Insert image into page content
- [ ] **Expected**: Image displays in editor
- [ ] **Test**: Preview page with images
- [ ] **Expected**: Images display correctly on frontend
- [ ] **Test**: Image alt text and captions
- [ ] **Expected**: Accessibility attributes present

## 5. User Role Testing

### Admin Role
- [ ] **Test**: Access all admin functions
- [ ] **Test**: Create/edit/delete pages
- [ ] **Test**: Manage users
- [ ] **Test**: Access site settings
- [ ] **Test**: View analytics/reports

### Editor Role
- [ ] **Test**: Create and edit pages
- [ ] **Test**: Upload media
- [ ] **Test**: Cannot access user management
- [ ] **Test**: Cannot access site settings
- [ ] **Expected**: Appropriate permissions enforced

### Viewer Role
- [ ] **Test**: Can view pages in admin
- [ ] **Test**: Cannot edit content
- [ ] **Test**: Cannot upload media
- [ ] **Test**: Cannot access admin functions
- [ ] **Expected**: Read-only access only

## 6. GitHub Integration Testing

### Repository Connection
- [ ] **Test**: Verify GitHub App installation
- [ ] **Expected**: App appears in repository settings
- [ ] **Test**: Check webhook configuration
- [ ] **Expected**: Webhook URL points to Pages CMS

### Content Synchronization
- [ ] **Test**: Create page in Pages CMS
- [ ] **Expected**: Commit appears in GitHub repository
- [ ] **Verify**: File created in correct directory
- [ ] **Check**: Commit message is descriptive

### Webhook Processing
- [ ] **Test**: Make direct commit to GitHub
- [ ] **Expected**: Changes reflected in Pages CMS
- [ ] **Test**: Create pull request
- [ ] **Expected**: PR triggers appropriate webhook

### Conflict Resolution
- [ ] **Test**: Simultaneous edits (CMS + GitHub)
- [ ] **Expected**: Conflicts handled gracefully
- [ ] **Test**: Invalid content format in GitHub
- [ ] **Expected**: Error handling and user notification

## 7. Email Functionality Testing

### Welcome Emails
- [ ] **Test**: New user registration
- [ ] **Expected**: Welcome email sent via Resend
- [ ] **Verify**: Email content and formatting
- [ ] **Check**: Links in email work correctly

### Password Reset Emails
- [ ] **Test**: Password reset request
- [ ] **Expected**: Reset email delivered
- [ ] **Test**: Reset link functionality
- [ ] **Expected**: Link works and expires appropriately

### Notification Emails
- [ ] **Test**: Content update notifications
- [ ] **Expected**: Admins notified of changes
- [ ] **Test**: User invitation emails
- [ ] **Expected**: Invitations sent and functional

### Email Deliverability
- [ ] **Check**: Emails not going to spam
- [ ] **Verify**: Sender reputation good
- [ ] **Test**: Different email providers (Gmail, Outlook, etc.)
- [ ] **Monitor**: Resend dashboard for delivery stats

## 8. Performance Testing

### Page Load Speed
- [ ] **Test**: Homepage load time
- [ ] **Target**: < 3 seconds
- [ ] **Test**: Admin dashboard load time
- [ ] **Target**: < 5 seconds
- [ ] **Test**: Large page with images
- [ ] **Target**: < 5 seconds

### Database Performance
- [ ] **Test**: Page listing with 50+ pages
- [ ] **Expected**: Loads within reasonable time
- [ ] **Test**: Search functionality
- [ ] **Expected**: Results returned quickly
- [ ] **Monitor**: Supabase performance metrics

### Image Optimization
- [ ] **Test**: Large image upload
- [ ] **Expected**: Automatic optimization/compression
- [ ] **Test**: Image serving speed
- [ ] **Expected**: Fast delivery via CDN

## 9. SEO and Frontend Testing

### Meta Tags
- [ ] **Test**: Page meta titles display correctly
- [ ] **Test**: Meta descriptions present
- [ ] **Test**: Open Graph tags for social sharing
- [ ] **Test**: Structured data markup

### URL Structure
- [ ] **Test**: Clean, SEO-friendly URLs
- [ ] **Test**: URL slug generation
- [ ] **Test**: Redirect handling for changed URLs

### Frontend Rendering
- [ ] **Test**: Pages render correctly
- [ ] **Test**: Navigation works
- [ ] **Test**: Responsive design on mobile
- [ ] **Test**: Cross-browser compatibility

## 10. Security Testing

### Authentication Security
- [ ] **Test**: SQL injection attempts
- [ ] **Expected**: Blocked by Supabase RLS
- [ ] **Test**: XSS attempts in content
- [ ] **Expected**: Content sanitized
- [ ] **Test**: CSRF protection
- [ ] **Expected**: Invalid requests blocked

### File Upload Security
- [ ] **Test**: Upload malicious files
- [ ] **Expected**: Files rejected or sanitized
- [ ] **Test**: File type validation
- [ ] **Expected**: Only allowed types accepted

### Access Control
- [ ] **Test**: Direct URL access to admin pages
- [ ] **Expected**: Redirected to login if not authenticated
- [ ] **Test**: API endpoint security
- [ ] **Expected**: Proper authentication required

## 11. Mobile and Accessibility Testing

### Mobile Responsiveness
- [ ] **Test**: Admin interface on mobile
- [ ] **Expected**: Usable on small screens
- [ ] **Test**: Content editing on mobile
- [ ] **Expected**: Editor functions work
- [ ] **Test**: Image upload on mobile
- [ ] **Expected**: Upload process works

### Accessibility
- [ ] **Test**: Keyboard navigation
- [ ] **Expected**: All functions accessible via keyboard
- [ ] **Test**: Screen reader compatibility
- [ ] **Expected**: Proper ARIA labels and structure
- [ ] **Test**: Color contrast
- [ ] **Expected**: Meets WCAG guidelines

## 12. Backup and Recovery Testing

### Data Backup
- [ ] **Test**: Manual database backup
- [ ] **Expected**: Backup created successfully
- [ ] **Test**: Automatic backup schedule
- [ ] **Expected**: Backups created on schedule

### Recovery Testing
- [ ] **Test**: Restore from backup
- [ ] **Expected**: Data restored correctly
- [ ] **Test**: Point-in-time recovery
- [ ] **Expected**: Specific timestamp restored

## 13. Load Testing

### Concurrent Users
- [ ] **Test**: 10 simultaneous users
- [ ] **Expected**: System remains responsive
- [ ] **Test**: 50 simultaneous page views
- [ ] **Expected**: Pages load within acceptable time

### Content Volume
- [ ] **Test**: 100+ pages in system
- [ ] **Expected**: Admin interface remains fast
- [ ] **Test**: Large media library (500+ files)
- [ ] **Expected**: Media browser performs well

## 14. Integration Testing

### Third-Party Services
- [ ] **Test**: Supabase connection under load
- [ ] **Expected**: Stable database performance
- [ ] **Test**: Resend email delivery
- [ ] **Expected**: Emails sent reliably
- [ ] **Test**: GitHub API integration
- [ ] **Expected**: Commits and webhooks work

### API Endpoints
- [ ] **Test**: All API routes respond correctly
- [ ] **Test**: Error handling for failed requests
- [ ] **Test**: Rate limiting (if implemented)
- [ ] **Expected**: Appropriate responses for all scenarios

## 15. User Acceptance Testing

### Content Editor Workflow
- [ ] **Test**: Complete content creation workflow
- [ ] **Test**: Content editing and publishing
- [ ] **Test**: Media management tasks
- [ ] **Expected**: Intuitive and efficient process

### Admin Management Tasks
- [ ] **Test**: User management workflow
- [ ] **Test**: Site configuration changes
- [ ] **Test**: System monitoring and maintenance
- [ ] **Expected**: All admin tasks completable

## 16. Final Pre-Launch Checklist

### Technical Verification
- [ ] All tests passed successfully
- [ ] Performance meets requirements
- [ ] Security measures in place
- [ ] Backup systems functional
- [ ] Monitoring configured

### Content Verification
- [ ] All Lamb Cottage content migrated
- [ ] Images optimized and accessible
- [ ] SEO elements in place
- [ ] Contact forms functional
- [ ] Navigation working correctly

### Documentation
- [ ] User guides created
- [ ] Admin documentation complete
- [ ] Troubleshooting guides available
- [ ] Emergency procedures documented

## 17. Post-Launch Monitoring

### First 24 Hours
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify email delivery
- [ ] Test contact forms
- [ ] Monitor user activity

### First Week
- [ ] Daily performance checks
- [ ] User feedback collection
- [ ] Content editor training
- [ ] SEO performance monitoring
- [ ] Backup verification

### First Month
- [ ] Weekly system health checks
- [ ] Performance optimization
- [ ] User experience improvements
- [ ] Security audit
- [ ] Content strategy review

## 18. Testing Tools and Resources

### Automated Testing Tools
- **Lighthouse**: Performance and SEO auditing
- **GTmetrix**: Page speed analysis
- **WAVE**: Accessibility testing
- **Screaming Frog**: SEO crawling

### Manual Testing Checklist
```
□ Authentication flows
□ Content management
□ Media handling
□ User permissions
□ Email functionality
□ GitHub integration
□ Performance benchmarks
□ Security measures
□ Mobile responsiveness
□ Accessibility compliance
```

## 19. Issue Tracking

### Bug Report Template
```
**Issue**: Brief description
**Steps to Reproduce**: 
1. Step one
2. Step two
3. Step three

**Expected Result**: What should happen
**Actual Result**: What actually happened
**Browser/Device**: Testing environment
**Severity**: Critical/High/Medium/Low
**Screenshots**: If applicable
```

### Resolution Tracking
- [ ] All critical issues resolved
- [ ] High priority issues addressed
- [ ] Medium issues documented for future releases
- [ ] Low priority issues logged

## 20. Sign-Off

### Technical Sign-Off
- [ ] **Developer**: All functionality tested and working
- [ ] **System Admin**: Infrastructure stable and secure
- [ ] **QA**: All test cases passed

### Business Sign-Off
- [ ] **Content Manager**: Content migration successful
- [ ] **Site Owner**: Functionality meets requirements
- [ ] **Project Manager**: Ready for production launch

---

**Testing Complete**: All systems verified and ready for production deployment of Lamb Cottage Pages CMS.

**Next Step**: Go-live and legacy system removal