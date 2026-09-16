import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

// Library build: produces dist-lib/{jui-grid-vue.es.js,jui-grid-vue.cjs.js,index.d.ts,style.css}
export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath: './tsconfig.lib.json',
      outDir: 'dist-lib',
      insertTypesEntry: true,
    }),
  ],
  publicDir: false,
  build: {
    outDir: 'dist-lib',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: new URL('src/index.ts', import.meta.url).pathname,
      name: 'JuiGridVue',
      fileName: (format) => `jui-grid-vue.${format}.js`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // jui-ui-vue is a real "dependencies" entry (not bundled) - npm installs it for consumers,
      // same rationale as externalizing the "vue" peer dependency.
      external: ['vue', 'jui-ui-vue'],
      output: {
        exports: 'named',
        globals: { vue: 'Vue', 'jui-ui-vue': 'JuiUiVue' },
        assetFileNames: (asset) => (asset.names?.[0]?.endsWith('.css') ? 'style.css' : 'assets/[name][extname]'),
      },
    },
  },
})
