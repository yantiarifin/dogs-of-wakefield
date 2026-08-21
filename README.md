# Dogs of Wakefield

A portrait gallery of the dogs of Wakefield. Plain HTML, CSS, and JavaScript —
no framework, no build step.

## Viewing it

Double-click **`start.command`** in Finder. It serves the folder and opens the
gallery in your browser; closing the window stops the server.

Or do it by hand:

```sh
python3 -m http.server 8899   # then visit http://localhost:8899
```

Either way it has to be *served*. The page reads `portraits.json` over
`fetch()`, which browsers block on `file://`, so opening `index.html` directly
shows an error instead of the grid.

## Marking a dog as passed

`portraits.json` is the single source of truth. Set a dog's `passed` flag to
`true` and a rainbow appears next to the name in the grid, plus a line in the
modal:

```json
{
  "id": "Bella-2025-07-17",
  "name": "Bella",
  "passed": true
}
```

Save and reload. No build step — the page reads this file directly.

## Adding portraits

Drop the image into `portraits/`, named `Name-YYYY-MM-DD.jpg` (`.jpeg` and
`.png` also work), then run:

```sh
node scripts/build-gallery.mjs
```

That writes two web-sized copies — a 700px thumbnail into `portraits/thumbs/`
for the grid and a 1600px version into `portraits/display/` for the modal —
then rewrites `portraits.json`. Existing `passed` flags are preserved, so it is
safe to re-run any time.

The 3000px originals are **gitignored**. They live only on your Mac, so keep
your own backup of them — the repo carries the resized copies alone, which is
what keeps it near 25MB instead of 200MB.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | Page markup — grid container and modal |
| `styles.css` | All styling, light and dark |
| `scripts/gallery.js` | Builds the grid, runs the modal |
| `scripts/build-gallery.mjs` | Thumbnails + manifest generation |
| `portraits.json` | The data — edit this; `passed` flags live here |
| `portraits/` | Full-size originals — gitignored, local only |
| `portraits/thumbs/` | Generated 700px thumbnails for the grid |
| `portraits/display/` | Generated 1600px versions for the modal |
| `start.command` | Double-click launcher — serves the folder and opens it |
