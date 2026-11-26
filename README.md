# Caliper UI

React components, blocks and complete product screens drawn to one specification. Accessible by default, shadcn-compatible, installed as source you own.

This repository is the free tier: 112 components and 20 basic sections and pages, MIT licensed. Each part is plain React, Tailwind CSS v4 and Radix source that you copy into your project and own. Docs, live previews and the full catalogue are at **https://caliperui.site**.

## Install

```sh
npx shadcn@latest add https://caliperui.site/r/button.json
```

Add the namespace once to `components.json` and the short form works:

```json
{ "registries": { "@caliper": "https://caliperui.site/r/{name}.json" } }
```

```sh
npx shadcn@latest add @caliper/button
```

Every part brings its own stylesheet and depends on the shared tokens (`@caliper/styles`, installed automatically). Import them once in your global CSS; the item's `docs` field prints the exact lines.

## Layout

| Path | Holds |
| --- | --- |
| `registry.json` | Registry source for `npx shadcn build` |
| `registry/ui/` | Component source and each part's stylesheet |
| `registry/styles/` | Tokens, the Tailwind adapter and the base stylesheet |
| `public/r/` | Built items (`<name>.json`), served as a static registry |

## Free and Pro

Build a complete product with [editable app templates](https://caliperui.site/templates?utm_source=github&utm_medium=referral&utm_campaign=caliper_free_registry): CRM, finance, helpdesk, a SaaS app, docs, shop, file tools and onboarding. Preview the working UI before buying. Templates are frontend source; connect your own backend and services.

A single template is $79 once. [Pro](https://pro.caliperui.site/pricing?utm_source=github&utm_medium=referral&utm_campaign=caliper_free_registry) is $149 once for all Pro components, screens and templates. Team is $499 for 10 developers. Each includes lifetime updates to its purchased scope, with no subscription or renewal fee. Pro source is not in this repository.

## Contributing

Bug reports and accessibility fixes are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md). The files here are generated from the Caliper UI source, so changes are applied there and published back.

## Licence

[MIT](LICENSE). The Caliper UI name and logo are not covered by the licence.
