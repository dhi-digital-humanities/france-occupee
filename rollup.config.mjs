import {nodeResolve} from '@rollup/plugin-node-resolve'
import riot from 'rollup-plugin-riot'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'

import dotenv from "rollup-plugin-dotenv"

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
    dotenv(),
    commonjs(),
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
    dotenv(),
    commonjs(),
    ...(optimize ? [terser()] : [])
  ]
}

export default [app, database]
