import path from "node:path"
import * as sass from "sass"
import { I18nPlugin } from "@11ty/eleventy"

import dotenv from 'dotenv'
dotenv.config()

export default async function(ec) {
  ec.setServerPassthroughCopyBehavior("passthrough")

  // test/ holds build-time tooling (rollup spec entry, benchmark harness), not
  // site content — nothing there should end up in _site/
  ec.ignores.add('test/')

  ec.addPassthroughCopy('assets')
  ec.addPassthroughCopy('data')
  ec.addPassthroughCopy({"_data/translations.json": "data/translations.json"})
  ec.addPassthroughCopy({"node_modules/bootstrap-icons/bootstrap-icons.svg": "assets/bootstrap-icons.svg"})
}
