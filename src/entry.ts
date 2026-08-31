import { createApp, defineComponent, h, resolveComponent, type App as VueApp, type Component } from 'vue';
import RoundTheme from './RoundTheme.vue';
import PuzzleTheme from './PuzzleTheme.vue';
import { RBT_CONTEXT_KEY, type PuzzleThemeContext, type RoundThemeContext } from '../.rbph/context';

let app: VueApp<Element> | undefined;
export function mount(element: Element, rbph: RoundThemeContext | PuzzleThemeContext) {
  app?.unmount();
  const ThemeRoot = defineComponent({
    name: 'RbphThemeRoot',
    setup() {
      const UApp = resolveComponent('UApp');
      const Theme = (rbph.surface === 'puzzle-page' ? PuzzleTheme : RoundTheme) as Component;
      return () =>
        h(
          UApp,
          {
            locale: rbph.ui?.locale.value,
            portal: false,
            toaster: null,
          },
          {
            default: () => h(Theme, { rbph }),
          },
        );
    },
  });
  app = createApp(ThemeRoot);
  rbph.ui?.install(app);
  app.provide(RBT_CONTEXT_KEY, rbph);
  app.mount(element);
  return () => {
    app?.unmount();
    app = undefined;
  };
}

export default { mount };
