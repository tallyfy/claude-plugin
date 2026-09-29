---
name: my-tasks
description: Show the user's open Tallyfy tasks grouped by when they are due, then complete, comment on or flag a problem on the ones they pick. Use when the user asks what is on their plate, what is due, or wants to finish or update a Tallyfy task.
---

# Work through my Tallyfy tasks

## 1. Show what is open

Call `get_my_tasks` with status "active-visible", which returns tasks that
are not started or in progress and leaves out auto-skipped ones. Results
come a page at a time: read the page count in the response's meta and fetch
the remaining pages, or tell the user you are showing only the first page and
how many tasks there are in total.

Tallyfy has no overdue status on a task, so compare each deadline with the
current time. Group the tasks as overdue, due today, due this week, later,
and no deadline. For each task show its title, the process it belongs to,
and its deadline. Tasks carry the process id, not its name, so call
`get_process` once for each process you show. If there are many tasks, show
the overdue and today groups in full and give counts for the rest.

## 2. Open a task

When the user picks a task, call `get_task` for its details, including any
form fields it asks for. A one-off task that belongs to no process is read
with `get_standalone_task`.

## 3. Complete a task

1. If the task has required form fields, ask the user for each value and
   save them with `update_task`, or `update_standalone_task` for a one-off
   task.
2. Completing a task moves the process on and can notify the next person, so
   confirm with the user first.
3. Call `complete_task`, or `complete_standalone_task` for a one-off task.
   For an approval task, ask the user to approve or reject and pass that
   answer as `is_approved`.

## 4. Comment or flag a problem

- To leave a note for colleagues, call `add_task_comment` with the text the
  user approved.
- If something blocks the task, call `report_task_issue` with a one-line
  description of the problem. The process shows as having a problem until
  someone resolves it with `resolve_task_issues`.

After any change, show the user the updated task in one line.
