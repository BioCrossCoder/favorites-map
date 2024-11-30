import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    permissions: ['storage', 'tabs'],
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
  }
});
