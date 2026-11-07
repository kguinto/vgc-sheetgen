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
pnpm sheetgen    # read a Battle Team from the command line; see below
pnpm accuracy    # how many fixture fields are read correctly
```

## Reading a team from the command line

`pnpm sheetgen` reads a Battle Team from two screenshots, prints the team,
and can fill in the official Play! Pokémon team list PDF for you. It runs
entirely on your machine.

### 1. Take the screenshots

In Pokémon Champions, open the Battle Team you want to register and take
two screenshots with the console's capture button:

- one with the **Moves & More** tab selected
- one with the **Stats** tab selected

Copy them to your computer as they are. PNG and JPEG both work. Don't crop
or resize them: the script finds each field by its position on the screen,
so it needs the full 16:9 image.

| Console           | Screenshot size | Team ID read?                               |
| ----------------- | --------------- | ------------------------------------------- |
| Nintendo Switch 2 | 1920×1080       | Yes                                         |
| Nintendo Switch   | 1280×720        | No (the screen shows the team name instead) |

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
value.

### 3. Save the team list PDF

Add `-o` with a file name to also fill in the official team list form:

```sh
pnpm sheetgen -o team.pdf moves.jpg stats.jpg
```

The form is filled in with the trainer name and each Pokémon's species,
ability, held item, nature, and moves, plus stats on the page for staff.
Everything else (player name, Player ID, date of birth, age division,
Switch profile name, Support ID, and Battle Team number or name) is left
blank for you to write in.

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
