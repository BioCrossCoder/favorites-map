import { defineConfig } from 'wxt';
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  srcDir: 'src',
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    permissions: ['storage', 'tabs', 'sidePanel', 'history', 'bookmarks', 'unlimitedStorage', 'downloads'],
    default_locale: 'en',
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    icons: {
      16: '/icon.png',
      24: '/icon.png',
      48: '/icon.png',
      96: '/icon.png',
      128: '/icon.png'
    }
  },
  vite: () => ({
    plugins: [
      AutoImport({
        resolvers: [
          ElementPlusResolver(),
          IconsResolver({
            prefix: 'Icon',
          }),
        ],
        dts: './auto-imports.d.ts'
      }),
      Components({
        resolvers: [
          ElementPlusResolver(),
          IconsResolver({
            enabledCollections: ['ep'],
          })
        ],
        dts: './components.d.ts'
      }),
      Icons({
        autoInstall: true,
      })
    ]
  })
});
