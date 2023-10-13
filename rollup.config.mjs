import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import vue from 'rollup-plugin-vue';  // Import the rollup-plugin-vue

export default {
  input: 'src/index.js',  // Point to src/index.js instead of src/MainComponent.vue
  output: {
    name: 'PdfVueLibrary',  // Give a more descriptive name to your library
    file: 'dist/pdf-vue-library.js',
    format: 'es',
    exports: 'named'  // Ensure that Rollup preserves named exports
  },
  plugins: [
    resolve(),
    commonjs(),
    vue({ include: /\.vue$/ }),  // Compiles Vue SFCs, ensure to add this line
  ],
  external: ['vue'],  // This tells Rollup not to bundle Vue but to use the external Vue module from the user's environment
};