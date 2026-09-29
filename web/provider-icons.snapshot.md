# Provider icon snapshot

`provider-icons.snapshot.json` is the icon mapping bundled in the existing
`openmeld-open-connector-prod` Web asset, not a hand-authored catalog.

- Source: `https://connectors.openmeld.ai/assets/index-CoFp8Aci.js`
- Production Worker version at capture: `c22883ed-d793-4061-9cae-7243ffb1942f`
- Source asset SHA-256: `966fa7b14e109de5949296a3aa7cf0eceb22e8a3f1406b1c601ea061f34c60e4`
- Captured mapping: the `var Os={...}` literal, 1,562 service-to-icon URL entries.

The previous build fetched `https://oomol.com/en/apps/catalog.json`, which
returned HTTP 404 on 2026-09-29. The checked-in snapshot preserves the icon
mapping already served to production users and lets builds run without that
external endpoint. When refreshing it, record the exact source and compare the
result with the provider catalog before replacing this file.
