import { defineThemeConfig, RbtSyncMessageType } from './.rbph/theme-config';

export default defineThemeConfig({
  permissions: {
    sync: [RbtSyncMessageType.PuzzleSubmitted],
  },
  features: {
    renderers: {
      'round-main': {
        surface: 'round-page',
        layout: 'game',
        entry: './src/entry.ts',
        styles: ['./src/assets/style.css'],
      },
      'puzzle-main': {
        surface: 'puzzle-page',
        layout: 'game',
        entry: './src/entry.ts',
        styles: ['./src/assets/style.css'],
      },
    },
    locale: { en: './src/locales/en.json', 'zh-CN': './src/locales/zh-CN.json' },
    icons: [{ prefix: 'example', icons: {} }],
    ui: { icons: {} },
  },
});
