# Playground UI Enhancement: Data View

## Current Layout

```
┌─────────────────┬─────────────────┐
│                 │                 │
│                 │     Output      │
│     Editor      │   (Console)     │
│                 │                 │
│                 │                 │
└─────────────────┴─────────────────┘
```

## Proposed Layout with Data Tab

```
┌─────────────────┬─────────────────┐
│                 │ [Output] [Data] │ ← New tabs
│                 ├─────────────────┤
│     Editor      │                 │
│                 │   Active View   │
│                 │                 │
│                 │                 │
└─────────────────┴─────────────────┘
```

## Output Tab (Current)

Shows console output from code execution:

```
┌────────────────────────────────┐
│ Output                    Data │
├────────────────────────────────┤
│ Testing fetch API...           │
│                                │
│ ✓ Fetch successful: pikachu    │
│   - height: 4                  │
│                                │
│ Testing domain whitelist...    │
│ ✓ Whitelist working            │
│                                │
└────────────────────────────────┘
```

## Data Tab (New)

Shows KV store state in table format:

```
┌────────────────────────────────┐
│ Output                    Data │
├────────────────────────────────┤
│ Key              Value    Size │
├────────────────────────────────┤
│ counter          42       9B   │
│ lastUpdate       2025-..  20B  │
│ user:alice       1000     10B  │
├────────────────────────────────┤
│ Storage: 39 / 102,400 bytes    │
│ ████░░░░░░░░░░░░ 0.04%         │
│                                │
│ [Clear Data] [Export JSON]     │
└────────────────────────────────┘
```

## Features

### Real-time Updates
- Data view refreshes after each execution
- Shows staged changes (pending commit) vs committed data
- Visual diff indicator for changed values

### Storage Visualization
- Progress bar showing total storage used
- Per-key size breakdown
- Warning when approaching limits

### Interactive Actions
- **Clear Data** - Wipe all localStorage
- **Export JSON** - Download current state
- **Import JSON** - Restore saved state
- **Filter** - Search by key pattern

## Implementation Notes

```svelte
<!-- playground/src/components/Editor.svelte -->
<script>
  let activeTab = 'output'; // 'output' | 'data'
  let dataEntries = [];
  let totalSize = 0;

  // Listen for data updates from sandbox
  window.addEventListener('message', (event) => {
    if (event.data.type === 'dataUpdate') {
      dataEntries = event.data.entries;
      totalSize = event.data.totalSize;
    }
  });

  function switchTab(tab) {
    activeTab = tab;
    if (tab === 'data') {
      // Request fresh data from sandbox
      sandboxIframe.contentWindow.postMessage({
        type: 'getDataSnapshot'
      }, '*');
    }
  }
</script>

<div class="output-panel">
  <div class="tabs">
    <button
      class:active={activeTab === 'output'}
      on:click={() => switchTab('output')}
    >
      Output
    </button>
    <button
      class:active={activeTab === 'data'}
      on:click={() => switchTab('data')}
    >
      Data
      {#if dataEntries.length > 0}
        <span class="badge">{dataEntries.length}</span>
      {/if}
    </button>
  </div>

  {#if activeTab === 'output'}
    <iframe src="/sandbox" bind:this={sandboxIframe} />
  {:else}
    <div class="data-view">
      <!-- Data table implementation -->
    </div>
  {/if}
</div>

<style>
  .tabs {
    display: flex;
    gap: 4px;
    padding: 8px;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
  }

  .tabs button {
    padding: 6px 12px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 4px;
  }

  .tabs button.active {
    background: #fffbe8;
    font-weight: 600;
  }

  .badge {
    background: #dc2626;
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    margin-left: 4px;
  }

  .data-view {
    padding: 16px;
    overflow-y: auto;
    font-family: 'Menlo', monospace;
    font-size: 12px;
  }
</style>
```

## Future Enhancements

1. **Graph View** - Visualize relationships between keys
2. **Time Travel** - Replay state changes
3. **Compare** - Diff two contract states
4. **Analytics** - Track most accessed keys, write patterns
5. **Schema Validation** - Define expected data structure
