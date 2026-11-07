# VGC Sheetgen

Turns two screenshots of a Pokémon Champions Battle Team into the official
Play! Pokémon VGC team list, filled in and ready to print. The screenshots
are read on your device, with text recognition (OCR) in your browser:
nothing is uploaded.

It's a static web app, plus a command-line script that does the same
reading (see [Reading a team from the command line](#reading-a-team-from-the-command-line)).
The web app is at <https://sheetgen.kguinto.dev>.

## Taking the screenshots

In Pokémon Champions, open the Battle Team you want to register and take
two screenshots with the console's capture button:

- one with the **Moves & More** tab selected
- one with the **Stats** tab selected

Copy them to your computer or phone as they are. PNG and JPEG both work.
Don't crop or resize them: each value is found by its position on the
screen, so the full 16:9 image is needed.

Screenshots from a Nintendo Switch 2 (1920×1080) and a Nintendo Switch
(1280×720) both work.

The bar at the top of the screen shows either the team's slot and Team ID
or the team's name, on both consoles. For now, the Team ID is only read
from Switch 2 screenshots that show it, and Switch screenshots are only
read correctly when they show the team's name.

## Using the web app

1. **Screenshots.** Drop the two screenshots anywhere on the page, or click
   to choose them (on a phone, from your photos), in either order. Click a
   thumbnail to see it full size.
2. **Review.** The screenshots are read while a progress bar shows how far
   it's got. Then each Pokémon is shown under its cards from both
   screenshots, so you can check every value against the game. Any value
   can be corrected, and the nature is picked from a list you can type to
   filter. "Your details" holds the rest of the form's header (player name,
   Battle Team, Switch profile name, age division, Player ID, date of birth,
   and Support ID); all of it is optional.
3. **Teamsheet.** The form is filled in and previewed. Download it, or open
   it in a new tab to print. Print both pages: the first is for tournament
   staff, the second for your opponents, without your stats or personal
   details. Anything left blank can be written in by hand.

Check the values on the Review step before printing: text recognition can
misread a value, e.g. "Ice Beam" as "fce Beam".

Some browsers, such as Chrome on Android, can't show a PDF inside a page.
There the Teamsheet step says so, and Download and Open still work.

### What stays on your device

- **Your screenshots** never leave your device. They're read in your
  browser.
- **The text recognizer** ([Tesseract](https://github.com/naptha/tesseract.js),
  about 7 MB) is downloaded from the jsDelivr CDN the first time it's
  needed, and your browser keeps it after that. Only Tesseract's own code
  and model come from there.
- **Your details** (name, Player ID, date of birth, and so on) are only kept
  while the page is open. They aren't saved or sent anywhere, and are gone
  when you close or reload the page.

## Development

Requires Node 22+ and pnpm 11.

```sh
pnpm install
pnpm dev         # the web app at http://localhost:5173
pnpm build       # typecheck + production build to dist/
pnpm preview     # serve dist/
pnpm test        # vitest, in Node (test/**/*.test.ts)
pnpm test:browser  # vitest, in headless Chromium (test/browser/); needs the internet
pnpm typecheck   # tsc -b
pnpm lint        # oxlint + oxfmt --check
pnpm lint:fix
pnpm sheetgen    # read a Battle Team from the command line; see below
pnpm accuracy    # how many fixture fields are read correctly
pnpm run deploy  # build, then publish dist/ to Cloudflare
```

Before the first `pnpm test:browser`, download the browser it runs in with
`pnpm exec playwright install chromium`.

### Deploying

The web app is served by Cloudflare as a Worker with only static files
(set up in `wrangler.jsonc`), at `sheetgen.kguinto.dev`. Cloudflare creates
the DNS record and the certificate for that address on deploy.

To deploy from your machine, sign in once with `pnpm exec wrangler login`,
then run `pnpm run deploy`.

## Reading a team from the command line

`pnpm sheetgen` reads a Battle Team from two screenshots, prints the team,
and can fill in the official Play! Pokémon team list PDF for you. It runs
entirely on your machine.

### 1. Take the screenshots

See [Taking the screenshots](#taking-the-screenshots).

### 2. Run the script

From the project folder, after `pnpm install`:

```sh
pnpm sheetgen moves.jpg stats.jpg
```

The two screenshots can be given in either order; the script works out
which tab each one shows. The first run takes a little longer while the
text recognizer (Tesseract) starts up. While it reads, a progress line shows how
many fields have been read so far.

The team is printed in a format close to Pokémon Showdown's, but with the
stat values shown in game rather than EVs:

```text
Trainer: Louie
Team ID: 0A0HABQMPR

Tyranitar @ Tyranitarite
Ability: Sand Stream
Nature: Jolly (+Spe / -SpA)
Stats: HP 175 / Atk 175 / Def 130 / SpA 103 / SpD 133 / Spe 124
- Protect
- Rock Slide
- Knock Off
- Low Kick

...
```

A stat that couldn't be read is shown as `?`. Check the printed team
against your screenshots before you use it: text recognition can misread a
value. The script can't correct values; the web app's Review step can.

### 3. Save the team list PDF

Add `-o` with a file name to also fill in the official team list form:

```sh
pnpm sheetgen -o team.pdf moves.jpg stats.jpg
```

The form is filled in with the trainer name and each Pokémon's species,
ability, held item, nature, and moves, plus stats on the page for staff.
The script doesn't ask for your details (player name, Player ID, date of
birth, age division, Switch profile name, Support ID, and Battle Team
number or name), so they're left blank for you to write in. The web app
can fill them in.

An existing file at that path is replaced. The folder must already exist;
the script checks this before reading the screenshots, so a typo doesn't
cost you a full run.

The script also points out anything to check on the printed form, such as a
name with characters the form's font can't print (written as `?`), or a
value too long for its box.

### Options

| Option                  | What it does                                                                                                                                                                                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-o`, `--output <file>` | Fill in the team list form and save it as a PDF at `<file>`.                                                                                                                                                                                               |
| `--debug`               | Also print everything worked out about the screenshots, as JSON, to stderr. Printed even when a run fails.                                                                                                                                                 |
| `--debug-dir <dir>`     | Save two images of each field into `<dir>`, one folder per tab: the field as it appears in the screenshot (`<field>.png`) and the cleaned-up version given to the text recognizer (`<field>.preprocessed.png`). Useful for seeing why a field was misread. |
| `--log <file>`          | Also write everything printed to `<file>`. With `--debug`, that includes the JSON.                                                                                                                                                                         |

Options can go before or after the screenshot paths. For example, to dig
into a bad read:

```sh
pnpm sheetgen --debug --debug-dir crops --log run.log moves.jpg stats.jpg
```

### When something goes wrong

The script stops with a message naming the screenshot it's about. The most
common ones:

| Message                                                 | What to do                                                                       |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `no such file`                                          | Check the path.                                                                  |
| `Not a PNG or JPEG image.` / `The image is damaged`     | Export the screenshot again as PNG or JPEG.                                      |
| `Screenshots must be 16:9, like 1920×1080 or 1280×720.` | Use the original screenshot, not a cropped or resized copy.                      |
| `This isn't a Battle Team screenshot`                   | Retake it on the Battle Team screen with the Moves & More or Stats tab selected. |
| `There's no screenshot of the Stats tab. Add one.`      | Give one screenshot of each tab.                                                 |
| `Two screenshots show the Moves & More tab.`            | Both screenshots show the same tab; retake one with the other tab selected.      |

If the team is read but some values are wrong, run again with `--debug-dir`
and look at the crops for those fields.

## License

The code in this repository is MIT licensed.

`src/assets/play-pokemon-vg-team-list.pdf` is the official Play! Pokémon
team list form. It belongs to The Pokémon Company International and is not
covered by the MIT license. It is included only so the tool can fill it in.
Pokémon and Play! Pokémon are trademarks of Nintendo, Creatures Inc., GAME
FREAK inc., and The Pokémon Company. This project is not affiliated with or
endorsed by any of them. If you hold the rights and want the file removed,
open an issue and it will be taken down.

The web app's fonts are under the SIL Open Font License: EB Garamond, in
`src/app/assets/fonts/eb-garamond/` with its license, and Inter, from the
`@fontsource-variable/inter` package.
