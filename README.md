# Two for the Road — Duo Sunset cover maker

[![make.fun competition](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?ref=nbgfvtz4)
[![rank](https://make.fun/badge/gta6-cover-art-01/Valkyra54/gta6-cover-art-01-dir5/rank.svg)](https://make.fun/bounty/gta6-cover-art-01?ref=nbgfvtz4)
[![reward](https://make.fun/badge/gta6-cover-art-01/Valkyra54/gta6-cover-art-01-dir5/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?ref=nbgfvtz4)

A static web app that turns two photos and one sunset into cover art in the
style of a coastal crime saga's key art — two people, one car, the sun going
down behind them. Pick photos, pick one of three duo layouts, tune the sunset
grade, and export a PNG in 1080×1080, 1080×1350, or 1920×1080.

Entry for the [make.fun gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01?ref=nbgfvtz4).

## Layouts

- **Duo Hood** — a sunset street full-bleed, the pair framed low on the hood,
  the title stacked huge across the top 40%.
- **Split** — her portrait and his portrait side by side, touching at the
  centre seam, the title cutting straight across it, a handwritten nameplate
  under each face.
- **Car** — the duo in the bottom third, sky and title above them, birds and
  palm silhouettes in the light.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Everything runs offline from `app/` — no build step, no network request.
Fonts are local OFL files under `app/fonts/` (Anton, Oswald, Bebas Neue,
Great Vibes). Sample photos are model-made and free to use.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to the output directory and writes `dossier.json` with the kit's vendored
`buildDossier`.
