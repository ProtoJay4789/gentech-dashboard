# ⚡ GenTech Dashboard Engine

**DeFi-native dashboard infrastructure for the agent economy. Zero dependencies. Live data. Grant-ready.**

![GenTech Dashboard](https://protojay4789.github.io/assets/dashboard-thumbnail.png)

---

## Why This Exists

DeFi dashboards are broken. They're either:
- **Too complex** — requiring full React/Next.js stacks for a simple position tracker
- **Too static** — showing stale data that's already outdated by the time you see it
- **Too generic** — built for "any dashboard" but optimized for none

**GenTech Dashboard is DeFi-first.** We built it to track LP positions, yield farming, agent scouts, and milestone progression — then made it extensible enough for anything else.

This is the infrastructure layer for **Agent Arena Economy (AAE)** — where AI agents scout opportunities, manage positions, and help users climb from Scout to Sovereign.

---

## 🎯 What Makes This Different

| Feature | Traditional Dashboards | GenTech Dashboard |
|---------|----------------------|-------------------|
| **Dependencies** | React, Next.js, Webpack | **Zero. Single 38KB file.** |
| **Data Format** | API calls, GraphQL | **JSON files. Any agent can generate them.** |
| **DeFi Support** | Custom code per protocol | **Built-in: LP curves, fee tracking, milestones** |
| **Live Data** | Manual refresh | **Auto-refresh with DexScreener/Birdeye** |
| **Hackathon Speed** | Days to scaffold | **Minutes. Copy, customize, ship.** |
| **Grant Ready** | "We built a dashboard" | **"We built dashboard infrastructure"** |

---

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
      meta: { title: "MY PORTFOLIO", subtitle: "DeFi Position Tracker" },
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

---

## 🏦 DeFi-Native Features

### LP Position Tracking
```json
{
  "type": "custom",
  "customRender": "lpCurve",
  "dataSource": "curveData"
}
```
- Animated bell curve visualization
- Real-time price marker with glow effects
- Range status (in/out of range)
- Fee efficiency calculations

### Agent Scout Fleet
```json
{
  "type": "stats",
  "dataSource": "scoutFleet",
  "cardTemplate": {
    "fields": [
      { "key": "name", "label": "Scout", "format": "text" },
      { "key": "status", "label": "Status", "format": "badge" },
      { "key": "findings", "label": "Opportunities", "format": "number" }
    ]
  }
}
```
- Multiple scout status indicators (Active/Scanning/Monitoring/Idle)
- Pulse animations for live scouts
- Protocol and chain attribution

### Milestone Progression
```json
{
  "type": "custom",
  "customRender": "feeMilestones",
  "dataSource": "feeMilestones"
}
```
- **Scout** → **Raider** → **Warlord** → **Sovereign**
- Progress bars with percentage tracking
- Time-to-next-tier projections
- Annualized return calculations

### Live Data Integration
```js
// Auto-refresh from DexScreener
fetch('https://api.dexscreener.com/latest/dex/pairs/avalanche/' + POOL_ADDRESS)
  .then(resp => resp.json())
  .then(data => {
    // Update dashboard with live price, volume, liquidity
  });
```

---

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

---

## 🎨 Section Types

| Type | Use For | DeFi Example |
|------|---------|--------------|
| `stats` | Key metrics in a grid | Portfolio value, APR, TVL |
| `table` | Rows of data | Positions, transactions, scout activity |
| `progress` | Progress bars | Allocation breakdown, range status |
| `checklist` | Milestones with checkboxes | Achievement tracking, task completion |
| `grid` | Image/card grids | Pool comparisons, token galleries |
| `cards` | Rich content cards | Strategy details, protocol profiles |
| `timeline` | Chronological events | Transaction history, agent actions |
| `custom` | Raw HTML injection | LP curves, custom visualizations |

---

## 🎯 Field Formats

| Format | Renders As | DeFi Use |
|--------|-----------|----------|
| `money` | `$1,234.56` | Portfolio values, TVL, fees |
| `percent` | `+3.2%` | APR, price changes, efficiency |
| `badge` | Colored pill | Chain names, status, risk levels |
| `date` | `Jun 14, 2026` | Transaction timestamps |
| `number` | `2.19` | Token amounts, bin counts |
| `tags` | Multiple pills | Protocol tags, categories |
| `text` | Plain text | Pair names, descriptions |

---

## 🏗️ Template Structure

```json
{
  "meta": {
    "title": "DASHBOARD NAME",
    "subtitle": "DeFi Position Tracker",
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

---

## 🎨 Themes

### Pre-built for DeFi

| Theme | Primary | Best For |
|-------|---------|----------|
| **Default** | `#00ff88` | General DeFi, yield farming |
| **Avalanche** | `#e8652a` | AVAX ecosystem, LFJ, Pangolin |
| **Ethereum** | `#627eea` | ETH ecosystem, Uniswap, Aave |
| **Solana** | `#9945ff` | SOL ecosystem, Raydium, Orca |
| **Fire** | `#c9a84c` | Gaming, competitive leaderboards |

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

---

## 🔧 API

### `new DashboardEngine(config)`
- `config.template` — Template JSON object
- `config.templateUrl` — URL to fetch template from
- `config.data` — Data JSON object
- `config.dataUrl` — URL to fetch data from

### `dash.init(rootSelector)`
Renders the dashboard into the specified DOM element.

### `dash.refreshData()`
Re-fetches data from `meta.dataUrl` and re-renders.

### `dash.destroy()`
Cleans up intervals and event listeners.

### `dash.get(path, fallback)`
Gets a value from the data object using dot notation:
```js
dash.get('portfolio.totalValue', 0)
```

---

## 📁 Project Structure

```
gentech-dashboard/
├── src/
│   └── dashboard-engine.js    ← source
├── dist/
│   └── dashboard-engine.js    ← production (38KB)
├── examples/
│   ├── defi/                  ← DeFi position tracker (AAE)
│   ├── gaming/                ← Character build tracker
│   └── travel/                ← Trip planner
├── docs/
│   └── TEMPLATE-GUIDE.md      ← How to create templates
├── package.json
└── README.md
```

---

## 🏆 Grant & Hackathon Ready

### Why This Wins

**For DeFi Grants:**
- "We built dashboard infrastructure" > "We built a dashboard"
- Reusable across protocols — LFJ, Pangolin, Uniswap, Aave
- Agent-friendly — AI scouts can generate dashboards programmatically
- Zero dependencies — auditable, secure, lightweight

**For Hackathons:**
- Scaffold in minutes, not days
- JSON-driven — focus on data, not UI code
- Themeable — match any brand instantly
- Mobile-first — responsive by default
- Auto-refresh — live data out of the box

### Built For

| Use Case | How It Helps |
|----------|--------------|
| **DeFi Dashboards** | LP positions, yield farming, portfolio tracking |
| **Agent Dashboards** | Scout activity, opportunity feeds, performance |
| **Gaming Dashboards** | Character builds, leaderboards, progression |
| **Travel Dashboards** | Trip planning, budget tracking, itineraries |
| **Community Dashboards** | Member profiles, events, announcements |

---

## 🔗 Live Examples

- **[AAE DeFi Dashboard](https://protojay4789.github.io/DeFi/defi-dashboard.html)** — Full scout fleet with live DexScreener data
- **[Gaming Dashboard](https://protojay4789.github.io/gentech-dashboard/examples/gaming/)** — POE2 character tracker
- **[Travel Dashboard](https://protojay4789.github.io/gentech-dashboard/examples/travel/)** — Trip planner

---

## 📄 License

MIT — use it for anything. Built by GenTech Labs for the agent economy.

---

**Built with ❤️ by [GenTech Labs](https://github.com/ProtoJay4789)** — Tough love for the agent economy.