# Publishing to d4shhq.dash.site

GitHub Pages serves this repository as it is at dashhq.org. Separately, `.github/workflows/dash-site.yml` publishes a smaller copy of the site to the mainnet Dash Platform name `d4shhq`, served at https://d4shhq.dash.site. Pages is not touched.

## What the workflow does

- **Pull requests** (forks too, no secret): builds the copy, runs `dash-sites publish --dry-run`, and reads what `d4shhq` serves now (read-only). The job summary lists the files, bytes, stored bytes, chunks, the first-publish estimate, and the incremental estimate: what this build would cost given the chunks `d4shhq` already stores.
- **Push to `main`, or a manual run on `main`**: the same build, then the publish. If the secret `DASH_SITES_PUBLISH_KEY` is not set, the job prints a notice and does nothing. If `d4shhq` already serves this exact build (same content URI), nothing is written. Before writing, `dash-sites whoami` must show a key that:
  - is bound to the dash-sites contract `GCSi8NkjXyRpLC7FsEnCfx5ntmWZ16bD2t9zc4JiT4X3` (an unbound key, such as a master or critical key, is refused),
  - has a total budget, and enough of it left for the estimate,
  - expires more than an hour from now,
  - belongs to `8z8H5MvrnC2917Qpmu3sGWRCXLbUKHC6LR7zbtadyDv5`, which owns `d4shhq`, and that identity holds enough for the estimate.

  The publish runs without `--prune`, so old chunks stay until a manual `gc` (see below). The summary shows the revision, chunks uploaded and reused, and what it spent. Publishes never overlap (`concurrency: dash-site-publish`).

The workflow pins dash-sites to a commit (`DASH_SITES_REF`) and Node to an exact version (`NODE_VERSION`). Node's bundled brotli decides the chunks, so a different Node version can change every chunk and make the next publish a full one. Bump either on purpose, and check the PR summary.

## What is published

`scripts/dash-site/build.mjs` builds the copy from tracked files only:

- **Included**: `404.html`, `index.html`, `favicon.svg`, `hub.css`, `hub.js`, `pulse.js`, `retired.css`, and the `dashhq/`, `directory/`, `icons/` and `identity/` directories.
- **Excluded**: `README.md`, `SHELL.md`, `DEPLOY.md`, `CNAME`, `.gitignore`, `.nojekyll`, `.github/`, `scripts/`, `lab/`, and `og.png`. The pages link `og.png` only as `https://dashhq.org/og.png`, so the copy does not need its own.
- **Dropped inside included directories**: the shell's `.d.ts` files, Tailwind preset, `PINNED`, `SHA256SUMS`, `VERSION`, `moved.js` (the script for retired sites), `fonts/PROVENANCE.md`, and any source maps. The font licence stays.

A new top-level file or directory fails the build until it is added to `INCLUDE` or `EXCLUDE` in `build.mjs`.

The build then makes the copy smaller. The repository files stay as they are.

- JS and CSS are minified with esbuild, and `/*! … */` licence comments are kept. HTML is minified with html-minifier-terser: comments are removed, and runs of whitespace become one space.
- The `integrity` hashes of the local stylesheets and scripts are recomputed for the minified files. A hash that does not match the original file stops the build.
- SVGs go through svgo with every plugin that rounds numbers or rewrites shapes turned off. Sprite ids and symbols are kept. PNGs are deflated again at the highest level, keeping all colour data. WebP files are already minimal and are left as they are.
- Files are stored as brotli when that is smaller than gzip (`--brotli`). This makes the manifest version 2. dash.site reads it, but the testnet host `id.dashhq.org` and extension 0.1.0 do not yet.

Chunk packing is fixed in dash-sites: chunks of 14,700 bytes, with file tails packed in path order. The CLI has no option to change it.

The copy renders the same as the repository. Before this was merged, every page (`/`, `/directory/`, `/identity/`, a 404, two searches) was rendered in Chromium from both builds, in light and dark mode, on desktop and on a phone, and the screenshots matched pixel for pixel, with the same text and no console errors.

To build and inspect it locally:

