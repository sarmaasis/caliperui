# Caliper UI

React components, blocks and complete product screens drawn to one specification. Accessible by default, shadcn-compatible, installed as source you own.

This repository is the free tier: 72 components and 19 basic sections and pages, MIT licensed. Each part is plain React, Tailwind CSS v4 and Radix source that you copy into your project and own. Docs, live previews and the full catalogue are at **https://caliperui.site**.

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

Pro adds complete product screens, app templates and domain sets, licensed separately at https://caliperui.site. Pro source is not in this repository.

## Contributing

Bug reports and accessibility fixes are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md). The files here are generated from the Caliper UI source, so changes are applied there and published back.

## Licence

[MIT](LICENSE). The Caliper UI name and logo are not covered by the licence.
