# Donation payment setup

The public donation page is `/donate`; `/donation` redirects there. Desktop and mobile Donate actions open `/donate`.

## Activate methods

1. Apply migrations in the running backend: `python manage.py migrate` (or `docker compose exec backend python manage.py migrate`).
2. Open Django admin → Donations → Donation payment settings and add the single configuration.
3. For bank transfer, enter the bank name, account holder and account number or IBAN. Set the receiving currency and any SWIFT/BIC or transfer instructions. These are public receiving details.
4. For PayPal, paste your organization's HTTPS donation link.
5. For CamPay, paste your merchant's HTTPS hosted payment link. The page presents separate MTN MoMo and Orange Money choices; both continue to CamPay, where the donor selects the network.

Use links issued for the organization's own receiving accounts. No secret keys or passwords belong in these settings. A method with missing configuration presents contact assistance instead of a payment action. The frontend's configured API must point to a backend running this migration and endpoint.

## Payment behavior

The provider's checkout determines the amount and currency. The site does not alter a fixed CamPay link's amount or inject undocumented checkout parameters. Bank donors arrange the transfer in their own banking app.

Hosted checkout links do not automatically create Donation records, reconcile campaign totals, or generate site receipts. Confirmation comes from the provider or staff reviewing the bank transfer. API checkout and verified webhooks would be separate integrations requiring merchant credentials.

The legacy processing task now keeps unverified Donation records pending. It cannot mark payments completed merely because a record exists.

## Verification

Frontend lint and TypeScript checks pass. Five API/regression tests cover empty configuration, public receiving details, blocked public updates, HTTPS validation and unverified payment status. Run:

```bash
DJANGO_SETTINGS_MODULE=config.settings.tests DJANGO_SECRET_KEY=local-test python manage.py test apps.donations.tests.test_payment_settings
```

Desktop and mobile browser checks confirmed the rendered choices and API retry state. No live transaction was performed; receiving details and hosted links must be configured before checkout can be verified.
