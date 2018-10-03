# Schema Help

```json
{
    "smtp_from": "from email",
    "smtp_to": "to email",
    "smtp_host": "mail.example.com",
    "smtp_user": "username",
    "smtp_pass": "password",
    "smtp_port": 465,
    "use_ssl": true,
    "business_name": "niiknow",
    "recaptcha_secret": "your recaptcha2 secret key - empty to disable recaptcha2",
    "validate_origins": "a comma separated list of valid origins",
    "validate_honeypot": true,
    "form": {
        "id": "some guid",
        "redir": "https://www.example.com/thank-you-page",
        "email_field": "identify the email field on the form to send a copy"
    }
}
```
