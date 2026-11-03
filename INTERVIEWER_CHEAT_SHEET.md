# Interviewer Guide: Frontend PR Review Challenge (15 Minutes)

**Candidate:** Merin P Kurian (4+ years React / Frontend Developer)  
**PR Title:** `feat: Add priority filter, auto-refresh polling, and quick ticket status actions`  
**File to Review:** `src/components/QueueMonitor.tsx` (Diff is ~80 lines)

---

## ⏱️ 15-Minute Timeline Structure

| Time | Goal | Action |
|---|---|---|
| **0:00 – 2:00** | Context Setting | Explain the feature: *"A junior colleague added live polling, status filtering, and quick actions to the queue monitor. Imagine this is a real PR submitted to your team for review. Walk me through the diff as you read it."* |
| **2:00 – 11:00** | Candidate Reviews Diff | Let her read line-by-line and voice her thoughts. Note down what she catches without interrupting immediately. |
| **11:00 – 14:00** | Probing & Deep Dives | Probe on anything she missed or ask architectural follow-ups (see questions below). |
| **14:00 – 15:00** | Wrap-Up & Decision | Rate her score (Junior / Mid / Senior). |

---

## 🔍 The 5 Embedded Faults & Scoring Matrix

### 1. Direct State Mutation (React Immutability)
* **Code Location:** `handleStatusChange`
  ```tsx
  const updatedTickets = tickets;
  const target = updatedTickets.find((t) => t.id === ticketId);
  if (target) {
    target.status = newStatus;
  }
  setTickets(updatedTickets);
  ```
* **Why it matters:** `updatedTickets` holds the exact same memory reference as `tickets`. Mutating `target.status` mutates existing state directly. React may skip re-renders or produce stale renders elsewhere.
* **Expected Fix:** Immutably map over previous state:
  ```tsx
  setTickets((prev) =>
    prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
  );
  ```
* **Probing Question if missed:** *"Look at how `handleStatusChange` updates `tickets`. What happens if this component or a child component uses `React.memo`?"*

---

### 2. Memory Leak: Missing `useEffect` Cleanup
* **Code Location:** Auto-refresh `useEffect`
  ```tsx
  useEffect(() => {
    if (autoRefresh) {
      setInterval(() => {
        fetchQueueTickets().then((data) => {
          setTickets(data);
        });
      }, 5000);
      // Missing return () => clearInterval(...)
    }
  }, [autoRefresh]);
  ```
* **Why it matters:** Every time `autoRefresh` toggles on and off, or if the component unmounts, the old interval keeps running indefinitely. Toggling 5 times creates 5 active intervals hammering the API.
* **Expected Fix:** Return a cleanup function:
  ```tsx
  useEffect(() => {
    if (!autoRefresh) return;
    const intervalId = setInterval(() => {
      fetchQueueTickets().then(setTickets);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [autoRefresh]);
  ```
* **Probing Question if missed:** *"What happens if the user toggles the auto-refresh switch on, off, and on again? What happens if the user navigates away to another page?"*

---

### 3. Missing Error Handling & Double-Submit Bug
* **Code Location:** `handleStatusChange` & Action buttons
  ```tsx
  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    setIsUpdating(true);
    await updateTicketStatusApi(ticketId, newStatus); // No try/catch/finally
    ...
    setIsUpdating(false);
  };
  ```
  ```tsx
  <button className="btn btn-primary" onClick={() => handleStatusChange(ticket.id, 'IN_PROGRESS')}>
    {/* Missing disabled={isUpdating} */}
    Start Serving
  </button>
  ```
* **Why it matters:**
  1. If `updateTicketStatusApi` rejects (throws network error), `setIsUpdating(false)` is never reached. `isUpdating` remains `true` forever.
  2. The button lacks `disabled={isUpdating}` (or loading indicator), allowing users to spam-click and send duplicate API requests.
* **Expected Fix:** Wrap in `try ... finally` and disable the button:
  ```tsx
  try {
    setIsUpdating(true);
    await updateTicketStatusApi(ticketId, newStatus);
    ...
  } catch (err) {
    // Show toast or error banner
  } finally {
    setIsUpdating(false);
  }
  ```
* **Probing Question if missed:** *"What happens to the UI if the backend API returns a 500 or times out? Can the user click the button 5 times while the request is in flight?"*

---

### 4. Accessibility (a11y) Anti-Pattern
* **Code Location:** Clickable ticket row
  ```tsx
  <div 
    className="ticket-card"
    onClick={() => handleSelectTicket(ticket.id)}
  >
  ```
* **Why it matters:** A `<div>` is non-interactive by default. Keyboard-only users (who navigate with `Tab` and press `Enter`/`Space`) cannot focus or activate it. Screen readers cannot tell users it is clickable.
* **Expected Fix:** Use a semantic `<button>` or add `role="button"`, `tabIndex={0}`, and `onKeyDown`:
  ```tsx
  <div
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') handleSelectTicket(ticket.id);
    }}
    onClick={() => handleSelectTicket(ticket.id)}
  >
  ```
* **Probing Question if missed:** *"How would a user navigating with just a keyboard or screen reader interact with this card selection?"*

---

### 5. State Synchronization Anti-Pattern (Redundant Derived State)
* **Code Location:** `statusFilter` & `filteredTickets`
  ```tsx
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [filteredTickets, setFilteredTickets] = useState<QueueTicket[]>([]);

  useEffect(() => {
    if (statusFilter === 'ALL') {
      setFilteredTickets(tickets);
    } else {
      setFilteredTickets(tickets.filter(t => t.status === statusFilter));
    }
  }, [statusFilter, tickets]);
  ```
* **Why it matters:** Syncing state from props/other state via `useEffect` is an anti-pattern (causes an extra render cycle, potential state mismatch/tearing, and unnecessary code).
* **Expected Fix:** Derive during render with `useMemo` (or inline calculation):
  ```tsx
  const filteredTickets = useMemo(() => {
    if (statusFilter === 'ALL') return tickets;
    return tickets.filter((t) => t.status === statusFilter);
  }, [statusFilter, tickets]);
  ```
* **Probing Question if missed:** *"Do we really need `filteredTickets` in `useState` along with that `useEffect`? How would you simplify this?"*

---

## 🎯 Evaluation Scorecard

| Score | Observations | Verdict |
|---|---|---|
| **1 – 2 Faults** | Only caught the direct state mutation or missing button disabled. Missed cleanup, a11y, and redundant state. | **Junior / Weak Mid** (Needs heavy guidance) |
| **3 – 4 Faults** | Caught mutation, memory leak, and error handling. Explains *why* they break React behavior. | **Solid Mid-Level** (Standard 4-year expectation) |
| **All 5 Faults** | Immediately flags the memory leak, a11y div issue, and cleans up the redundant state without prompting. | **Senior / Strong Hire** (Production-ready standards) |
