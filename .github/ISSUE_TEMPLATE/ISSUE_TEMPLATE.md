# Issue Creation Guide

This document outlines the important elements required when creating a new issue for the demo-react-taskmanager project.

## ⚠️ MANDATORY REQUIREMENTS FOR ALL ISSUES

**EVERY issue MUST include ALL of the following:**

### 1. Title

- **Field**: `title`
- **Required**: ✅ YES - MANDATORY
- **Description**: A clear, concise summary of the issue
- **Example**: "Prepare application structure"

### 2. Description

- **Field**: `body`
- **Required**: ✅ YES - MANDATORY
- **Description**: Detailed explanation of the issue, including:
  - Context and background
  - Specific requirements or tasks
  - Acceptance criteria
  - Any relevant links or references

### 3. Type **[DO NOT SKIP]**

- **Field**: `type`
- **Required**: ✅ YES - MANDATORY ⚠️
- **Options** (choose ONE):
  - `Task`: A specific piece of work to be completed
  - `Bug`: An unexpected problem or behavior
  - `Feature`: A new feature request or idea
- **Action Required**: AI assistants MUST set this field when creating issues

### 4. Labels **[DO NOT SKIP]**

- **Field**: `labels`
- **Required**: ✅ YES - At least ONE label is MANDATORY ⚠️
- **Available Labels**:
  - `bug`: Something isn't working
  - `documentation`: Improvements or additions to documentation
  - `duplicate`: This issue or pull request already exists
  - `enhancement`: New feature or request
  - `good first issue`: Good for newcomers
  - `help wanted`: Extra attention is needed
- **Action Required**: AI assistants MUST apply at least one label when creating issues

## Project Link

All issues should be linked to the project: https://github.com/orgs/MaquestiauxLabs/projects/6

## 🤖 CRITICAL INSTRUCTIONS FOR AI/AUTOMATED ISSUE CREATION

When creating issues programmatically, you MUST:

1. ✅ **Always set the `type` parameter** to one of: `Task`, `Bug`, or `Feature`
   - Do NOT create issues without a type
   - Choose the type that best matches the issue's purpose

2. ✅ **Always set at least ONE `labels` parameter** from the available labels list
   - Do NOT create issues without labels
   - Use `enhancement` by default if unsure
   - Multiple labels can be applied if appropriate

3. ✅ **Include complete description** with all sections:
   - Context/Background
   - Requirements
   - Acceptance Criteria
   - Additional Notes (if applicable)

4. ✅ **Reference the project** in the issue description:
   - Include link: `**Project**: https://github.com/orgs/MaquestiauxLabs/projects/6`

**Failure to follow these instructions is a violation of project standards.**

## Issue Template Example

```markdown
**Title**: [Brief, descriptive title of the issue]

**Type**: [Task | Bug | Feature]

**Labels**: [label1], [label2]

**Description**:
[Provide a clear and detailed description of the issue]

## Context

[Explain the background or reason for this issue]

## Requirements

- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

## Acceptance Criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

## Additional Notes

[Any additional information, links, or references]

**Project**: https://github.com/orgs/MaquestiauxLabs/projects/6
```

## Best Practices

1. **Be Specific**: Use clear, descriptive titles that explain what the issue is about
2. **Add Context**: Include relevant background information in the description
3. **Use Checklists**: Break down complex tasks into actionable items using `- [ ]` syntax
4. **Label Appropriately**: Choose labels that accurately categorize the issue
5. **Link to Project**: Always reference the project board for tracking
6. **Set Correct Type**: Ensure the issue type matches its purpose (Task/Bug/Feature)

## 📋 MCP Tool Commands for Issue Creation

### Using `mcp_io_github_git_issue_write` Tool

#### Required Parameters

```json
{
  "method": "create",
  "owner": "MaquestiauxLabs",
  "repo": "demo-react-taskmanager",
  "title": "Your issue title here",
  "body": "Your issue description with context, requirements, and acceptance criteria",
  "type": "Task",
  "labels": ["enhancement"]
}
```

#### Example 1: Create a Task with Enhancement Label

```json
{
  "method": "create",
  "owner": "MaquestiauxLabs",
  "repo": "demo-react-taskmanager",
  "title": "Set up project documentation",
  "body": "Set up comprehensive documentation for the project...\n\n## Context\n...\n\n## Requirements\n- ...\n\n## Acceptance Criteria\n- [ ] ...",
  "type": "Task",
  "labels": ["enhancement", "documentation"]
}
```

#### Example 2: Create a Bug Report

```json
{
  "method": "create",
  "owner": "MaquestiauxLabs",
  "repo": "demo-react-taskmanager",
  "title": "Fix task deletion error",
  "body": "Tasks are not being deleted properly...",
  "type": "Bug",
  "labels": ["bug"]
}
```

#### Example 3: Create a Feature Request

```json
{
  "method": "create",
  "owner": "MaquestiauxLabs",
  "repo": "demo-react-taskmanager",
  "title": "Add task filtering by date",
  "body": "Implement date range filtering for tasks...",
  "type": "Feature",
  "labels": ["enhancement", "good first issue"]
}
```

#### Updating an Existing Issue

```json
{
  "method": "update",
  "issue_number": 5,
  "owner": "MaquestiauxLabs",
  "repo": "demo-react-taskmanager",
  "type": "Task",
  "labels": ["enhancement"]
}
```

### Important Notes

- Always set `method` to `"create"` for new issues or `"update"` for existing ones
- The `type` parameter must be exactly: `Task`, `Bug`, or `Feature`
- The `labels` parameter is an array - at least one label is required
- Include all sections in the body for consistency and clarity
