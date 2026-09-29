---
name: build-template
description: Turn an SOP, a document or a plain description of a process into a Tallyfy template with steps, form fields, assignees and deadlines, check it, and offer a test run. Use when the user wants to create, draft or document a repeatable process in Tallyfy.
---

# Build a Tallyfy template

Work through these steps in order. Ask one question at a time, and show the
user the draft before creating anything in their account.

## 1. Learn the organization

Call `get_org_context` to read what the organization has already recorded,
such as team names and naming conventions. Then call `search_for_templates`
with the process name. If a similar template exists, ask the user whether to
improve that one or start a new one.

## 2. Draft the outline

From the SOP, document or description, draft:

- A template title and a one-line summary.
- The steps in order. Give each a short title that starts with a verb
  ("Review the invoice"), who does it, and when it is due relative to the
  start of the process.
- The form fields each step collects, with a type: text, textarea, date,
  dropdown, multiselect, radio, file or table.
- A kickoff form: the details someone must give before the process starts,
  such as the client name or the invoice amount.

Show the outline as a numbered list. Ask the user to confirm or change it,
and create nothing until they confirm.

## 3. Create it

1. `create_template` with the title and summary. Use the procedure type
   unless the user asked for a form or a document.
2. `add_step_to_template` for each step, in order.
3. `add_form_field_to_step` for each step's fields, and `add_kickoff_field`
   for each kickoff field.
4. `add_assignees_to_step` for each step with a named person or group. Find
   people with `get_organization_users_list` and groups with `get_groups`.
   If someone is not in Tallyfy yet, leave the step unassigned and tell the
   user which steps need an owner.
5. Set deadlines with `update_step`. If a deadline is unclear, call
   `suggest_step_deadline` and propose one.

## 4. Check it

Call `test_template` on the new template. It walks every path through the
template's rules and reports problems. Fix what it reports, and tell the user
about anything you could not fix.

## 5. Offer a test run

Tell the user the template is ready and summarise it in two or three lines.
Ask whether they want a test run. If they do, launch one with
`launch_process` and give it a name that is plainly a test, such as
"TEST Invoice Approval".
