import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import type { AnalysisResult } from '../types/graph';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ReportOptions {
  format: ('html' | 'json')[];
  outputPath: string;
}

export async function generateReport(
  result: AnalysisResult,
  options: ReportOptions
): Promise<string> {
  const outputDir = path.dirname(options.outputPath);
  await fs.ensureDir(outputDir);
  
  // Generate JSON report
  if (options.format.includes('json')) {
    const jsonPath = options.outputPath.replace('.html', '.json');
    await fs.writeJSON(jsonPath, serializeResult(result), { spaces: 2 });
    console.log(`  JSON report: ${jsonPath}`);
  }
  
  // Generate HTML report
  if (options.format.includes('html')) {
    const htmlContent = await generateHTMLReport(result, outputDir);
    await fs.writeFile(options.outputPath, htmlContent);
    console.log(`  HTML report: ${options.outputPath}`);
  }
  
  return options.outputPath;
}

function serializeResult(result: AnalysisResult): any {
  return {
    project: result.project,
    components: result.components,
    metrics: Array.from(result.metrics.entries()).map(([key, value]) => ({
      ...value,
    })),
    aiInsights: result.aiInsights,
  };
}

async function generateHTMLReport(result: AnalysisResult, outputDir: string): Promise<string> {
  // Check if React app build exists
  // Use process.cwd() to find app/dist relative to CLI installation or project root
  const possiblePaths = [
    path.join(__dirname, '../../app/dist'),  // Development: src/output -> app/dist
    path.join(__dirname, '../../../app/dist'), // Production: dist -> app/dist (bundled)
    path.resolve(process.cwd(), 'app/dist'),   // Running from project root
  ];
  
  let appDistPath: string | null = null;
  let appIndexPath: string | null = null;
  
  for (const p of possiblePaths) {
    const indexPath = path.join(p, 'index.html');
    if (await fs.pathExists(indexPath)) {
      appDistPath = p;
      appIndexPath = indexPath;
      break;
    }
  }
  
  let html: string;
  
  // Try to use pre-built React app
  if (appIndexPath && appDistPath) {
    html = await fs.readFile(appIndexPath, 'utf-8');
    
    // Inject data as global variable
    const dataScript = `<script>window.__BLAST_RADIUS_DATA__ = ${JSON.stringify(serializeResult(result))};</script>`;
    html = html.replace('</head>', `${dataScript}</head>`);
    
    // Copy assets to output directory
    const assetsSrcPath = path.join(appDistPath, 'assets');
    const assetsDestPath = path.join(outputDir, 'assets');
    if (await fs.pathExists(assetsSrcPath)) {
      // Clean old assets first
      await fs.remove(assetsDestPath);
      await fs.copy(assetsSrcPath, assetsDestPath, { overwrite: true });
    }
  } else {
    // Fallback: generate standalone HTML
    html = await generateStandaloneHTML(result);
  }
  
  return html;
}

