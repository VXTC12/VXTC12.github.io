import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const nextVersion = process.argv[2]

if (!/^\d+\.\d+\.\d+$/.test(nextVersion ?? '')) {
  console.error('用法：npm run app:version -- 1.0.1')
  process.exit(1)
}

const packagePath = path.join(projectRoot, 'package.json')
const packageLockPath = path.join(projectRoot, 'package-lock.json')
const gradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle')

const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'))
let gradle = fs.readFileSync(gradlePath, 'utf8')

const compareVersions = (left, right) => {
  const leftParts = left.split('.').map(Number)
  const rightParts = right.split('.').map(Number)
  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) return leftParts[index] - rightParts[index]
  }
  return 0
}

if (compareVersions(nextVersion, packageJson.version) <= 0) {
  console.error(`新版本号必须高于当前版本 ${packageJson.version}`)
  process.exit(1)
}

const currentCodeMatch = gradle.match(/versionCode\s+(\d+)/)
if (!currentCodeMatch) {
  throw new Error('没有在 android/app/build.gradle 中找到 versionCode')
}

const nextCode = Number(currentCodeMatch[1]) + 1
packageJson.version = nextVersion
packageLock.version = nextVersion
packageLock.packages[''].version = nextVersion
gradle = gradle
  .replace(/versionCode\s+\d+/, `versionCode ${nextCode}`)
  .replace(/versionName\s+"[^"]+"/, `versionName "${nextVersion}"`)

fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`)
fs.writeFileSync(packageLockPath, `${JSON.stringify(packageLock, null, 2)}\n`)
fs.writeFileSync(gradlePath, gradle)

console.log(`APP 版本已更新：${nextVersion}（versionCode ${nextCode}）`)
