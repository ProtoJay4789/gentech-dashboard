# ⚡ GenTech Dashboard Engine

**JSON-driven dashboard renderer for AI agents. Zero dependencies. 8 section types. Themeable.**

Turn any JSON config + data file into a fully interactive dashboard in seconds. Built for the agent economy — your AI agent can generate dashboards, users can customize them, and everything stays in plain JSON.

```js
const dash = new DashboardEngine({ template, data });
await dash.init('#app');
```

## 🚀 Quick Start

```html
<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <div id="app"></div>
  <script src="https://cdn.jsdelivr.net/gh/ProtoJay4789/gentech-dashboard@main/dist/dashboard-engine.js"></script>
  <script>
    const template = {
      meta: { title: "My Dashboard", subtitle: "Powered by GenTech" },
      theme: { mode: "dark", colors: { "--bg": "#0a0e17", "--gold": "#00ff88" } },
      tabs: [{ id: "main", label: "Overview", icon: "📊", sections: ["stats"] }],
      sections: [{
        id: "stats",
        title: "Key Metrics",
        type: "stats",
        dataSource: "metrics",
        cardTemplate: { fields: [
          { key: "value", label: "Total", format: "money" },
          { key: "change", label: "24h", format: "percent" }
        ]}
      }]
    };

    const data = {
      metrics: { value: 12500, change: 3.2 }
    };

    const dash = new DashboardEngine({ template, data });
    dash.init('#app');
  </script>
</body>
</html>
```

## 📦 Installation

### CDN (fastest)
```html
<script src="https://cdn.jsdelivr.net/gh/ProtoJay4789/gentech-dashboard@main/dist/dashboard-engine.js"></script>
```

### npm
```bash
npm install gentech-dashboard
```
```js
import DashboardEngine from 'gentech-dashboard';
```

### Direct download
Download `dist/dashboard-engine.js` (38KB, zero deps) and host it yourself.

## 🎨 Section Types

| Type | Use For | Example |
|------|---------|---------|
| `stats` | Key metrics in a grid | Portfolio value, character stats |
| `table` | Rows of data | Positions, transactions, restaurants |
| `progress` | Progress bars | Allocation breakdown, build completion |
| `checklist` | Milestones with checkboxes | Goals, task tracking |
| `grid` | Image/card grids | NFT galleries, team members |
| `cards` | Rich content cards | Blog posts, project showcases |
| `timeline` | Chronological events | Transaction history, activity feed |
| `custom` | Raw HTML injection | Anything else |

## 🎯 Field Formats

| Format | Renders As | Example |
|--------|-----------|---------|
| `money` | `$1,234.56` | Portfolio values |
| `percent` | `+3.2%` | Price changes, APY |
| `badge` | Colored pill | Chain names, status |
| `date` | `Jun 14, 2026` | Transaction dates |
| `number` | `2.19` | Token amounts |
| `tags` | Multiple pills | Skill tags, categories |
| `text` | Plain text | Names, descriptions |

## 🏗️ Template Structure

```json
{
  "meta": {
    "title": "DASHBOARD NAME",
    "subtitle": "Description",
    "dataUrl": "data.json",
    "refreshMs": 60000
  },
  "theme": {
    "mode": "dark",
    "colors": {
      "--bg": "#0a0e17",
      "--panel-bg": "#111827",
      "--gold": "#00ff88",
      "--text": "#e5e7eb"
    }
  },
  "tabs": [
    { "id": "main", "label": "Overview", "icon": "📊", "sections": ["metrics"] }
  ],
  "sections": [
    {
      "id": "metrics",
      "title": "Key Metrics",
      "type": "stats",
      "dataSource": "metrics",
      "cardTemplate": {
        "fields": [
          { "key": "total", "label": "Total Value", "format": "money" }
        ]
      }
    }
  ]
}
```

## 🎨 Theme Customization

### Pre-built themes

| Theme | Primary | Accent | Best For |
|-------|---------|--------|----------|
| **Default** | `#00ff88` | `#00ccff` | DeFi, general |
| **Avalanche** | `#e8652a` | `#e84142` | AVAX ecosystem |
| **Ethereum** | `#627eea` | `#627eea` | ETH ecosystem |
| **Solana** | `#9945ff` | `#14f195` | SOL ecosystem |
| **Fire** | `#c9a84c` | `#ff6b35` | Gaming, competitive |

### Custom colors
```json
{
  "theme": {
    "colors": {
      "--bg": "#your-bg",
      "--panel-bg": "#your-panel",
      "--gold": "#your-accent",
      "--text": "#your-text"
    }
  }
}
```

## 🔧 API

### `new DashboardEngine(config)`
- `config.template` — Template JSON object
- `config.templateUrl` — URL to fetch template from
- `config.data` — Data JSON object
- `config.templateUrl` — URL to fetch data from

### `dash.init(rootSelector)`
Renders the dashboard into the specified DOM element.

### `dash.refreshData()`
Re-fetches data from `meta.dataUrl` and re-renders.

### `dash.destroy()`
Cleans up intervals and event listeners.

### `dash.get(path, fallback)`
Gets a value from the data object using dot notation: `dash.get('portfolio.totalValue', 0)`.

## 📁 Project Structure

```
gentech-dashboard/
├── src/
│   └── dashboard-engine.js    ← source
├── dist/
│   └── dashboard-engine.js    ← production (38KB)
├── examples/
│   ├── defi/                  ← DeFi position tracker
│   ├── gaming/                ← Character build tracker
│   └── travel/                ← Trip planner
├── docs/
│   └── TEMPLATE-GUIDE.md      ← How to create templates
├── package.json
└── README.md
```

## 🏆 Hackathon Ready

This engine is designed for hackathons:

- **Zero dependencies** — drop into any project
- **JSON-driven** — agents can generate dashboards programmatically
- **Themeable** — match any brand in seconds
- **8 section types** — covers most dashboard needs
- **Mobile-first** — responsive by default
- **Auto-refresh** — live data out of the box

### Use cases
- **DeFi dashboards** — LP positions, yield farming, portfolio tracking
- **Gaming dashboards** — Character builds, leaderboards, progress
- **Travel dashboards** — Trip planning, budget tracking, itineraries
- **Agent dashboards** — Task status, performance metrics, logs
- **Community dashboards** — Member profiles, events, announcements

## 📄 License

MIT — use it for anything. Built by GenTech Labs for the agent economy.

---

**Built with ❤️ by [GenTech Labs](https://github.com/ProtoJay4789)** — Tough love for the agent economy.
