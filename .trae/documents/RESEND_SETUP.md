# Resend Email Service Setup Guide for Pages CMS

This guide provides step-by-step instructions for setting up Resend email service to handle authentication emails, notifications, and other email functionality in Pages CMS.

## 1. Prerequisites

- Domain name (optional - can use Resend's domain)
- Access to DNS management (if using custom domain)
- Pages CMS project ready for deployment

## 2. Create Resend Account

### 2.1 Sign Up
1. Go to [resend.com](https://resend.com)
2. Click **Sign Up**
3. Enter your email address and create a password
4. Verify your email address
5. Complete the onboarding process

### 2.2 Account Verification
1. Log in to your Resend dashboard
2. Complete any required account verification steps
3. Note your account limits:
   - **Free tier**: 3,000 emails/month, 100 emails/day
   - **Pro tier**: $20/month for 50,000 emails/month

## 3. Domain Configuration

### Option A: Use Resend Domain (Easiest)
Resend provides a default sending domain that works immediately:
- **From address**: `noreply@resend.dev`
- **No DNS setup required**
- **Good for testing and development**

### Option B: Custom Domain (Recommended for Production)

#### 3.1 Add Your Domain
1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `lambcottage.com`)
4. Click **Add Domain**

#### 3.2 DNS Configuration
Add the following DNS records to your domain:

**SPF Record (TXT)**
```
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

**DKIM Records (CNAME)**
```
Name: resend._domainkey
Value: resend._domainkey.resend.com

Name: resend2._domainkey
Value: resend2._domainkey.resend.com
```

**DMARC Record (TXT) - Optional but Recommended**
```
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

#### 3.3 Verify Domain
1. After adding DNS records, wait 5-10 minutes
2. In Resend dashboard, click **Verify** next to your domain
3. Check that all records show as verified
4. Domain status should change to **Verified**

## 4. Generate API Key

### 4.1 Create API Key
1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Configure the key:
   - **Name**: `Pages CMS Production` (or appropriate name)
   - **Permission**: **Full access** (or **Sending access** for production)
   - **Domain**: Select your verified domain (or leave blank for resend.dev)
4. Click **Add**
5. **Important**: Copy the API key immediately - it won't be shown again

### 4.2 Store API Key Securely
```env
# Save this for Pages CMS environment variables
RESEND_API_KEY=re_xxxxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxx
```

## 5. Email Templates Configuration

### 5.1 Authentication Email Template
Pages CMS uses these email types:
- **Magic Link Login**: For passwordless authentication
- **Password Reset**: For password recovery
- **Email Verification**: For new account verification
- **Invitation**: For team member invitations

### 5.2 Configure From Address
Choose your from address based on domain setup:

**Using Resend Domain:**
```env
FROM_EMAIL=noreply@resend.dev
FROM_NAME=Lamb Cottage CMS
```

**Using Custom Domain:**
```env
FROM_EMAIL=noreply@lambcottage.com
FROM_NAME=Lamb Cottage CMS
```

## 6. Pages CMS Integration

### 6.1 Environment Variables
Add these environment variables to your Pages CMS deployment:

```env
# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@lambcottage.com
FROM_NAME=Lamb Cottage CMS

# Admin Configuration
ADMIN_EMAIL=admin@lambcottage.com
SUPPORT_EMAIL=support@lambcottage.com
```

### 6.2 Email Configuration in Pages CMS
Pages CMS will automatically use Resend for:
- User authentication emails
- Password reset emails
- Admin notifications
- Content approval notifications

## 7. Testing Email Delivery

### 7.1 Test API Connection
Use this curl command to test your API key:

```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "noreply@yourdomain.com",
    "to": ["test@example.com"],
    "subject": "Test Email",
    "html": "<p>This is a test email from Resend!</p>"
  }'
```

### 7.2 Test Through Pages CMS
1. Deploy Pages CMS with Resend configuration
2. Try to sign up for a new account
3. Check that verification email is received
4. Test password reset functionality
5. Verify all emails are delivered promptly

### 7.3 Check Email Delivery
1. In Resend dashboard, go to **Logs**
2. Monitor email delivery status
3. Check for any bounces or delivery failures
4. Review email content and formatting

## 8. Production Optimization

### 8.1 Email Deliverability Best Practices

**Domain Reputation:**
- Use a dedicated subdomain for emails (e.g., `mail.lambcottage.com`)
- Gradually increase sending volume
- Monitor bounce rates and spam complaints

**Content Optimization:**
- Use clear, descriptive subject lines
- Include both HTML and plain text versions
- Avoid spam trigger words
- Include unsubscribe links where appropriate

**Authentication:**
- Ensure SPF, DKIM, and DMARC are properly configured
- Monitor authentication status in Resend logs
- Use consistent from addresses

### 8.2 Monitoring and Analytics

**Resend Dashboard Metrics:**
- Delivery rates
- Open rates (if tracking enabled)
- Bounce rates
- Spam complaints

**Set Up Alerts:**
1. Go to **Settings** > **Webhooks**
2. Configure webhooks for:
   - Delivery failures
   - Bounces
   - Spam complaints
3. Point webhooks to your monitoring system

## 9. Troubleshooting

### 9.1 Common Issues

**Emails Not Sending:**
- Verify API key is correct and has proper permissions
- Check that from address matches verified domain
- Ensure API key hasn't expired or been revoked
- Check Resend dashboard for error messages

**Emails Going to Spam:**
- Verify SPF, DKIM, and DMARC records
- Check domain reputation
- Review email content for spam triggers
- Ensure consistent from address

**DNS Verification Failing:**
- Wait longer for DNS propagation (up to 24 hours)
- Verify DNS records are exactly as specified
- Check with DNS provider for any restrictions
- Use DNS lookup tools to verify records

### 9.2 Debug Steps

**1. Test API Key:**
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.resend.com/domains
```

**2. Check DNS Records:**
```bash
# Check SPF record
dig TXT yourdomain.com | grep spf

# Check DKIM records
dig CNAME resend._domainkey.yourdomain.com
```

**3. Monitor Logs:**
- Check Resend dashboard logs
- Review Pages CMS server logs
- Check email client spam folders

### 9.3 Rate Limiting

**Free Tier Limits:**
- 100 emails per day
- 3,000 emails per month
- Rate limit: 1 email per second

**Handling Rate Limits:**
- Implement email queuing in high-traffic scenarios
- Consider upgrading to Pro plan for higher limits
- Monitor usage in Resend dashboard

## 10. Security Best Practices

### 10.1 API Key Security
- Store API keys in environment variables only
- Never commit API keys to version control
- Use different API keys for development and production
- Regularly rotate API keys
- Use minimal required permissions

### 10.2 Email Security
- Always use HTTPS for webhook endpoints
- Validate webhook signatures
- Implement email rate limiting
- Monitor for suspicious sending patterns

## 11. Cost Management

### 11.1 Pricing Tiers

**Free Tier:**
- 3,000 emails/month
- 100 emails/day
- Basic support

**Pro Tier ($20/month):**
- 50,000 emails/month
- No daily limits
- Priority support
- Advanced analytics

### 11.2 Usage Monitoring
1. Set up usage alerts in Resend dashboard
2. Monitor monthly email volume
3. Plan for growth and upgrade timing
4. Consider email optimization to reduce volume

## 12. Integration with Cloudflare Pages

### 12.1 Environment Variables in Cloudflare
When deploying to Cloudflare Pages, add these variables:

```env
RESEND_API_KEY=re_xxxxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@lambcottage.com
FROM_NAME=Lamb Cottage CMS
ADMIN_EMAIL=admin@lambcottage.com
```

### 12.2 Webhook Configuration
If using webhooks for email events:

1. Set webhook URL to: `https://your-cms.pages.dev/api/webhooks/resend`
2. Configure webhook events in Resend dashboard
3. Implement webhook handler in Pages CMS

## 13. Next Steps

After completing Resend setup:

✅ **Completed**: Resend email service configured

**Next Steps**:
1. Deploy Pages CMS with email configuration
2. Test all email functionality
3. Set up monitoring and alerts
4. Configure content migration

## 14. Support Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [DNS Configuration Help](https://resend.com/docs/dashboard/domains/introduction)
- [Resend Community](https://github.com/resendlabs/resend)

---

**Important**: Test email delivery thoroughly before going live. Keep your API keys secure and monitor email delivery rates regularly.