async function generateStandaloneHTML(result: AnalysisResult): Promise<string> {
  const riskDistribution = {
    low: Array.from(result.metrics.values()).filter(m => m.level === 'low').length,
    medium: Array.from(result.metrics.values()).filter(m => m.level === 'medium').length,
    high: Array.from(result.metrics.values()).filter(m => m.level === 'high').length,
    critical: Array.from(result.metrics.values()).filter(m => m.level === 'critical').length,
  };
  
  const topRiskComponents = Array.from(result.metrics.values())
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10)
    .map(m => {
      const comp = result.components.find(c => c.id === m.componentId);
      return `
        <div class="component-card">
          <div class="component-name">${comp?.name || m.componentId}</div>
          <div class="component-score ${m.level}">${m.riskScore}</div>
        </div>
      `;
    })
    .join('');
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blast Radius Report - ${result.project.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'JetBrains Mono', monospace;
      background: linear-gradient(135deg, #0F0F23 0%, #1A1A2E 100%);
      color: #E2E8F0;
      padding: 2rem;
      min-height: 100vh;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 { 
      font-size: 2.5rem;
      background: linear-gradient(135deg, #00D9FF 0%, #7C3AED 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    .subtitle { color: #94A3B8; margin-bottom: 2rem; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: rgba(26, 26, 46, 0.8);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 1.5rem;
      border-radius: 12px;
    }
    .stat-value {
      font-size: 2.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #00D9FF 0%, #7C3AED 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .stat-label { color: #94A3B8; margin-top: 0.5rem; font-size: 0.875rem; }
    .risk-distribution {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .risk-card {
      padding: 1.5rem;
      border-radius: 12px;
      text-align: center;
    }
    .risk-card.low { background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.5); }
    .risk-card.medium { background: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.5); }
    .risk-card.high { background: rgba(249, 115, 22, 0.2); border: 1px solid rgba(249, 115, 22, 0.5); }
    .risk-card.critical { background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); }
    .risk-count { font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
    .risk-card.low .risk-count { color: #10B981; }
    .risk-card.medium .risk-count { color: #F59E0B; }
    .risk-card.high .risk-count { color: #F97316; }
    .risk-card.critical .risk-count { color: #EF4444; }
    .risk-label { color: #E2E8F0; font-size: 0.875rem; text-transform: capitalize; }
    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #00D9FF;
    }
    .components-list {
      display: grid;
      gap: 0.75rem;
    }
    .component-card {
      background: rgba(26, 26, 46, 0.8);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 1rem;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.3s;
    }
    .component-card:hover {
      border-color: #00D9FF;
      box-shadow: 0 0 20px rgba(0, 217, 255, 0.3);
    }
    .component-name { font-weight: 500; }
    .component-score {
      font-weight: 700;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
    }
    .component-score.low { background: rgba(16, 185, 129, 0.2); color: #10B981; }
    .component-score.medium { background: rgba(245, 158, 11, 0.2); color: #F59E0B; }
    .component-score.high { background: rgba(249, 115, 22, 0.2); color: #F97316; }
    .component-score.critical { background: rgba(239, 68, 68, 0.2); color: #EF4444; }
    .footer {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
      color: #64748B;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔥 Blast Radius Report</h1>
    <p class="subtitle">Project: ${result.project.name} • Analyzed: ${new Date(result.project.analyzedAt).toLocaleString()}</p>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${result.project.componentCount}</div>
        <div class="stat-label">Total Components</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${result.components.reduce((sum, c) => sum + c.dependencies.length, 0)}</div>
        <div class="stat-label">Total Dependencies</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${result.components.length}</div>
        <div class="stat-label">React Components</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${result.components.reduce((sum, c) => sum + (c.lineCount || 0), 0).toLocaleString()}</div>
        <div class="stat-label">Total Lines</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${result.components.length > 0 ? Math.round(result.components.reduce((sum, c) => sum + (c.lineCount || 0), 0) / result.components.length) : 0}</div>
        <div class="stat-label">Avg Lines/Component</div>
      </div>
    </div>
    
    <h2 class="section-title">Risk Distribution</h2>
    <p style="color: #94A3B8; margin-bottom: 1rem; font-size: 0.875rem;">Risk based on lines of code: Low (&lt;100), Medium (100-300), High (300-500), Critical (500+)</p>
    <div class="risk-distribution">
      <div class="risk-card critical">
        <div class="risk-count">${riskDistribution.critical}</div>
        <div class="risk-label">Critical</div>
      </div>
      <div class="risk-card high">
        <div class="risk-count">${riskDistribution.high}</div>
        <div class="risk-label">High</div>
      </div>
      <div class="risk-card medium">
        <div class="risk-count">${riskDistribution.medium}</div>
        <div class="risk-label">Medium</div>
      </div>
      <div class="risk-card low">
        <div class="risk-count">${riskDistribution.low}</div>
        <div class="risk-label">Low</div>
      </div>
    </div>
    
    <h2 class="section-title">Top 10 High-Risk Components</h2>
    <div class="components-list">
      ${topRiskComponents}
    </div>
    
    ${result.aiInsights ? `
      <h2 class="section-title" style="margin-top: 2rem;">AI Insights</h2>
      <div class="stat-card">
        <p style="margin-bottom: 1rem;">${result.aiInsights.summary}</p>
        ${result.aiInsights.risks.length > 0 ? `
          <h3 style="color: #F97316; margin-bottom: 0.5rem;">⚠️ Risks</h3>
          <ul style="margin-bottom: 1rem; padding-left: 1.5rem;">
            ${result.aiInsights.risks.map(r => `<li>${r}</li>`).join('')}
          </ul>
        ` : ''}
        ${result.aiInsights.suggestions.length > 0 ? `
          <h3 style="color: #10B981; margin-bottom: 0.5rem;">💡 Suggestions</h3>
          <ul style="padding-left: 1.5rem;">
            ${result.aiInsights.suggestions.map(s => `<li>${s}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    ` : ''}
    
    <div class="footer">
      Generated by Blast Radius • <a href="https://github.com/qing/blast-radius" style="color: #00D9FF;">GitHub</a>
    </div>
  </div>
</body>
</html>
`;
}
