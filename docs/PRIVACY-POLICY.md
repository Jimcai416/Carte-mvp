# Tavue Privacy Policy

Effective 2 August 2026 · Tavue beta

Tavue helps people understand restaurant menus. This policy explains the
limited data used to provide and improve the beta.

## Menu scans

When a user chooses to scan, the menu photo is sent securely to Tavue's
Cloudflare-hosted service and then to Anthropic's commercial API for menu
recognition and translation. Tavue does not save the menu photo in its own
storage. Anthropic normally deletes API inputs and outputs within 30 days,
subject to limited safety, legal, and contractual exceptions.

The resulting menu is returned to the user's device. Recent-menu history is
stored locally on that device. To find representative dish images, Tavue may
send short food-name search queries—not the menu photo or user identifier—to
Openverse. Tavue accepts only results carrying the configured open-content
licences and retains the creator, source and licence metadata returned with the
image.

## Security and beta analytics

Tavue creates a random installation identifier for abuse prevention, daily scan
limits, and first-party beta analytics. Analytics contain only approved event
names such as scan started/completed, duration, dish count, detail opened, order
added, and history reopened. They do not contain menu photos, menu text, dish
names, prices, free-form content, advertising identifiers, or precise location.
The identifier is irreversibly hashed before analytics storage. Cloudflare
Analytics Engine retains these beta events for three months.

## Diagnostics and feedback

If crash monitoring is enabled, Sentry may receive crash and diagnostic
information such as app version, platform, stack trace, and an error category.
Tavue disables default personal information, screenshots, view hierarchy, and
request-body collection.

Optional feedback contains the message the user types plus platform and app
version, and is automatically deleted after 180 days.

## Sharing, advertising, and tracking

Tavue does not sell personal data, serve targeted advertising, or track users
across other companies' apps and websites. Service providers process data only
to operate Tavue:

- Cloudflare for hosting, rate limiting, logs, and first-party analytics
- Anthropic for AI menu processing
- Sentry for diagnostics when configured
- Openverse for openly licensed representative dish images

## User choices and rights

Users can decline AI processing and continue using menus already saved on their
device. Removing Tavue deletes its local history and random identifier. UK and
EEA users may request access, correction, deletion, restriction, or objection
where applicable.

## Contact

Before external TestFlight review, replace this paragraph with the public
support email configured as the Worker's `SUPPORT_EMAIL` secret.
