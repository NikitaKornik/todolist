# Todolist UI Code Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the existing todo app UI while preserving and strengthening the reduced-rerender architecture.

**Architecture:** Keep the current React Context + SCSS Modules structure. Make state transitions safer in `ToDoProvider`, keep list item props stable from `ToDoContainer`, and polish the existing single-screen interface without adding new routes or large abstractions.

**Tech Stack:** React 19, CRA/react-scripts, SCSS Modules, Framer Motion, React Testing Library.

---

### Task 1: Behavior Tests

**Files:**
- Modify: `src/App.test.js`

- [ ] **Step 1: Replace the CRA placeholder test with behavior tests**

Add tests that cover:
- initial empty state
- adding a task
- entering edit mode and canceling back to the previous draft
- delete confirmation flow

- [ ] **Step 2: Run tests to verify red**

Run: `CI=true npm test -- --watchAll=false`
Expected: at least one new test fails because current behavior or accessible labels are incomplete.

### Task 2: State And Rerender Cleanup

**Files:**
- Modify: `src/context/ToDoProvider/ToDoProvider.jsx`
- Modify: `src/components/ToDoContainer/ToDoContainer.jsx`
- Modify: `src/components/ToDoInput/ToDoInput.jsx`
- Modify: `src/components/Header/Header.jsx`
- Modify: `src/components/UIkit/Btn/Btn.jsx`

- [ ] **Step 1: Stabilize provider values and callbacks**

Use dependency arrays for all memoized values, create task dates inside `addItem`, remove debug logs, and keep popup payloads consistent.

- [ ] **Step 2: Stabilize list item event handlers**

Pass item ids/text into handlers instead of creating handlers around whole item objects where possible.

- [ ] **Step 3: Improve accessibility hooks**

Add button labels and textarea label so tests and keyboard users can identify controls.

### Task 3: Visual Polish

**Files:**
- Modify: `src/App.module.scss`
- Modify: `src/index.css`
- Modify: `src/components/ToDoContainer/ToDoContainer.module.scss`
- Modify: `src/components/ToDoElement/ToDoElement.module.scss`
- Modify: `src/components/ToDoInput/ToDoInput.module.scss`
- Modify: `src/components/Header/Header.module.scss`
- Modify: `src/components/UIkit/Btn/Btn.module.scss`
- Modify: `src/components/UIkit/DropDownMenu/DropDownMenu.module.scss`
- Modify: `src/components/PopupMenu/PopupMenu.module.scss`

- [ ] **Step 1: Polish shell layout**

Make the page centered, responsive, and less flat while preserving theme variables.

- [ ] **Step 2: Polish cards and input**

Improve spacing, borders, action placement, markdown content, checked/favorite states, and mobile behavior.

- [ ] **Step 3: Polish header, dropdown, popup, buttons**

Make controls more consistent, accessible, and visually quieter.

### Task 4: Verification

**Files:**
- No source files expected beyond previous tasks.

- [ ] **Step 1: Run tests**

Run: `CI=true npm test -- --watchAll=false`
Expected: all tests pass.

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: production build exits with code 0.

- [ ] **Step 3: Run app and inspect**

Run: `npm start`, open the local app, and verify the main task flow and layout visually.
