# Stream D — explicit Mainnet links

Explorer honours an existing `npe:network` preference when a URL has no network parameter, as required for this pass. Shell 1.0.1 removes `network=mainnet` from family links. That makes an explicit Mainnet handoff ambiguous when the destination has a legacy Testnet preference.

Proposal: retain `?network=mainnet` on network-aware family links, including door-switcher links. Explicit URL selection should always win over legacy storage.

Explorer's own cross-links call `dashhq.href()` and then explicitly set the network parameter. Its shell network event is cancelled and handled by the existing SDK provider, which retains Mainnet in the URL. The shared door switcher remains unchanged pending the shell change. Affects Explorer now, and any sibling still reading legacy network storage.
