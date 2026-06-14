/**
 * Gentech Dashboard Engine v1.0
 * Universal renderer for JSON-driven dashboards
 * 
 * Usage:
 *   const dash = new DashboardEngine({ templateUrl: 'template.json' });
 *   await dash.init();
 * 
 * Template = JSON config (meta, theme, sections, tabs, footer)
 * Data = JSON fetched from meta.dataUrl
 */

class DashboardEngine {
  constructor(config = {}) {
    this.config = config;
    this.template = null;
    this.data = null;
    this.rootEl = null;
    this.activeTab = null;
    this.intervals = [];
    this.listeners = [];
    this.state = {};
  }

  // ══════════════════════════════════════════════
  // LIFECYCLE
  // ══════════════════════════════════════════════

  async init(rootSelector = '#app') {
    this.rootEl = document.querySelector(rootSelector);
    if (!this.rootEl) throw new Error(`Root element not found: ${rootSelector}`);

    // Load template
    if (this.config.template) {
      this.template = this.config.template;
    } else if (this.config.templateUrl) {
      this.template = await this.fetchJSON(this.config.templateUrl);
    } else if (this.config.templateJson) {
      this.template = typeof this.config.templateJson === 'string' 
        ? JSON.parse(this.config.templateJson) 
        : this.config.templateJson;
    }

    // Apply theme
    this.applyTheme(this.template.theme);

    // Load data
    if (this.template.meta?.dataUrl) {
      this.data = await this.fetchJSON(this.template.meta.dataUrl);
    } else if (this.config.data) {
      this.data = this.config.data;
    }

    // Render
    this.renderShell();
    this.render();
    this.hideLoading();

    // Auto-refresh
    if (this.template.meta?.refreshMs) {
      this.startAutoRefresh(this.template.meta.refreshMs);
    }

    return this;
  }

  destroy() {
    this.intervals.forEach(id => clearInterval(id));
    this.listeners.forEach(({ el, event, fn }) => el.removeEventListener(event, fn));
    this.intervals = [];
    this.listeners = [];
  }

  // ══════════════════════════════════════════════
  // DATA
  // ══════════════════════════════════════════════

  async fetchJSON(url) {
    const bustUrl = url.includes('?') ? `${url}&_t=${Date.now()}` : `${url}?_t=${Date.now()}`;
    try {
      const res = await fetch(bustUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`DashboardEngine: Failed to fetch ${url}`, err);
      return null;
    }
  }

  async refreshData() {
    if (this.template.meta?.dataUrl) {
      this.data = await this.fetchJSON(this.template.meta.dataUrl);
      this.render();
    }
  }

