import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const updateDirectory = path.join(projectRoot, 'dist', 'app-updates')

if (fs.existsSync(updateDirectory)) {
  for (const filename of fs.readdirSync(updateDirectory)) {
    if (/\.(apk|aab)$/i.test(filename)) {
      fs.rmSync(path.join(updateDirectory, filename), { force: true })
    }
  }
}

console.log('Update installer binaries were excluded from the native app bundle.')
