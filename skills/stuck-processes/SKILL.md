---
name: stuck-processes
description: Find Tallyfy processes that are overdue or have an open problem, and summarise what is holding each one up and who can move it. Use when the user asks what is stuck, late, blocked or at risk in Tallyfy.
---

# Find stuck Tallyfy processes

## 1. Find them

Call `get_organization_runs` twice: once with status "problem" (a task has an
open problem) and once with status "delayed" (a task is overdue). If the user
named a template, a folder or a tag, pass that filter too.

## 2. Find what is holding each one up

For each process, call `get_tasks_for_process` with status "overdue" to find
the late tasks and who has them. For a process with a problem, call
`get_tasks_for_process` with status "has-problem" to find the flagged task,
then `get_task_comments` on it to read what was reported.

## 3. Summarise

Give one line per process: the process name, the task holding it up, who has
that task, how late it is, and the reported problem if there is one. Put the
latest first. If nothing is stuck, say so in one sentence.

## 4. Offer to nudge

Ask whether the user wants to nudge anyone. Draft the comment, show it to the
user, and post it with `add_task_comment` only after they approve the text.
If the user has fixed a reported problem, offer to mark it resolved with
`resolve_task_issues`.
