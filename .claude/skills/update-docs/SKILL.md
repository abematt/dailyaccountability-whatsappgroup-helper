---
name: update-docs
description: Update CLAUDE.md and README.md to reflect recent code changes, architecture updates, or feature modifications. Use after implementing features, hiding/showing UI elements, or making architectural changes.
disable-model-invocation: false
user-invocable: true
argument-hint: [optional: what changed]
allowed-tools: Read, Edit
---

# Update Documentation Skill

Your task is to update project documentation to reflect recent changes made during this session.

## Primary Target: CLAUDE.md

**CLAUDE.md is the most important documentation file.** It contains comprehensive instructions for Claude Code about:
- Project architecture and data flow
- Component structure and responsibilities
- Feature status (enabled/disabled/hidden)
- Development commands and workflows
- Key patterns and conventions

**When to update CLAUDE.md:**
- Feature additions, removals, or temporary hiding
- UI/UX changes (layout, navigation, visual elements)
- Architecture or data flow changes
- New components or significant refactoring
- Changes to backend functions or queries
- Updates to development commands or workflows

**Important**: The file already states "When making changes to features, UI/UX, or architecture, always update this CLAUDE.md file to reflect those changes." Take this seriously.

## Secondary Target: README.md

Update README.md when changes affect:
- User-facing features or functionality
- Installation or setup instructions
- Usage examples or screenshots
- Project description or overview
- Dependencies or requirements

README.md is for human users, so focus on **user-facing** changes, not internal architecture.

## Instructions

1. **Review the conversation history** to understand what changed:
   - What features were added, removed, or hidden?
   - What components were modified?
   - What architecture or data flow changed?
   - Were any development workflows updated?

2. **Read the current CLAUDE.md** to understand its structure and find relevant sections

3. **Update CLAUDE.md** to reflect the changes:
   - Add notes about temporarily hidden features with restore instructions
   - Update component descriptions if behavior changed
   - Modify data flow sections if the flow changed
   - Add/update feature status indicators (enabled/disabled/hidden)
   - Use inline markdown notes like `*(currently hidden)*` or `*(UI temporarily hidden via comments)*`
   - Include file paths and line numbers for easy navigation
   - Keep the tone consistent with existing documentation

4. **Check if README.md needs updating**:
   - Read README.md to see current content
   - Only update if changes are user-facing
   - Keep changes minimal and focused

5. **Summarize what you updated** so the user knows what changed

## Style Guidelines

- Use clear, concise language
- Include specific file paths with markdown links: `[file.tsx](path/to/file.tsx)`
- Add line number references when helpful: `(lines ~428-437)`
- Use **bold** for emphasis on status indicators
- Use *italic* for inline notes about current state
- Use strikethrough (~~text~~) for features that are temporarily disabled
- Maintain existing formatting and structure

## Arguments

If arguments are provided: $ARGUMENTS

Use the arguments as hints about what specific changes to document. If no arguments are provided, review the entire conversation history to identify changes.
