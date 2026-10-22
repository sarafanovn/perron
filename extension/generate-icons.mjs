import { mkdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const svgPath = path.join(rootDir, 'public/favicon.svg')
const outDir = path.join(rootDir, 'dist-extension/icons')
const sizes = [48, 96, 128]

mkdirSync(outDir, { recursive: true })
const svgBuffer = readFileSync(svgPath)

await Promise.all(
  sizes.map(async (size) => {
    const outPath = path.join(outDir, `icon-${size}.png`)
    await sharp(svgBuffer).resize(size, size).png().toFile(outPath)
    console.log(`Wrote ${path.relative(rootDir, outPath)}`)
  })
)
