# Archivo: provenance

`archivo-latin-var.woff2` is the only webfont in the dashhq family.

| | |
|---|---|
| Family | Archivo, by Omnibus-Type ("The Archivo Project Authors") |
| Licence | SIL Open Font License 1.1 (`OFL.txt` in this directory, copied unchanged from upstream) |
| Upstream file | `ofl/archivo/Archivo[wdth,wght].ttf` in github.com/google/fonts, fetched 2026-11-05 |
| Upstream URL | https://github.com/google/fonts/raw/main/ofl/archivo/Archivo%5Bwdth%2Cwght%5D.ttf |
| Last upstream commit touching the file | `6c70c829f09ea345d3590406693220ea35c6553f` (2021-02-04) |
| Upstream source (per METADATA.pb) | github.com/Omnibus-Type/Archivo @ `b5d63988ce19d044d3e10362de730af00526b672`, `fonts/variable/Archivo[wdth,wght].ttf` |
| Upstream version string | Version 2.001 |
| Upstream sha256 | `0e094a7d3c7c4c25cf1310c4b30014f1dae9332220b1c2c88f4fa996f0b05053` |
| Output sha256 | `b3ba4f55bb4cc55755a86239502a624894055df5e41065e6956c806b26cf9223` (79,408 bytes) |
| Tools | fontTools 4.68.0 (`varLib.instancer`, `pyftsubset`) with brotli |

## What was done to it

1. Axes limited: `wght` 400 to 700, `wdth` 75 to 125 (the full range is 100 to 900 and 62 to 125). The family uses
   weights 400 to 680 and widths 88% (dense labels, the hub plate) to 118% (display).
2. Subset to Google's "latin" range plus arrows ←↑→↓ and minus sign:
   `U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F,
   U+20AC, U+2122, U+2190-2193, U+2212, U+2215, U+FEFF, U+FFFD`.
3. OpenType features kept: `kern liga calt ccmp locl mark mkmk tnum lnum pnum zero case frac numr dnom sups subs ordn`.
   `tnum` (tabular figures) and `zero` (slashed zero) matter for numbers in tables.
4. Saved as WOFF2.

The font name is unchanged ("Archivo"). The OFL Reserved Font Name clause does not apply because Archivo declares no
Reserved Font Name. Text outside the subset (Vietnamese, Cyrillic, CJK) falls back to the system stack in
`--dh-font`.

Reproduce with `design/tools/build-font.sh`.
