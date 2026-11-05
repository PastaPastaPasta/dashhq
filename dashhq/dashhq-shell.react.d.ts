// JSX types for the shell's elements. Only for React projects (gov, vote, dapi, explorer, pollr, forge, yappr).
// Boolean attributes (sticky, no-theme, full, no-copy) are present-or-absent. React 18 writes `false` as the string
// "false", which still counts as present, so these types only allow '' or true: omit the prop to turn it off.
import type { Ref } from 'react';
import type { DashhqNetwork, DashhqProduct } from './dashhq-shell';

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
        'no-theme'?: On;
        sticky?: On;
      };
      'dashhq-footer': ShellAttrs & { product: DashhqProduct; source?: string };
      'dashhq-hash': ShellAttrs & {
        value: string; href?: string; label?: string; head?: number | string; tail?: number | string;
        full?: On; 'no-copy'?: On;
      };
    }
  }
}
