# TAVUE brand and migration record

Status: **locked for the 0.8.3 release**
Decision date: **2 August 2026**

## Brand

- Brand styling: **TAVUE**
- Product display name: **Tavue**
- Pronunciation: **Tah-view**
- Working line: **See it. Know it. Order it.**
- Meaning: `TA` suggests table / taste; `VUE` suggests seeing and
  understanding.
- Backup name: **CAIDAN**
- **THIS ONE** remains a reserved marketing idea and must not appear in the
  server-facing flow in this release.

Tavue replaces Carte before public launch because a highly similar
menu-scanning product adopted the previous name. Existing store identities are
preserved so TestFlight and Google Play users receive an update rather than a
separate app:

- Expo slug: `dishlens`
- iOS bundle ID: `com.playbook.dishlens`
- Android package: `com.playbook.dishlens`
- EAS project ID: `859efdc3-4c16-448c-9e6a-fe98349513c5`

These are technical identifiers, not public branding.

The existing Sentry organisation slug `carte-lab` is also retained in Expo's
upload configuration. Runtime releases are labelled `Tavue@<APP_VERSION>` from
`src/config.ts`, currently **`Tavue@0.8.2`**. Quote the constant rather than a
literal here so this record cannot drift out of step with the build again;
changing the organisation slug is an external Sentry migration, not an app
rename.

## Logo

The logo combines a capital T, a table/menu crossbar and a transparent V-shaped
viewing aperture. Use the dimensional glass treatment for the app icon, splash
and large brand moments. Use the flat or monochrome master below 80 px.

Core colours:

- Warm Paper: `#FFF4E5`
- Paper Highlight: `#FFFCF7`
- Terracotta: `#D75E43`
- Terracotta Light: `#F48F74`
- Terracotta Deep: `#BD4533`
- Ink: `#2B211D`

Editable SVG masters live in `assets/brand/`. Production Expo PNGs live in
`assets/` and are mapped in `app.json`.

## Upgrade compatibility

Version 0.8.0 writes new `tavue.*` storage keys while copying forward values
from earlier beta keys. Do not remove the legacy read paths until all active
beta builds have been retired. The Worker accepts `x-tavue-client` and the old
header during the same transition. Analytics dataset and deployed Worker URL
remain stable to preserve operational continuity.
