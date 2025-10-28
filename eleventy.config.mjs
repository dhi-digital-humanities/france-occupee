import path from "node:path"
import * as sass from "sass"
import { I18nPlugin } from "@11ty/eleventy"

export default async function(ec) {
    ec.addPassthroughCopy('assets')
    ec.addPassthroughCopy('data')
}
