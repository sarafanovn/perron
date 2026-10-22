import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const pkg = JSON.parse(readFileSync(path.join(rootDir, 'package.json'), 'utf8'))
const template = readFileSync(path.join(rootDir, 'extension/manifest.template.json'), 'utf8')

const manifest = template.replace('__VERSION__', pkg.version)

writeFileSync(path.join(rootDir, 'dist-extension/manifest.json'), manifest)
console.log(`Wrote dist-extension/manifest.json (version ${pkg.version})`)
