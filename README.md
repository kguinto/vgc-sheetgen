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
pnpm sheetgen [-o <file>] [--debug] [--debug-dir <dir>] [--log <file>] <screenshot> <screenshot>  # read a Battle Team; with -o, also save the filled-in team list PDF
pnpm accuracy    # how many fixture fields are read correctly
```

## License

The code in this repository is MIT licensed.

`src/assets/play-pokemon-vg-team-list.pdf` is the official Play! Pokémon
team list form. It belongs to The Pokémon Company International and is not
covered by the MIT license. It is included only so the tool can fill it in.
Pokémon and Play! Pokémon are trademarks of Nintendo, Creatures Inc., GAME
FREAK inc., and The Pokémon Company. This project is not affiliated with or
endorsed by any of them. If you hold the rights and want the file removed,
open an issue and it will be taken down.