```sh
git clone https://github.com/PastaPastaPasta/dash-sites ../dash-sites
(cd ../dash-sites && git checkout <DASH_SITES_REF> && npm ci && npx tsc -b && npm run bundle -w @dash-sites/cli)
npm ci --ignore-scripts --prefix scripts/dash-site
export DASH_SITES_DIR=$PWD/../dash-sites
node scripts/dash-site/build.mjs /tmp/d4shhq
node $DASH_SITES_DIR/packages/cli/bundle/dash-sites.mjs publish /tmp/d4shhq --name d4shhq --network mainnet --dry-run --brotli
node $DASH_SITES_DIR/packages/cli/bundle/dash-sites.mjs preview /tmp/d4shhq --name d4shhq --brotli   # http://d4shhq.localhost:8080/
```

## Cost

Estimates for this build, as of 2026-11-27:

| | DASH |
|---|---|
| First publish (13 chunks, 158,535 bytes stored) | about 0.054 |
| Edit to one page, stylesheet or script (2 new chunks plus the record) | about 0.0054 to 0.0066 |
| Push that does not change the site | 0, nothing is written |

The fees come from the identity's balance and count against the key's budget. At about 0.006 per update, a budget of 0.25 DASH covers the first publish and around 30 updates.

## One-time setup

1. **Top up the identity.** `8z8H5MvrnC2917Qpmu3sGWRCXLbUKHC6LR7zbtadyDv5` holds about 0.014 DASH. Add about 0.1 DASH to cover the first publish and some updates.
2. **Add a limited key on your laptop.** You need the dashhq identity file (dash-bridge format) and a built dash-sites checkout:

   ```sh
   DASH_SITES_DIR=~/workspace/dash-sites node scripts/add-dash-sites-key.mjs <dashhq-identity.json> \
     --network mainnet --budget 0.25 --expires 2027-11-27
   ```

   The script prints the key it will add (AUTHENTICATION, HIGH, ECDSA_HASH160, bound to the dash-sites contract, with that budget and expiry), the fee (under 0.001 DASH; 0.00043 on testnet), and where the WIF goes. It asks before broadcasting and signs with the MASTER key. The WIF is written only to `./dash-sites-publish-key.mainnet.wif` (mode 0600) and is never printed. A key bound to one contract cannot register names, transfer credits or withdraw.
3. **Store it as the secret, then delete the file:**

   ```sh
   gh secret set DASH_SITES_PUBLISH_KEY -R PastaPastaPasta/dashhq < dash-sites-publish-key.mainnet.wif
   shred -u dash-sites-publish-key.mainnet.wif
   ```

4. Re-run the latest **Dash Sites** workflow on `main` (Actions → Dash Sites → Run workflow), or push to `main`.

`--network testnet` does the same on testnet, for trying the script with a testnet identity.

## Rotating and revoking

- **Revoke**: disable the key with the master key, then delete the secret:

  ```sh
  DASH_SITES_DIR=~/workspace/dash-sites node scripts/add-dash-sites-key.mjs <dashhq-identity.json> --network mainnet --disable <keyId>
  gh secret delete DASH_SITES_PUBLISH_KEY -R PastaPastaPasta/dashhq
  ```

  The key id is printed when the key is added, and shown in the publish job's key-check summary. Platform refuses a disabled key at once, and so does the workflow.
- **Rotate** (when the budget runs low or the expiry is near): add a new key with step 2, replace the secret with step 3, then disable the old key. The publish job refuses a key whose budget is below the estimate or that expires within the hour, so a run fails and does not write anything when rotation is overdue.

## Cleaning up old chunks

Publishing never deletes chunks, so earlier releases stay on Platform. To see what a cleanup would delete and refund:

```sh
node $DASH_SITES_DIR/packages/cli/bundle/dash-sites.mjs gc --dry-run --network mainnet --identity-file <dashhq-identity.json>
```

To delete them, run the same command without `--dry-run`. `gc` keeps everything until every site record is 25 hours old (`--grace`), and checks the records again just before deleting. The refund is the storage fee less what has already been paid out.

## Networking

Nothing in this repository names a Platform node. The SDK takes nodes from the network's masternode list, which holds IPv4 addresses (a read of `d4shhq` reached `37.27.83.17` and `37.60.236.230`), and reads quorum keys from `quorums.mainnet.networks.dash.org`, which has an IPv4 address. IPv4-only GitHub runners reach both, as the PR dry run shows, since it reads mainnet. Dual-stack machines work the same way.
