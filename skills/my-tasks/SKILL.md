---
name: my-tasks
description: Show the user's open Tallyfy tasks grouped by when they are due, then complete, comment on or flag a problem on the ones they pick. Use when the user asks what is on their plate, what is due, or wants to finish or update a Tallyfy task.
---

# Work through my Tallyfy tasks

## 1. Show what is open

Call `get_my_tasks`. It returns open tasks by default. Group them as overdue,
due today, due this week, later, and no deadline. For each task show its
title, the process it belongs to, and its deadline. Keep the list short: if
there are many, show the overdue and today groups in full and give counts for
the rest.

## 2. Open a task

When the user picks a task, call `get_task` for its details, including any
form fields it asks for. A one-off task that belongs to no process is read
with `get_standalone_task`.

## 3. Complete a task

1. If the task has required form fields, ask the user for each value and save
   them with `update_task`.
2. For an approval task, ask whether to approve or reject.
3. Completing a task moves the process on and can notify the next person, so
   confirm with the user first. Then call `complete_task`, or
   `complete_standalone_task` for a one-off task.

## 4. Comment or flag a problem

- To leave a note for colleagues, call `add_task_comment` with the text the
  user approved.
- If something blocks the task, call `report_task_issue` with a one-line
  description of the problem. The process shows as having a problem until
  someone resolves it with `resolve_task_issues`.

After any change, show the user the updated task in one line.