  get(path, fallback = null) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.data) ?? fallback;
  }

  // ══════════════════════════════════════════════
  // THEME
  // ══════════════════════════════════════════════

  applyTheme(theme = {}) {
    if (!theme) return;
    const root = document.documentElement;

    // Colors
    if (theme.colors) {
      Object.entries(theme.colors).forEach(([key, val]) => {
        root.style.setProperty(key, val);
      });
    }

    // Mode
    if (theme.mode) {
      root.setAttribute('data-theme', theme.mode);
      if (theme.mode === 'light') {
        root.style.setProperty('--bg', theme.colors?.['--bg'] || '#faf7f2');
      }
    }

    // Fonts
    if (theme.fonts?.heading) {
      root.style.setProperty('--font-heading', theme.fonts.heading);
    }
    if (theme.fonts?.body) {
      root.style.setProperty('--font-body', theme.fonts.body);
    }

    // Container
    if (theme.container?.maxWidth) {
      root.style.setProperty('--max-width', theme.container.maxWidth);
    }
  }

  // ══════════════════════════════════════════════
  // SHELL RENDERING
  // ══════════════════════════════════════════════

  renderShell() {
    const meta = this.template.meta || {};
    const footer = this.template.footer || {};

    this.rootEl.innerHTML = `
      <div class="dashboard-container">
        <header class="dashboard-header">
          <h1>${meta.title || 'Dashboard'}</h1>
          ${meta.subtitle ? `<div class="subtitle">${meta.subtitle}</div>` : ''}
          ${meta.badge ? `<div class="badge">${meta.badge}</div>` : ''}
        </header>

        ${this.template.tabs ? this.renderTabBar() : ''}

        <main class="dashboard-main">
          <div class="loading" id="loading">
            <div class="spinner"></div>
            <div>Loading dashboard...</div>
          </div>
          <div id="dashboard-content" style="display:none;"></div>
        </main>

        <footer class="dashboard-footer">
          <div class="footer-brand">${footer.brand || meta.brand || ''}</div>
          ${footer.showTimestamp !== false ? `<div class="footer-timestamp" id="footer-timestamp"></div>` : ''}
          ${footer.version ? `<div class="footer-version">${footer.version}</div>` : ''}
        </footer>
      </div>

      <div class="modal-overlay" id="modal-overlay" style="display:none;">
        <div class="modal-content" id="modal-content"></div>
      </div>

      <div class="toast-container" id="toast-container"></div>
    `;
  }

  renderTabBar() {
    const tabs = this.template.tabs;
    return `
      <div class="tab-bar">
        ${tabs.map((tab, i) => `
          <button class="tab-btn ${i === 0 ? 'active' : ''}" data-tab="${tab.id}">
            ${tab.icon ? `<span class="tab-icon">${tab.icon}</span>` : ''}
            ${tab.label}
          </button>
        `).join('')}
      </div>
    `;
  }

  hideLoading() {
    const loading = document.getElementById('loading');
    const content = document.getElementById('dashboard-content');
    if (loading) loading.style.display = 'none';
    if (content) content.style.display = 'block';

    // Update timestamp
    const ts = document.getElementById('footer-timestamp');
    if (ts) ts.textContent = `Last updated: ${new Date().toLocaleString()}`;
  }

  // ══════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════

  render() {
    const content = document.getElementById('dashboard-content');
    if (!content) return;

    const sections = this.getVisibleSections();
    
    if (this.template.tabs) {
      // Render first tab's sections
      const activeTabId = this.activeTab || this.template.tabs[0]?.id;
      const activeTab = this.template.tabs.find(t => t.id === activeTabId);
      const tabSectionIds = activeTab?.sections || sections.map(s => s.id);
      const tabSections = sections.filter(s => tabSectionIds.includes(s.id));
      
      content.innerHTML = tabSections.map(s => this.renderSection(s)).join('');

      // Bind tab clicks
      this.rootEl.querySelectorAll('.tab-btn').forEach(btn => {
        this.on(btn, 'click', () => this.switchTab(btn.dataset.tab));
      });
    } else {
      content.innerHTML = sections.map(s => this.renderSection(s)).join('');
    }

    // Animate progress bars after render
    requestAnimationFrame(() => this.animateProgressBars());

    // Bind interactive elements
    this.bindChecklists();
    this.bindInteractives();
  }

  getVisibleSections() {
    return (this.template.sections || []).filter(s => s.visible !== false);
  }

  // ══════════════════════════════════════════════
  // SECTION RENDERERS
  // ══════════════════════════════════════════════

  renderSection(section) {
    const type = section.type || 'custom';
    const sectionHtml = this.renderSectionType(section, type);
    const anim = section.animation;

    let animClass = '';
    if (anim?.type === 'fade-in') animClass = `fade-in`;
    if (anim?.type === 'stagger') animClass = `stagger-children`;

    return `
      <section class="dashboard-section ${animClass}" id="section-${section.id}" 
        ${anim?.delay ? `style="animation-delay: ${anim.delay}s"` : ''}>
        ${section.title ? `
          <div class="section-header">
            ${section.icon ? `<span class="section-icon">${section.icon}</span>` : ''}
            <h2 class="section-title">${section.title}</h2>
          </div>
        ` : ''}
        ${sectionHtml}
      </section>
    `;
  }

  renderSectionType(section, type) {
    switch (type) {
      case 'stats':    return this.renderStats(section);
      case 'progress': return this.renderProgress(section);
      case 'grid':     return this.renderGrid(section);
      case 'cards':    return this.renderCards(section);
      case 'timeline': return this.renderTimeline(section);
      case 'checklist': return this.renderChecklist(section);
      case 'table':    return this.renderTable(section);
      case 'custom':   return this.renderCustom(section);
      default:         return this.renderCustom(section);
    }
  }

  // ── Stats ──
  renderStats(section) {
    const data = this.resolveDataSource(section.dataSource);
    if (!data) return '<p class="empty-state">No data</p>';

    const fields = section.cardTemplate?.fields || [];
    
    if (Array.isArray(data)) {
      return `<div class="stats-grid">${data.map(item => 
        fields.map(f => `
          <div class="stat-box ${f.className || ''}">
            ${f.label ? `<div class="stat-label">${f.label}</div>` : ''}
            <div class="stat-value">${this.formatField(item[f.key], f)}</div>
          </div>`
        ).join('')
      ).join('')}</div>`;
    }

    // Single object
    return `
      <div class="stats-grid">
        ${fields.map(f => `
          <div class="stat-box ${f.className || ''}">
            ${f.label ? `<div class="stat-label">${f.label}</div>` : ''}
            <div class="stat-value">${this.formatField(data[f.key], f)}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ── Progress Bars ──
  renderProgress(section) {
    const config = section.progressConfig || {};
    const items = config.items || [];
    const data = this.resolveDataSource(section.dataSource);

    return `
      <div class="progress-grid">
        ${items.map(item => {
          const value = data?.[item.valueKey] ?? item.value ?? 0;
          const max = data?.[item.maxKey] ?? item.max ?? 100;
          const pct = Math.round((value / max) * 100);
          return `
            <div class="progress-item">
              <div class="progress-header">
                <span class="progress-label">${item.label}</span>
                <span class="progress-value">${value}${item.suffix || ''}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill ${item.gradient ? 'gradient' : ''}" 
                  data-target="${pct}"
                  ${item.gradient ? `style="--progress-gradient: ${item.gradient}"` : 
                    item.color ? `style="--progress-color: var(--${item.color}, ${item.color})"` : ''}>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ── Grid ──
  renderGrid(section) {
    const items = this.resolveDataSource(section.dataSource);
    if (!items || !items.length) return '<p class="empty-state">No items</p>';

    const layout = section.layout || {};
    const fields = section.cardTemplate?.fields || [];
    const className = section.cardTemplate?.className || 'card';

    return `
      <div class="grid-container" style="${layout.gridMinWidth ? `grid-template-columns: repeat(auto-fill, minmax(${layout.gridMinWidth}, 1fr))` : ''}">
        ${items.map(item => `
          <div class="${className}">
            ${fields.map(f => `
              <div class="${f.className || ''}">${this.formatField(item[f.key], f)}</div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    `;
  }

  // ── Cards (horizontal scroll) ──
  renderCards(section) {
    const items = this.resolveDataSource(section.dataSource);
    if (!items || !items.length) return '<p class="empty-state">No items</p>';

    const layout = section.layout || {};
    const fields = section.cardTemplate?.fields || [];
    const className = section.cardTemplate?.className || 'card';

    const scrollStyle = layout.scrollX ? 'overflow-x: auto; white-space: nowrap; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;' : '';

    return `
      <div class="cards-container" style="${scrollStyle}">
        ${items.map(item => `
          <div class="${className}" style="${layout.scrollX ? 'display: inline-block; vertical-align: top; scroll-snap-align: start; white-space: normal;' : ''}">
            ${fields.map(f => `
              <div class="${f.className || ''}">${this.formatField(item[f.key], f)}</div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    `;
  }

  // ── Timeline ──
  renderTimeline(section) {
    const items = this.resolveDataSource(section.dataSource);
    if (!items || !items.length) return '<p class="empty-state">No timeline data</p>';

    const config = section.timelineConfig || {};
    const dateKey = config.dateKey || 'date';
    const titleKey = config.titleKey || 'title';
    const typeKey = config.typeKey || 'type';
    const today = new Date().toISOString().split('T')[0];

    return `
      <div class="timeline">
        ${items.map(item => {
          const date = item[dateKey];
          const isToday = config.todayMarker && date === today;
          const isPast = date && date < today;
          return `
            <div class="timeline-item ${isToday ? 'today' : ''} ${isPast ? 'past' : ''}">
              <div class="timeline-date">${this.formatDate(date)}</div>
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-title">${item[titleKey] || ''}</div>
                ${item.description ? `<div class="timeline-desc">${item.description}</div>` : ''}
                ${item[typeKey] ? `<span class="timeline-type badge">${item[typeKey]}</span>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ── Checklist ──
  renderChecklist(section) {
    const items = this.resolveDataSource(section.dataSource);
    if (!items || !items.length) return '<p class="empty-state">No items</p>';

    const config = section.checklistConfig || {};
    const storageKey = config.storageKey || `checklist-${section.id}`;
    const savedState = this.loadState(storageKey);
    const groupBy = config.groupBy;

    // Load saved states
    const processedItems = items.map((item, i) => {
      const id = item.id || item.text || `item-${i}`;
      const checked = savedState[id] ?? item.checked ?? false;
      return { ...item, _id: id, _checked: checked };
    });

    const checkedCount = processedItems.filter(i => i._checked).length;
    const totalCount = processedItems.length;
    const pct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

    // Group items
    let html = '';
    if (groupBy) {
      const groups = {};
      processedItems.forEach(item => {
        const key = item[groupBy] || 'Other';
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });

      html = Object.entries(groups).map(([group, groupItems]) => `
        <div class="checklist-group">
          <h4 class="checklist-group-title">${group}</h4>
          ${groupItems.map(item => this.renderChecklistItem(item, storageKey)).join('')}
        </div>
      `).join('');
    } else {
      html = processedItems.map(item => this.renderChecklistItem(item, storageKey)).join('');
    }

    return `
      <div class="checklist-container" data-storage-key="${storageKey}">
        ${config.showProgress !== false ? `
          <div class="checklist-progress">
            <div class="progress-bar">
              <div class="progress-fill" data-target="${pct}"></div>
            </div>
            <span class="progress-text">${checkedCount}/${totalCount} (${pct}%)</span>
          </div>
        ` : ''}
        <div class="checklist-items">${html}</div>
      </div>
    `;
  }

  renderChecklistItem(item, storageKey) {
    const id = item._id;
    const checked = item._checked;
    return `
      <label class="checklist-item ${checked ? 'checked' : ''}" data-id="${id}">
        <input type="checkbox" ${checked ? 'checked' : ''} 
          onchange="window._dashboardEngine.toggleChecklistItem('${storageKey}', '${id}', this.checked)">
        <span class="checkmark"></span>
        <span class="item-text">${item.text || item.name || item.label || id}</span>
        ${item.note ? `<span class="item-note">${item.note}</span>` : ''}
      </label>
    `;
  }

  // ── Table ──
  renderTable(section) {
    const items = this.resolveDataSource(section.dataSource);
    if (!items || !items.length) return '<p class="empty-state">No data</p>';

    const fields = section.cardTemplate?.fields || [];
    
    return `
      <div class="table-container">
        <table class="dashboard-table">
          <thead>
            <tr>${fields.map(f => `<th>${f.label || f.key}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>${fields.map(f => `<td>${this.formatField(item[f.key], f)}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ── Custom ──
  renderCustom(section) {
    if (section.render && typeof section.render === 'function') {
      return section.render(this.data, this);
    }
    if (section.html) return section.html;
    return '<p class="empty-state">Custom section</p>';
  }

  // ══════════════════════════════════════════════
  // TABS
  // ══════════════════════════════════════════════

  switchTab(tabId) {
    this.activeTab = tabId;

    // Update buttons
    this.rootEl.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Re-render content
    this.render();
  }

  // ══════════════════════════════════════════════
  // PROGRESS BARS
  // ══════════════════════════════════════════════

  animateProgressBars() {
    this.rootEl.querySelectorAll('.progress-fill[data-target]').forEach(bar => {
      const target = parseInt(bar.dataset.target) || 0;
      setTimeout(() => {
        bar.style.width = `${target}%`;
      }, 100);
    });
  }

  // ══════════════════════════════════════════════
  // CHECKLISTS (interactive)
  // ══════════════════════════════════════════════

  bindChecklists() {
    // Already bound via inline onchange
    window._dashboardEngine = this;
  }

  bindInteractives() {
    // Modal close on overlay click
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
      this.on(overlay, 'click', (e) => {
        if (e.target === overlay) this.closeModal();
      });
    }

    // Escape key closes modal
    this.on(document, 'keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });
  }

  toggleChecklistItem(storageKey, itemId, checked) {
    const state = this.loadState(storageKey);
    state[itemId] = checked;
    this.saveState(storageKey, state);

    // Update visual
    const container = this.rootEl.querySelector(`[data-storage-key="${storageKey}"]`);
    if (container) {
      const item = container.querySelector(`[data-id="${itemId}"]`);
      if (item) item.classList.toggle('checked', checked);

      // Update progress
      const items = container.querySelectorAll('.checklist-item');
      const checkedCount = container.querySelectorAll('.checklist-item.checked').length;
      const pct = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;
      
      const progressFill = container.querySelector('.progress-fill');
      if (progressFill) {
        progressFill.style.width = `${pct}%`;
        progressFill.dataset.target = pct;
      }
      const progressText = container.querySelector('.progress-text');
      if (progressText) {
        progressText.textContent = `${checkedCount}/${items.length} (${pct}%)`;
      }
    }
  }

  // ══════════════════════════════════════════════
  // MODALS
  // ══════════════════════════════════════════════

  openModal(html) {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    if (overlay && content) {
      content.innerHTML = html;
      overlay.style.display = 'flex';
    }
  }

  closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  // ══════════════════════════════════════════════
  // TOAST NOTIFICATIONS
  // ══════════════════════════════════════════════

  showToast(message, duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ══════════════════════════════════════════════
  // STATE (localStorage)
  // ══════════════════════════════════════════════

  loadState(key) {
    try {
      return JSON.parse(localStorage.getItem(`dashboard-${key}`)) || {};
    } catch { return {}; }
  }

  saveState(key, value) {
    localStorage.setItem(`dashboard-${key}`, JSON.stringify(value));
  }

  // ══════════════════════════════════════════════
  // UTILITIES
  // ══════════════════════════════════════════════

  resolveDataSource(path) {
    if (!path) return this.data;
    return path.split('.').reduce((obj, key) => obj?.[key], this.data);
  }

  formatField(value, field = {}) {
    if (value === null || value === undefined) return '—';
    const format = field.format || 'text';
    
    switch (format) {
      case 'money':
        return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      case 'percent':
        return `${value}%`;
      case 'date':
        return this.formatDate(value);
      case 'badge':
        return `<span class="badge">${value}</span>`;
      case 'tags':
        return Array.isArray(value) ? value.map(t => `<span class="tag">${t}</span>`).join(' ') : value;
      case 'text':
      default:
        return String(value);
    }
  }

  formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  }

  on(el, event, fn) {
    el.addEventListener(event, fn);
    this.listeners.push({ el, event, fn });
  }

  startAutoRefresh(ms) {
    const id = setInterval(() => this.refreshData(), ms);
    this.intervals.push(id);
  }
}

// ══════════════════════════════════════════════
// BASE CSS (injected if not already present)
// ══════════════════════════════════════════════

if (!document.getElementById('dashboard-engine-css')) {
  const style = document.createElement('style');
  style.id = 'dashboard-engine-css';
  style.textContent = `
    /* ── Dashboard Engine Base CSS ── */
    :root {
      --bg: #0a0a0f;
      --panel-bg: #12121a;
      --panel-border: #1e1e2e;
      --panel-shadow: rgba(0,0,0,0.3);
      --text: #d4d4d4;
      --text-dim: #6b6b7b;
      --gold: #c9a84c;
      --gold-dim: #8b6914;
      --accent: #7eb8ff;
      --danger: #ff4444;
      --success: #44ff88;
      --radius: 12px;
      --gap: 15px;
      --font-heading: 'Cinzel', serif;
      --font-body: 'Crimson Text', serif;
      --max-width: 1200px;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-body);
      min-height: 100vh;
      overflow-x: hidden;
      line-height: 1.6;
    }

    .dashboard-container {
      max-width: var(--max-width);
      margin: 0 auto;
      padding: 20px;
      position: relative;
      z-index: 1;
    }

    /* ── Header ── */
    .dashboard-header {
      text-align: center;
      padding: 30px 0;
      border-bottom: 1px solid var(--panel-border);
      margin-bottom: 20px;
    }

    .dashboard-header h1 {
      font-family: var(--font-heading);
      font-size: 2.5em;
      font-weight: 900;
      color: var(--gold);
      text-shadow: 0 0 30px rgba(201, 168, 76, 0.3);
      letter-spacing: 3px;
    }

    .dashboard-header .subtitle {
      color: var(--text-dim);
      font-size: 1.1em;
      margin-top: 8px;
      font-style: italic;
    }

    .dashboard-header .badge {
      display: inline-block;
      background: rgba(126, 184, 255, 0.1);
      border: 1px solid rgba(126, 184, 255, 0.3);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85em;
      color: var(--accent);
      margin-top: 10px;
    }

    /* ── Tab Bar ── */
    .tab-bar {
      display: flex;
      gap: 4px;
      margin-bottom: 25px;
      padding: 4px;
      background: rgba(255,255,255,0.04);
      border-radius: 10px;
      overflow-x: auto;
    }

    .tab-btn {
      flex: 1;
      padding: 12px 20px;
      border: 1px solid var(--panel-border);
      border-radius: 8px;
      background: transparent;
      color: var(--text-dim);
      font-family: var(--font-heading);
      font-size: 0.85em;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .tab-btn:hover {
      border-color: var(--gold-dim);
      color: var(--gold);
    }

    .tab-btn.active {
      background: rgba(201, 168, 76, 0.12);
      border-color: var(--gold);
      color: var(--gold);
      box-shadow: 0 0 12px rgba(201, 168, 76, 0.2);
    }

    /* ── Sections ── */
    .dashboard-section {
      margin-bottom: 30px;
      animation: fadeIn 0.4s ease-out;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--panel-border);
    }

    .section-icon { font-size: 1.3em; }

    .section-title {
      font-family: var(--font-heading);
      font-size: 1.3em;
      color: var(--gold);
      letter-spacing: 1px;
    }

    /* ── Stat Boxes ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: var(--gap);
    }

    .stat-box {
      background: var(--panel-bg);
      border: 1px solid var(--panel-border);
      border-radius: var(--radius);
      padding: 15px;
      text-align: center;
      transition: border-color 0.2s;
    }

    .stat-box:hover {
      border-color: var(--gold-dim);
    }

    .stat-label {
      color: var(--text-dim);
      font-size: 0.8em;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 5px;
    }

    .stat-value {
      font-size: 1.4em;
      font-weight: 700;
      color: var(--gold);
    }

    /* ── Progress Bars ── */
    .progress-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .progress-item {
      background: var(--panel-bg);
      border: 1px solid var(--panel-border);
      border-radius: var(--radius);
      padding: 12px 16px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .progress-label { color: var(--text); font-size: 0.9em; }
    .progress-value { color: var(--gold); font-weight: 600; font-size: 0.9em; }

    .progress-bar {
      height: 8px;
      background: rgba(255,255,255,0.05);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      width: 0%;
      background: var(--gold);
      border-radius: 4px;
      transition: width 1s ease-out;
    }

    .progress-fill.gradient {
      background: var(--progress-gradient, linear-gradient(90deg, var(--gold), var(--accent)));
    }

    /* ── Grid ── */
    .grid-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--gap);
    }

    .card, .skill-card, .info-card {
      background: var(--panel-bg);
      border: 1px solid var(--panel-border);
      border-radius: var(--radius);
      padding: 16px;
      transition: border-color 0.2s, transform 0.2s;
    }

    .card:hover, .skill-card:hover, .info-card:hover {
      border-color: var(--gold-dim);
      transform: translateY(-2px);
    }

    /* ── Cards (scroll) ── */
    .cards-container {
      display: flex;
      gap: var(--gap);
    }

    .cards-container > * {
      min-width: 200px;
      flex-shrink: 0;
    }

    /* ── Timeline ── */
    .timeline {
      position: relative;
      padding-left: 30px;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 12px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--panel-border);
    }

    .timeline-item {
      position: relative;
      margin-bottom: 20px;
      padding: 12px 16px;
      background: var(--panel-bg);
      border: 1px solid var(--panel-border);
      border-radius: var(--radius);
      transition: border-color 0.2s;
    }

    .timeline-item.today {
      border-color: var(--gold);
      box-shadow: 0 0 15px rgba(201, 168, 76, 0.15);
    }

    .timeline-item.past { opacity: 0.6; }

    .timeline-dot {
      position: absolute;
      left: -24px;
      top: 16px;
      width: 10px;
      height: 10px;
      background: var(--panel-border);
      border-radius: 50%;
      border: 2px solid var(--bg);
    }

    .timeline-item.today .timeline-dot { background: var(--gold); }

    .timeline-date {
      font-size: 0.8em;
      color: var(--text-dim);
      margin-bottom: 4px;
    }

    .timeline-title { font-weight: 600; color: var(--text); }
    .timeline-desc { color: var(--text-dim); font-size: 0.9em; margin-top: 4px; }

    /* ── Checklist ── */
    .checklist-container {
      background: var(--panel-bg);
      border: 1px solid var(--panel-border);
      border-radius: var(--radius);
      padding: 16px;
    }

    .checklist-progress {
      margin-bottom: 15px;
    }

    .progress-text {
      color: var(--text-dim);
      font-size: 0.85em;
      margin-top: 5px;
      display: block;
    }

    .checklist-group { margin-bottom: 15px; }
    .checklist-group-title {
      color: var(--gold);
      font-family: var(--font-heading);
      font-size: 1em;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid var(--panel-border);
    }

    .checklist-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .checklist-item.checked { opacity: 0.5; }
    .checklist-item.checked .item-text { text-decoration: line-through; }

    .checklist-item input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: var(--gold);
      cursor: pointer;
    }

    .item-text { flex: 1; color: var(--text); }
    .item-note { color: var(--text-dim); font-size: 0.85em; }

    /* ── Table ── */
    .table-container { overflow-x: auto; }

    .dashboard-table {
      width: 100%;
      border-collapse: collapse;
      background: var(--panel-bg);
      border: 1px solid var(--panel-border);
      border-radius: var(--radius);
      overflow: hidden;
    }

    .dashboard-table th {
      background: rgba(255,255,255,0.03);
      padding: 12px 16px;
      text-align: left;
      font-family: var(--font-heading);
      font-size: 0.85em;
      color: var(--gold);
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 1px solid var(--panel-border);
    }

    .dashboard-table td {
      padding: 10px 16px;
      border-bottom: 1px solid var(--panel-border);
      color: var(--text);
    }

    .dashboard-table tr:last-child td { border-bottom: none; }
    .dashboard-table tr:hover td { background: rgba(255,255,255,0.02); }

    /* ── Footer ── */
    .dashboard-footer {
      text-align: center;
      padding: 20px 0;
      border-top: 1px solid var(--panel-border);
      margin-top: 30px;
    }

    .footer-brand {
      font-family: var(--font-heading);
      font-size: 0.9em;
      color: var(--gold);
      letter-spacing: 3px;
    }

    .footer-timestamp {
      color: var(--text-dim);
      font-size: 0.75em;
      margin-top: 5px;
    }

    .footer-version {
      color: var(--text-dim);
      font-size: 0.75em;
      margin-top: 3px;
    }

    /* ── Badges & Tags ── */
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.8em;
      background: rgba(201, 168, 76, 0.15);
      color: var(--gold);
      border: 1px solid rgba(201, 168, 76, 0.3);
    }

    .tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 8px;
      font-size: 0.75em;
      background: rgba(126, 184, 255, 0.1);
      color: var(--accent);
      margin: 2px;
    }

    /* ── Loading ── */
    .loading {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-dim);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--panel-border);
      border-top-color: var(--gold);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px;
    }

    /* ── Modal ── */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-content {
      background: var(--panel-bg);
      border: 1px solid var(--panel-border);
      border-radius: var(--radius);
      padding: 25px;
      max-width: 600px;
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
    }

    /* ── Toast ── */
    .toast-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1001;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .toast {
      padding: 12px 20px;
      background: var(--panel-bg);
      border: 1px solid var(--gold);
      border-radius: 8px;
      color: var(--gold);
      font-size: 0.9em;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.3s;
    }

    .toast.show {
      opacity: 1;
      transform: translateY(0);
    }

    /* ── Empty State ── */
    .empty-state {
      text-align: center;
      color: var(--text-dim);
      padding: 30px;
      font-style: italic;
    }

    /* ── Animations ── */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .fade-in { animation: fadeIn 0.5s ease-out both; }
    .stagger-children > * { animation: fadeIn 0.4s ease-out both; }
    .stagger-children > *:nth-child(1) { animation-delay: 0.05s; }
    .stagger-children > *:nth-child(2) { animation-delay: 0.1s; }
    .stagger-children > *:nth-child(3) { animation-delay: 0.15s; }
    .stagger-children > *:nth-child(4) { animation-delay: 0.2s; }
    .stagger-children > *:nth-child(5) { animation-delay: 0.25s; }
    .stagger-children > *:nth-child(6) { animation-delay: 0.3s; }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .dashboard-header h1 { font-size: 1.8em; letter-spacing: 1px; }
      .tab-btn { padding: 10px 14px; font-size: 0.8em; }
      .stats-grid { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
      .grid-container { grid-template-columns: 1fr; }
    }

    @media (max-width: 480px) {
      .dashboard-container { padding: 10px; }
      .dashboard-header h1 { font-size: 1.4em; }
      .section-title { font-size: 1.1em; }
    }
  `;
  document.head.appendChild(style);
}

// Export for module use
if (typeof module !== 'undefined') module.exports = DashboardEngine;
