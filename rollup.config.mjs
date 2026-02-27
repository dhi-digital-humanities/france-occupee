import {nodeResolve} from '@rollup/plugin-node-resolve'
import riot from 'rollup-plugin-riot'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'
import nodePolyfills from 'rollup-plugin-polyfill-node'

import replace from '@rollup/plugin-replace'
import dotenv from 'dotenv'
dotenv.config()
// import {default as rpd} from "rollup-plugin-dotenv"

const envReplacements = {
  preventAssignment: true,
  'process.env.APP_ENV': JSON.stringify(process.env.APP_ENV),
  'process.env.ROOT_URL': JSON.stringify(process.env.ROOT_URL),
  'process.env.IMAGE_PATH': JSON.stringify(process.env.IMAGE_PATH || ''),
  'process.env.PMTILES_URL': JSON.stringify(process.env.PMTILES_URL)
};

const APP_ENV = process.env['APP_ENV'] || 'development'
const optimize = (APP_ENV == 'production')

const app = {
  input: '_assets/js/app.js',
  output: {
    file: 'assets/app.js',
    format: optimize ? 'iife' : 'esm',
    sourcemap: !optimize
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    replace(envReplacements),
    nodePolyfills(),
    riot(),
    ...(optimize ? [terser()] : [])
  ]
}

const database = {
  input: '_assets/js/db.js',
  output: {
    file: 'assets/db.js',
    format: optimize ? 'iife' : 'esm',
    sourcemap: !optimize
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    replace(envReplacements),
    nodePolyfills(),
    ...(optimize ? [terser()] : [])
  ]
}

const loader = {
  input: '_assets/js/loader.js',
  output: {
    file: 'assets/loader.js',
    format: optimize ? 'iife' : 'esm',
    sourcemap: !optimize
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    replace(envReplacements),
    riot(),
    ...(optimize ? [terser()] : [])
  ]
}

export default [app, database, loader]
