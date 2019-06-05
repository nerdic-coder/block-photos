import { Config } from '@stencil/core';
import builtins from 'rollup-plugin-node-builtins';
// import globals from 'rollup-plugin-node-globals';
// https://stenciljs.com/docs/config

export const config: Config = {
  outputTargets: [
    {
      type: 'www',
      serviceWorker: {
        swSrc: 'src/sw.js'
      },
      copy: [
        { src: '_headers' },
        { src: '_redirects' },
        { src: 'browserconfig.xml' },
        { src: 'redirect.html' },
        { src: 'site.webmanifest' }
      ]
    }
  ],
  globalScript: 'src/global/app.ts',
  globalStyle: 'src/global/app.css',
  nodeResolve: {
    browser: true,
    preferBuiltins: false
  },
  plugins: [builtins()]
};
