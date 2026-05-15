import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const configContent = readFileSync(path.join(rootDir, '.vitepress', 'config.mts'), 'utf8')
const homepageContent = readFileSync(path.join(rootDir, 'docs', 'index.md'), 'utf8')
const practiceContent = readFileSync(path.join(rootDir, 'docs', 'practice', 'index.md'), 'utf8')
const intermediateContent = readFileSync(path.join(rootDir, 'docs', 'intermediate', 'index.md'), 'utf8')
const interviewContent = readFileSync(path.join(rootDir, 'docs', 'interview', 'index.md'), 'utf8')
const learningPathsContent = readFileSync(path.join(rootDir, 'docs', 'learning-paths', 'index.md'), 'utf8')
const readingMapContent = readFileSync(path.join(rootDir, 'docs', 'reading-map.md'), 'utf8')
const exploreLinksContent = readFileSync(path.join(rootDir, '.vitepress', 'theme', 'components', 'HomeExploreLinks.vue'), 'utf8')

const issues = []

function extractBracketBlock(content, marker) {
  const markerIndex = content.indexOf(marker)
  if (markerIndex === -1) {
    return ''
  }

  const openIndex = content.indexOf('[', markerIndex)
  if (openIndex === -1) {
    return ''
  }

  let depth = 0
  let quote = null

  for (let index = openIndex; index < content.length; index += 1) {
    const char = content[index]
    const previous = content[index - 1]

    if (quote) {
      if (char === quote && previous !== '\\') {
        quote = null
      }
      continue
    }

    if (char === '\'' || char === '"' || char === '`') {
      quote = char
      continue
    }

    if (char === '[') {
      depth += 1
      continue
    }

    if (char === ']') {
      depth -= 1
      if (depth === 0) {
        return content.slice(openIndex, index + 1)
      }
    }
  }

  return ''
}

const navBlock = extractBracketBlock(configContent, 'nav:')
const rootSidebarBlock = extractBracketBlock(configContent, `'/':`)
const animationLabSidebarBlock = extractBracketBlock(configContent, `'/animation-lab/':`)

const requiredNavTexts = ['实践篇', '中级篇', '动画实验室', '面试题专区', '专栏', '本书仓库']
for (const text of requiredNavTexts) {
  if (!configContent.includes(`text: '${text}'`)) {
    issues.push(`顶层导航缺少「${text}」入口`)
  }
}

if (!navBlock.includes(`text: '动画实验室'`) || !navBlock.includes(`link: '/animation-lab/'`)) {
  issues.push('顶层导航缺少动画实验室的文字或链接')
}

const rootSidebarLinks = ['/discover/', '/animation-lab/', '/practice/', '/intermediate/', '/interview/']
for (const link of rootSidebarLinks) {
  if (!rootSidebarBlock.includes(`link: '${link}'`)) {
    issues.push(`根侧边栏缺少 ${link} 入口`)
  }
}

if (!configContent.includes(`link: '/interview/fundamentals/'`)) {
  issues.push('面试题专区侧边栏缺少基础概念入口')
}

if (!configContent.includes(`link: '/interview/bagua/'`)) {
  issues.push('面试题专区侧边栏缺少八股文入口')
}

if (!animationLabSidebarBlock) {
  issues.push('缺少动画实验室侧边栏配置')
}

if (!homepageContent.includes('/animation-lab/')) {
  issues.push('首页 hero actions 缺少动画实验室入口')
}

if (!exploreLinksContent.includes('/animation-lab/')) {
  issues.push('首页探索卡片缺少动画实验室入口')
}

if (!practiceContent.includes('/learning-paths/')) {
  issues.push('实践页缺少返回学习路径的入口')
}

if (!practiceContent.includes('/discover/')) {
  issues.push('实践页缺少返回 discovery 中心的入口')
}

if (!practiceContent.includes('/intermediate/')) {
  issues.push('实践页缺少前往中级篇的入口')
}

if (!intermediateContent.includes('/learning-paths/')) {
  issues.push('中级篇缺少返回学习路径的入口')
}

if (!intermediateContent.includes('/discover/')) {
  issues.push('中级篇缺少返回 discovery 中心的入口')
}

if (!intermediateContent.includes('/practice/')) {
  issues.push('中级篇缺少返回实践篇的入口')
}

if (!interviewContent.includes('/interview/bagua/')) {
  issues.push('面试题专区首页缺少八股文入口')
}

if (!learningPathsContent.includes('/discover/')) {
  issues.push('学习路径页缺少返回 discovery 中心的入口')
}

if (!learningPathsContent.includes('/practice/')) {
  issues.push('学习路径页缺少直达实践篇的入口')
}

if (!learningPathsContent.includes('/intermediate/')) {
  issues.push('学习路径页缺少直达中级篇的入口')
}

if (!readingMapContent.includes('/discover/')) {
  issues.push('阅读地图缺少返回 discovery 中心的入口')
}

if (issues.length === 0) {
  console.log('check:navigation-entry 通过')
  process.exit(0)
}

console.error('导航与板块入口校验未通过：')
for (const issue of issues) {
  console.error(`- ${issue}`)
}

process.exit(1)
