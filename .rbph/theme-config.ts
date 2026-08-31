// RBPH template infrastructure. Theme developers should not modify this file.

import type { RbtSyncMessageType } from './sync';
export { RbtSyncMessageType } from './sync';

export type ThemeSurface = 'round-page' | 'puzzle-page';
export type ThemeLayout = 'game' | 'game-full';

export interface ThemeIconData {
  [key: string]: unknown;
  body: string;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  rotate?: number;
  hFlip?: boolean;
  vFlip?: boolean;
}

export interface ThemeIconAlias {
  [key: string]: unknown;
  parent: string;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  rotate?: number;
  hFlip?: boolean;
  vFlip?: boolean;
}

export interface ThemeIconifyCollection {
  [key: string]: unknown;
  prefix: string;
  icons: Record<string, ThemeIconData>;
  aliases?: Record<string, ThemeIconAlias>;
  width?: number;
  height?: number;
}

export interface ThemeLocaleMessages {
  readonly [key: string]: string | number | boolean | null | ThemeLocaleMessages;
}
export interface ThemeLocaleMessageContext {
  readonly type: string;
  list(index: number): unknown;
  named(key: string): unknown;
  plural(messages: string[]): string;
  linked(key: string, ...args: unknown[]): unknown;
  message(key: string): unknown;
  normalize(values: unknown[]): unknown;
  interpolate(value: unknown): unknown;
}
export type ThemeLocaleMessage = string | ((context: ThemeLocaleMessageContext) => unknown);
export interface ThemeLocaleModuleMessages {
  readonly [key: string]: ThemeLocaleMessage | ThemeLocaleModuleMessages;
}
export type ThemeJsonSource = `./${string}.json`;
export type ThemeLocaleModuleSource = `./${string}.${'ts' | 'mts' | 'cts' | 'js' | 'mjs' | 'cjs'}`;
export type ThemeUiIconPosition = 'judge.error' | 'judge.pending' | 'judge.fail' | 'judge.correct' | 'judge.milestone' | 'judge.start-game' | 'judge.easter-egg' | 'judge.finish-game';

export interface ThemeRendererConfig {
  surface: ThemeSurface;
  layout?: ThemeLayout;
  entry: string;
  styles?: readonly string[];
}

export interface ThemeConfig {
  permissions?: {
    sync?: 'all' | readonly RbtSyncMessageType[];
  };
  features?: {
    renderers?: Readonly<Record<string, ThemeRendererConfig>>;
    locale?: Readonly<Record<string, ThemeLocaleMessages | ThemeJsonSource | ThemeLocaleModuleSource>>;
    icons?: readonly (ThemeIconifyCollection | ThemeJsonSource)[];
    ui?:
      | ThemeJsonSource
      | {
          icons: Readonly<Partial<Record<ThemeUiIconPosition, string>>>;
        };
  };
}

export function defineThemeConfig<const Config extends ThemeConfig>(config: Config): Config {
  return config;
}
