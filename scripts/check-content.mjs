import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const requiredFiles = [
  'docs/index.md',
  'docs/reading-map.md',
  'docs/practice/index.md',
  'docs/intermediate/index.md',
  'docs/version-notes.md',
  'docs/release-checklist.md',
]

const blockedPatterns = [
  { name: 'TODO', regex: /\bTODO\b/g },
  { name: 'FIXME', regex: /\bFIXME\b/g },
  { name: 'TBD', regex: /\bTBD\b/g },
  { name: '待补', regex: /待补/g },
  { name: '需要补充', regex: /需要补充/g },
]

const allowLinePatterns = [
  /创建一个 TODO 应用/,
  /搜索 `TODO`、`待补`、`需要补充`、`TBD`/,
  /TODO state/,
  /TODO snapshot/,
  /临时 TODO/,
]

// 代码围栏语言白名单：Shiki 能识别且本项目实际使用的语言。
// 写错标签（如 diagram）时 Shiki 会静默回退成纯文本，不报错也不高亮，
// 这里在构建前显式拦下。新增一种语言示例时，把它的标签登记到这里即可。
const allowedFenceLanguages = new Set([
  'text', 'txt', 'plaintext', 'console',
  'bash', 'sh', 'shell', 'powershell', 'dockerfile',
  'ts', 'typescript', 'tsx', 'js', 'javascript', 'jsx', 'vue',
  'json', 'jsonc', 'yaml', 'yml', 'toml', 'ini',
  'python', 'go', 'rust', 'java', 'kotlin', 'c', 'cpp', 'sql',
  'markdown', 'md', 'html', 'xml', 'css', 'scss', 'diff', 'http',
  'mermaid', // 由 vitepress-plugin-mermaid 渲染为图表，而非 Shiki 高亮
])

// 从 info string 提取纯语言标签：取第一个空白分隔 token，
// 再剥离 VitePress 修饰符（行高亮 {1,2}、:line-numbers、[label]）。
function extractFenceLanguage(info) {
  const token = info.trim().split(/\s+/)[0]
  if (!token) return ''
  return token.split(/[{:[]/)[0].toLowerCase()
}

const ignoredMarkdownPathSegments = new Set([
  '_archive',
  'superpowers',
])

async function walkMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name.startsWith('.worktrees') ||
        ignoredMarkdownPathSegments.has(entry.name)
      ) {
        return []
      }
      return walkMarkdownFiles(fullPath)
    }
    return entry.name.endsWith('.md') ? [fullPath] : []
  }))

  return files.flat()
}

async function ensureRequiredFiles() {
  const missingFiles = []
  for (const file of requiredFiles) {
    try {
      await stat(path.join(rootDir, file))
    } catch {
      missingFiles.push(file)
    }
  }
  return missingFiles
}

async function collectTargets() {
  return [
    path.join(rootDir, 'README.md'),
    ...await walkMarkdownFiles(path.join(rootDir, 'docs')),
    path.join(rootDir, 'practice', 'README.md'),
  ]
}

async function checkBlockedPatterns() {
  const targets = await collectTargets()

  const issues = []

  for (const file of targets) {
    const content = await readFile(file, 'utf8')
    const lines = content.split('\n')

    lines.forEach((line, index) => {
      if (allowLinePatterns.some((pattern) => pattern.test(line))) {
        return
      }
      for (const pattern of blockedPatterns) {
        if (pattern.regex.test(line)) {
          issues.push({
            file: path.relative(rootDir, file),
            line: index + 1,
            token: pattern.name,
            content: line.trim(),
          })
        }
        pattern.regex.lastIndex = 0
      }
    })
  }

  return issues
}

async function checkFenceLanguages() {
  const targets = await collectTargets()
  const issues = []
  const fenceRegex = /^(`{3,})(.*)$/

  for (const file of targets) {
    const content = await readFile(file, 'utf8')
    const lines = content.split('\n')
    let openFenceLength = 0

    lines.forEach((line, index) => {
      const match = fenceRegex.exec(line)
      if (!match) {
        return
      }
      const fenceLength = match[1].length
      const info = match[2].trim()

      if (openFenceLength === 0) {
        openFenceLength = fenceLength
        const language = extractFenceLanguage(info)
        if (language && !allowedFenceLanguages.has(language)) {
          issues.push({
            file: path.relative(rootDir, file),
            line: index + 1,
            language,
          })
        }
        return
      }

      if (fenceLength >= openFenceLength && info === '') {
        openFenceLength = 0
      }
    })
  }

  return issues
}

const missingFiles = await ensureRequiredFiles()
const issues = await checkBlockedPatterns()
const fenceIssues = await checkFenceLanguages()

if (missingFiles.length === 0 && issues.length === 0 && fenceIssues.length === 0) {
  console.log('check:content 通过')
  process.exit(0)
}

if (missingFiles.length > 0) {
  console.error('缺少关键页面：')
  for (const file of missingFiles) {
    console.error(`- ${file}`)
  }
}

if (issues.length > 0) {
  console.error('发现疑似未收口文案：')
  for (const issue of issues) {
    console.error(`- ${issue.file}:${issue.line} [${issue.token}] ${issue.content}`)
  }
}

if (fenceIssues.length > 0) {
  console.error('发现未知代码围栏语言标签（Shiki 不识别，会静默回退为纯文本）：')
  for (const issue of fenceIssues) {
    console.error(`- ${issue.file}:${issue.line} \`\`\`${issue.language}（如确为合法语言，请登记到 check-content.mjs 的 allowedFenceLanguages）`)
  }
}

process.exit(1)
