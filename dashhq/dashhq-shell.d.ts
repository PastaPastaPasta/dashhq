// Types for the vendored dashhq shell. Copy next to your sources (or reference it from tsconfig "include").

export type DashhqProduct =
  | 'home' | 'radar' | 'nodes' | 'gov' | 'explorer' | 'faucet' | 'bridge' | 'arch' | 'fees' | 'dapi'
  | 'vote' | 'basics' | 'forge' | 'pollr' | 'yappr';

/** 'mainnet' | 'testnet' | `devnet-${name}` */
export type DashhqNetwork = 'mainnet' | 'testnet' | `devnet-${string}`;
export type DashhqThemePref = 'system' | 'light' | 'dark';

export interface DashhqApi {
  readonly version: string;
  /** true on *.dashhq.localhost: every family link stays in the local lab */
  readonly lab: boolean;
  readonly products: Readonly<Record<DashhqProduct, { name: string; url: string; door: string; net?: boolean }>>;
  /** Origin of a family product, production or lab. */
  origin(product: DashhqProduct): string;
  /** URL of a page in another family product. Carries an explicit ?network= for every network-aware product. Bridge/Faucet default to Testnet unless a network is explicit. Throws if path would leave the product's origin (e.g. "//evil.example"). */
  href(product: DashhqProduct, path?: string, opts?: { network?: DashhqNetwork | null }): string;
  readonly theme: {
    readonly pref: DashhqThemePref;
    readonly resolved: 'light' | 'dark';
    set(pref: DashhqThemePref): void;
    toggle(): void;
  };
  readonly network: {
    /** Normalise any spelling ('test', 'Testnet', 'devnet_paloma') or return null. */
    parse(value: string | null | undefined): DashhqNetwork | null;
    /** 'Mainnet', 'Testnet', 'Devnet paloma' */
    label(network: DashhqNetwork): string;
    kind(network: DashhqNetwork): 'main' | 'test' | 'dev';
    /** ?network= (or legacy ?net=) from a URL; absent means 'mainnet'. */
    fromUrl(url?: string): DashhqNetwork;
    /** Same URL with ?network= set explicitly, including mainnet and legacy ?net= dropped. */
    withNetwork(url: string, network: DashhqNetwork): string;
    /** Rewrite a legacy ?net= in the address bar to ?network= without reloading. */
    canonicalize(): void;
  };
}

export interface DashhqThemeEventDetail { pref: DashhqThemePref; theme: 'light' | 'dark' }
export interface DashhqNetworkEventDetail { network: DashhqNetwork; href: string }

declare global {
  interface Window { dashhq: DashhqApi }
  interface DocumentEventMap { 'dashhq-theme': CustomEvent<DashhqThemeEventDetail> }
  // dashhq-network bubbles and is composed, so it can be heard on the bar, any ancestor, or document.
  interface GlobalEventHandlersEventMap { 'dashhq-network': CustomEvent<DashhqNetworkEventDetail> }
}
