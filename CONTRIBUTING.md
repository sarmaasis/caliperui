# Contributing

Thanks for helping. Open an issue for a bug, an accessibility problem or a missing state before sending a large change.

- Keep a part's API small and its keyboard behaviour, focus ring and reduced-motion handling intact.
- Use the shared tokens in `registry/styles/tokens.css`; do not add one-off colours.
- Run `pnpm install && pnpm registry:build` to check that `registry.json` still builds.

This repository is published from the Caliper UI source. A pull request is reviewed here, then applied upstream and published back with credit.
