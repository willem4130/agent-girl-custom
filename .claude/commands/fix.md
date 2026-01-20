---
name: fix
description: Run typechecking, linting, and formatting, then spawn parallel agents to fix all issues
---

# Project Code Quality Check

This command runs all code quality tools for this Next.js project, collects errors, groups them by domain, and spawns parallel agents to fix them.

## Step 1: Run Linting, Typechecking, and Formatting

Run the appropriate commands for this Next.js TypeScript project:

```bash
npm run typecheck
npm run lint
npm run format:check
```

## Step 2: Collect and Parse Errors

Parse the output from the linting, typechecking, and formatting commands. Group errors by domain:

- **Type errors**: Issues from TypeScript (`tsc --noEmit`)
  - Parse output for file paths and error messages
  - Example: `src/components/Hero.tsx(45,12): error TS2322: Type 'string' is not assignable to type 'number'.`

- **Lint errors**: Issues from ESLint (`eslint .`)
  - Parse output for file paths, line numbers, and rule violations
  - Example: `src/app/page.tsx:12:3 error 'useState' is defined but never used @typescript-eslint/no-unused-vars`

- **Format errors**: Issues from Prettier
  - Parse output for files that don't match formatting rules
  - Example: `src/lib/utils.ts` needs formatting

Create a structured list:

```
Type Errors (X files):
- src/components/Hero.tsx: 3 errors
- src/app/page.tsx: 1 error

Lint Errors (Y files):
- src/components/Button.tsx: 2 warnings
- src/lib/api.ts: 1 error

Format Errors (Z files):
- src/utils/helpers.ts
- src/components/Card.tsx
```

## Step 3: Spawn Parallel Agents

**CRITICAL**: Use a SINGLE response with MULTIPLE Task tool calls to run agents in parallel.

For each domain that has issues, spawn an agent in parallel:

### If Type Errors Exist:

```
Task tool: subagent_type="general-purpose"
Prompt: "Fix all TypeScript type errors in the following files: [list].
Specific errors to fix: [paste all type errors].
After fixing, run 'npm run typecheck' to verify all errors are resolved."
```

### If Lint Errors Exist:

```
Task tool: subagent_type="general-purpose"
Prompt: "Fix all ESLint errors in the following files: [list].
Specific errors to fix: [paste all lint errors].
Use 'npx eslint --fix .' first for auto-fixable issues, then manually fix remaining.
After fixing, run 'npm run lint' to verify all errors are resolved."
```

### If Format Errors Exist:

```
Task tool: subagent_type="general-purpose"
Prompt: "Fix all Prettier formatting issues in the following files: [list].
Run 'npm run format' to auto-format all files.
After fixing, run 'npm run format:check' to verify all files are formatted correctly."
```

**Example of parallel agent spawning:**

```
In a SINGLE message, call:
- Task tool for type errors
- Task tool for lint errors
- Task tool for format errors
```

## Step 4: Verify All Fixes

After all agents complete, run the full check again to ensure all issues are resolved:

```bash
npm run typecheck && npm run lint && npm run format:check
```

If any errors remain, report them to the user with specific file paths and error messages.
