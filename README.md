# VGC Sheetgen

A static web app that reads Pokémon Champions screenshots with on-device OCR
and generates Pokémon VGC team lists. Nothing is uploaded: OCR runs in your
browser.

## Development

Requires Node 22+ and pnpm 11.

```sh
pnpm install
pnpm dev         # Vite dev server
pnpm build       # typecheck + production build to dist/
pnpm preview     # serve dist/
pnpm test        # vitest (test/**/*.test.ts)
pnpm typecheck   # tsc -b
pnpm lint        # oxlint + oxfmt --check
pnpm lint:fix
pnpm sheetgen <screenshot> <screenshot>  # read a Battle Team (in progress)
```

## License

MIT
