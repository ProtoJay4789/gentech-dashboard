# GenTech Dashboard Templates

Reusable JSON templates for building dashboards. Each template defines the structure, theme, tabs, and sections. Data lives in a separate `-data.json` file.

## Templates

| Template | File | Description |
|----------|------|-------------|
| **DeFi** | `defi-template.json` | LP position tracker, yield farming, portfolio stats |
| **Gaming** | `gaming-template.json` | Character builds, skill trees, progression tracking |
| **Travel** | `travel-template.json` | Trip planning, budget tracking, itinerary management |

## How to Use

1. **Copy the template** you want to customize
2. **Create a matching data file** (e.g., `defi-data.json`) with your actual numbers
3. **Point the template** to your data file via `meta.dataUrl`
4. **Load in the dashboard engine** or open the HTML directly

## Template Structure

```json
{
  "meta": { ... },      // Title, subtitle, refresh interval, chain/protocol info
  "theme": { ... },     // Colors, fonts, container settings
  "tabs": [ ... ],      // Navigation tabs with section references
  "sections": [ ... ],  // Individual content blocks (stats, tables, progress, checklists)
  "footer": { ... }     // Brand footer
}
```

## Section Types

| Type | Use For | Example |
|------|---------|---------|
| `stats` | Key metrics in a grid | Portfolio value, character stats |
| `table` | Rows of data | Positions, transactions, restaurants |
| `progress` | Progress bars | Allocation breakdown, build completion |
| `checklist` | Milestones with checkboxes | Goals, task tracking |

## Field Formats

| Format | Renders As | Example |
|--------|-----------|---------|
| `money` | `$1,234.56` | Portfolio values |
| `percent` | `+3.2%` | Price changes, APY |
| `badge` | Colored pill | Chain names, status |
| `date` | `Jun 14, 2026` | Transaction dates |
| `number` | `2.19` | Token amounts |
| `boolean` | `✓` / `—` | Yes/no flags |

## Example Data Files

- `defi-data-example.json` — Sample multi-chain DeFi portfolio
- Your actual data: `DeFi/defi-data.json` (Jordan's AVAX/USDC LFJ position)

## Customization

### Colors
Edit `theme.colors` to match your chain/protocol branding:
- Avalanche: `--gold: #e8652a`, `--accent: #e84142`
- Ethereum: `--gold: #627eea`, `--accent: #627eea`
- Solana: `--gold: #9945ff`, `--accent: #14f195`
- Base: `--gold: #0052ff`, `--accent: #0052ff`

### Adding Sections
Add a new object to the `sections` array:
```json
{
  "id": "my-section",
  "title": "My Section",
  "icon": "🎯",
  "type": "stats",
  "dataSource": "myDataKey",
  "cardTemplate": {
    "fields": [
      { "key": "fieldName", "label": "Display Label", "format": "money" }
    ]
  }
}
```
Then add the matching data key to your `-data.json` file.
