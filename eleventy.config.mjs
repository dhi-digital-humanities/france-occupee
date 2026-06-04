import path from "node:path"
import * as sass from "sass"
import { I18nPlugin } from "@11ty/eleventy"

import dotenv from 'dotenv'
dotenv.config()

export default async function(ec) {
  ec.setServerPassthroughCopyBehavior("passthrough")

  ec.addPassthroughCopy('assets')
  ec.addPassthroughCopy('data')
  ec.addPassthroughCopy({"_data/translations.json": "data/translations.json"})
  ec.addPassthroughCopy({"node_modules/bootstrap-icons/bootstrap-icons.svg": "assets/bootstrap-icons.svg"})
}
