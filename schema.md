# Schema Help

```json
{
    "smtp_from": "from email",
    "smtp_host": "mail.example.com",
    "smtp_user": "username",
    "smtp_pass": "password",
    "smtp_port": 465,
    "smtp_insecure": false,
    "business_name": "niiknow",
    "validate_recaptcha": {
      "site_key": "the site key",
      "secret_key": "the secret key",
      "field": "the form field name, default g-recaptcha-response"
    },
    "validate_origins": "a comma separated list of valid origins",
    "validate_honeypot": "honeypot field name",
    "id": "some guid representing the form id",
    "name": "User friendly name for this form",
    "admin_email": "who to notify user's sumission to",
    "admin_subject": "the subject to notify admin_email with",
    "admin_body": "actual mjml template or empty to use index-admin.mjml",
    "redir": "https://www.example.com/thank-you-page",
    "email_user": "identify the email field on the form to send a copy",
    "user_subject": "user subject, can be templated like admin_subject",
    "user_body": "actual mjml template or empty to use index-user.mjml"
}
```
