---
name: launch-process
description: Find the right Tallyfy template, collect its kickoff form answers, and launch a process from it. Use when the user wants to start, kick off or run a process in Tallyfy, such as onboarding a client or approving an invoice.
---

# Launch a Tallyfy process

## 1. Find the template

Call `search_for_templates` with what the user named. If more than one
matches, list them with their summaries and ask which one. If the user wants
to check what the process involves first, call `get_template_steps`.

## 2. Collect the kickoff answers

Call `get_kickoff_fields`. Ask the user for each required field, one at a
time, and for optional fields only if the user wants to fill them. For a
dropdown, radio or multiselect field, offer the options from
`get_kickoff_dropdown_options`.

## 3. Name the process

Propose a name that tells this run apart from others, such as
"Onboarding Dana Whitfield" or "Invoice 4419 Tailspin Toys". Let the user
change it.

## 4. Launch

Show the user the template, the process name and the kickoff answers, and ask
them to confirm. Then call `launch_process` with the template id, the name,
and the kickoff answers as one object keyed by each field's `id` from
`get_kickoff_fields`.

## 5. Report back

Call `get_tasks_for_process` for the new process and tell the user the first
tasks, who has them, and when they are due. Tasks list their owners as user
and group ids, so name them from `get_organization_users_list` and
`get_groups`.
