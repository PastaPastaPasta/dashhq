# Shell 1.1.0 decisions

- A: accepted. `a[data-family][data-path][data-network]` is resolved by the shell on initial load, insertion, attribute updates, network changes and history traversal. Production hrefs remain the no-script fallback. Hub, Architecture and Basics can remove their adapters.
- B: accepted. Capture outside pointerdown to prevent focus and map activation; consume the subsequent outside click and close. Tab and Escape keep their keyboard behavior. Pointer dismissal restores focus to the trigger so a hidden menu cannot retain focus. Radar can remove its capture listeners.
- Explorer: accepted. All network-aware links, product home links and network options retain an explicit canonical network, including Mainnet. Explorer can remove its manual searchParams override.
- Explorer URLs: accepted as the stable static-export contract. Basics' name-directory links use `/dpns/search/`; identity and evonode handoffs retain their documented query keys.
- A's future Bridge host change: deferred. The documented working production host remains bridge.thepasta.org until bridge.dashhq.org is confirmed available. Lab links already use bridge.dashhq.localhost. No production host was changed or tested by writing to it.

Unknown network values remain in the URL so applications can disclose an unsupported network rather than silently switching it.

No other requests were present. DAPI and Fees remain sibling products as requested by Explorer.
