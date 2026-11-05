
## Stream D — stable Explorer URLs (5 November 2026)

Explorer keeps these static-export routes. Build family links with `dashhq.href('explorer', path, { network })`.

- Name search and alphabetical directory: `/dpns/search/?network=mainnet`
- Prefix results: `/dpns/search/?q=alice&network=mainnet` (`q` is a label prefix)
- Resolve one full name: `/dpns/?name=alice.dash&network=mainnet`
- Identity lookup landing: `/identity/?network=mainnet`
- Identity record: `/identity/?id=<base58-identity-id>&network=mainnet`
- Public-key hash lookup: `/identity/lookup/?pkh=<hash>&network=mainnet`
- Platform evonode activity: `/evonode/?proTxHash=<64-hex>&network=mainnet`
- Epoch details: `/epoch/detail/?index=<integer>&network=mainnet`

`network` accepts `mainnet`, `testnet`, or a configured `devnet-<name>`. Omitted network honours an existing `npe:network` preference, otherwise Mainnet; Explorer writes the resolved network into the URL without rewriting the old preference. The shell may omit `network=mainnet` on generated links, so callers which require an explicit Mainnet selection can set that parameter after calling `dashhq.href`.

DAPI and fees remain sibling tools in this pass; Explorer's Tools links point to `dashhq.href('dapi', '/')` and `dashhq.href('fees', '/')`. Neither tool should retire yet.
