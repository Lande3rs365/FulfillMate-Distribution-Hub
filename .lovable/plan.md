

## Plan: Smart Ping Dot with Visit Counter + Phase-Aware Reset

### How it works

**localStorage key**: `ai-agent-visits` — stores a JSON object `{ count: number, phase: string }`

**Three states:**
1. **Not visited yet** → animated ping dot (pulsing) for first 3-5 visits to the app (not the AI Agent page — visits to *any* page count as "exposures")
2. **After visiting `/ai-agent`** → static dot (no animation), subtle "new" marker
3. **New roadmap phase released** → reset the counter, animation returns until they visit again

**Phase tracking**: The current phase string (e.g. `"phase-1"`) is defined as a constant in the code. When a new phase launches, you update the constant → localStorage phase mismatches → counter resets → animation returns.

### Changes

**`src/components/AppSidebar.tsx`**

Add state logic inside `SidebarContent`:

```typescript
const CURRENT_PHASE = "phase-1"; // bump this when roadmap phase changes

const [agentDotState, setAgentDotState] = useState<'animate' | 'static' | 'hidden'>(() => {
  const stored = JSON.parse(localStorage.getItem('ai-agent-visits') || '{}');
  if (stored.phase !== CURRENT_PHASE) return 'animate'; // new phase, reset
  if (stored.visited) return 'static';                  // been to page
  if ((stored.exposures || 0) >= 5) return 'static';    // seen dot enough
  return 'animate';
});
```

- On each render (any page), increment `exposures` count (capped at 5). After 5 exposures without visiting, animation stops → static dot.
- On navigating to `/ai-agent`, set `visited: true` → static dot immediately.
- If `CURRENT_PHASE` doesn't match stored phase → reset everything, animation returns.

**Ping dot rendering** (replace current `{ping && (...)}` block):

```tsx
{ping && agentDotState !== 'hidden' && (
  <span className={cn("flex h-2 w-2", collapsed ? "absolute top-1.5 right-1.5" : "ml-auto")}>
    {agentDotState === 'animate' && (
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
    )}
    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
  </span>
)}
```

No other files need changes. The `CURRENT_PHASE` constant is the only thing to update when a new roadmap phase ships — the dot automatically re-animates for all users.

