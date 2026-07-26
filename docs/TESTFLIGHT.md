# Carte 0.5.12 TestFlight handoff

## Build identity

- App name: Carte
- Bundle identifier: `com.playbook.dishlens`
- EAS project ID: `859efdc3-4c16-448c-9e6a-fe98349513c5`
- Build profile: `production`
- Version: `0.5.12`
- Build number: remotely managed and auto-incremented by EAS

## One-time production configuration

Create a React Native project in Sentry, then add these EAS production
environment variables. Never commit their values.

```text
EXPO_PUBLIC_SENTRY_DSN
SENTRY_AUTH_TOKEN
SENTRY_ORG
SENTRY_PROJECT
```

Configure the Worker support address before deploying:

```bash
cd worker
npx wrangler secret put SUPPORT_EMAIL
npx wrangler deploy
```

The app still builds and runs if Sentry is not configured, but crash reports and
source-map uploads will remain disabled.

## Build and upload

Authenticate locally, then run one build only:

```bash
eas login
eas build --platform ios --profile production --auto-submit
```

If automatic submission is not configured for the Apple account:

```bash
eas build --platform ios --profile production
eas submit --platform ios --profile production --latest
```

Do not resubmit while a Free-tier EAS build is queued. Inspect it with:

```bash
eas build:list --platform ios --limit 5
```

## TestFlight “What to Test”

```text
Please test Carte in a real restaurant:

1. Scan one page of a menu in a language you do not read.
2. Check whether every visible dish, section and price is recognised.
3. Open several dish details and verify descriptions and dietary flags.
4. Add dishes to Your order and open the order dock.
5. Return later and reopen the menu from Recent menus.

Please report slow scans, missing dishes, wrong prices/currency, crashes, or
layouts that overlap the floating Liquid Glass header/dock. Always confirm
ingredients and allergens with restaurant staff.
```

## Beta App Review information still requiring owner input

- Contact first and last name
- Contact phone number
- Public support email
- App Store Connect Apple ID (`ascAppId`) if non-interactive submit is desired
