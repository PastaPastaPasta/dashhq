// JSX types for the shell's elements. Only for React projects (gov, vote, dapi, explorer, pollr, forge, yappr).
// Boolean attributes (sticky, no-theme, full, no-copy) are present-or-absent. React 18 writes `false` as the string
// "false", which still counts as present, so these types only allow '' or true: omit the prop to turn it off.
import type { Ref } from 'react';
import type { DashhqNetwork, DashhqProduct, DashhqSigninKept } from './dashhq-shell';

type On = '' | true;
type ShellAttrs = { class?: string; className?: string; id?: string; slot?: string; children?: unknown; hidden?: On; ref?: Ref<HTMLElement> };
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'dashhq-bar': ShellAttrs & {
        product: DashhqProduct;
        'product-name'?: string;
        'product-href'?: string;
        network?: DashhqNetwork;
        networks?: string;
        'network-settings'?: string;
        'network-note'?: string;
        /** Phones: the slotted nav goes in the menu (default) or becomes a bottom tab bar. */
        'phone-nav'?: 'menu' | 'tabs';
        'no-theme'?: On;
        sticky?: On;
      };
      'dashhq-footer': ShellAttrs & { product: DashhqProduct; source?: string };
      'dashhq-hash': ShellAttrs & {
        value: string; href?: string; label?: string; head?: number | string; tail?: number | string;
        full?: On; 'no-copy'?: On;
      };
      'dashhq-signin-help': ShellAttrs & {
        /** Defaults to the page bar's product and network. */
        product?: DashhqProduct;
        network?: DashhqNetwork;
        /** Space-separated DashhqSigninAsk values, e.g. "passkey phrase key voting-key". */
        asks?: string;
        /** One sentence: what the credential signs here. "It signs the polls you create and your votes." */
        why?: string;
        kept?: DashhqSigninKept;
        /** One or two sentences of specifics: limits, expiry, encrypted copies. */
        'kept-note'?: string;
        /** Folds the explanation into one line ("What's this? ▸"). Default auto: folded when phone-narrow. */
        compact?: 'auto' | 'always' | 'never' | '' | true;
      };
      /** A record that isn't on this network: says where it is instead. Set `found`, or give the element a `lookup`
       *  through its ref (DashhqNotFoundElement). Children are one extra sentence of your own. */
      'dashhq-not-found': ShellAttrs & {
        /** The noun: "masternode", "proposal", "identity", "name contest", "contract". */
        thing: string;
        /** What the id is called: "ProTx hash", "name", "ID" (default). */
        'id-label'?: string;
        /** Where the page looked. Defaults to the page bar's network. */
        network?: DashhqNetwork;
        /** Networks to look across. Default "mainnet testnet". */
        networks?: string;
        /** A network, 'none' (on no network) or 'unknown' (couldn't check). Omit it while checking or with a lookup. */
        found?: DashhqNetwork | 'none' | 'unknown';
        /** The record on the found network. Default: this URL with ?network= swapped. */
        href?: string;
        /** With a lookup: the record's id. A new lookup function for the same record keeps the answer. */
        record?: string;
        /** This network's list or search, and its label: "Browse Testnet masternodes". */
        'list-href'?: string;
        'list-label'?: string;
      };
      /** A retired product’s page. Forwards immediately; carries network, query and hash. */
      'dashhq-moved': ShellAttrs & {
        /** The new home's product key. */
        to: DashhqProduct;
        /** Path (and query) at the new home. Default "/". */
        path?: string;
        /** The retired product. Defaults to the page bar's. */
        product?: DashhqProduct;
        /** The network when the old link has none. Default mainnet. */
        network?: DashhqNetwork;
        heading?: string;
        lede?: string;
        label?: string;
      };
    }
  }
}
