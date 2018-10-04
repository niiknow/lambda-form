# Schema Help

```json
{
    "smtp_from": "from email",
    "smtp_to": "to email",
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
    "form_id": "some guid",
    "form_name": "User friendly name for this form",
    "redir": "https://www.example.com/thank-you-page",
    "email_user": "identify the email field on the form to send a copy",
    "admin_subject": "",
    "user_subject": "",
    "admin_body": "",
    "user_body": ""
}
```
