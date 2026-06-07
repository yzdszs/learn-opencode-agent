import type { Router } from 'vitepress'

const agentSelectionRouteRedirects: Record<string, string> = {
  '/agent-selection/07-scenario-playbook': '/agent-selection/06-scenario-playbook',
  '/agent-selection/08-poc-evaluation': '/agent-selection/07-poc-evaluation',
  '/agent-selection/09-build-vs-buy': '/agent-selection/08-build-vs-buy',
  '/agent-selection/10-enterprise-copilot-stack': '/agent-selection/09-enterprise-copilot-stack',
  '/agent-selection/11-codebase-agent-selection': '/agent-selection/10-codebase-agent-selection',
  '/agent-selection/12-research-agent-selection': '/agent-selection/11-research-agent-selection',
  '/agent-selection/13-customer-support-knowledge-agent': '/agent-selection/12-customer-support-knowledge-agent',
  '/agent-selection/16-model-routing-selection': '/agent-selection/13-model-routing-selection',
  '/agent-selection/19-vector-database-selection': '/agent-selection/15-vector-database-selection',
  '/agent-selection/20-retrieval-patterns': '/agent-selection/16-retrieval-patterns',
  '/agent-selection/21-enterprise-knowledge-permission': '/agent-selection/18-enterprise-knowledge-permission',
  '/agent-selection/23-mcp-tool-selection': '/agent-selection/19-mcp-tool-selection',
  '/agent-selection/25-text-to-sql-agent': '/agent-selection/20-text-to-sql-agent',
  '/agent-selection/27-observability-trace-replay-eval': '/agent-selection/21-observability-trace-replay-eval',
  '/agent-selection/28-security-permission-selection': '/agent-selection/22-security-permission-selection',
  '/agent-selection/29-cost-latency-selection': '/agent-selection/23-cost-latency-selection',
  '/agent-selection/30-fallback-strategy': '/agent-selection/24-fallback-strategy',
  '/agent-selection/31-embedding-models': '/agent-selection/14-embedding-models',
  '/agent-selection/35-reranker-models': '/agent-selection/17-reranker-models',
}

function normalizeRoutePath(pathname: string): string {
  return decodeURI(pathname)
    .replace(/\.html$/, '')
    .replace(/\/$/, '')
}

function resolveAgentSelectionRedirect(pathname: string): string | undefined {
  return agentSelectionRouteRedirects[normalizeRoutePath(pathname)]
}

function redirectBrowserLocation(url: URL): boolean {
  const targetPath = resolveAgentSelectionRedirect(url.pathname)
  if (!targetPath) {
    return false
  }

  window.location.replace(`${targetPath}${url.search}${url.hash}`)
  return true
}

export function installAgentSelectionRedirects(router: Router): void {
  if (typeof window === 'undefined') {
    return
  }

  redirectBrowserLocation(new URL(window.location.href))

  const previousBeforeRouteChange = router.onBeforeRouteChange
  router.onBeforeRouteChange = async (to) => {
    const previousResult = await previousBeforeRouteChange?.(to)
    if (previousResult === false) {
      return false
    }

    const targetUrl = new URL(to, window.location.href)
    if (redirectBrowserLocation(targetUrl)) {
      return false
    }

    return previousResult
  }
}
