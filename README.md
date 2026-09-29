# Tallyfy plugin for Claude

Run your team's repeatable work from Claude. This plugin connects Claude to
your Tallyfy account through the Tallyfy connector at
`https://mcp.tallyfy.com/`, and adds four skills for the jobs people most
often bring to Tallyfy.

| Skill | What it does |
|---|---|
| `build-template` | Turns an SOP, a document or a plain description into a Tallyfy template with steps, form fields, assignees and deadlines, checks it, and offers a test run. |
| `my-tasks` | Shows your open tasks grouped by when they are due, and completes, comments on or flags the ones you pick. |
| `launch-process` | Finds the right template, collects its kickoff form answers, and launches a process. |
| `stuck-processes` | Finds processes that are overdue or have an open problem, and says what is holding each one up. |

## What you need

A Tallyfy account. The first time Claude uses a Tallyfy tool, you sign in
with your normal Tallyfy login. Claude acts as you, so it sees and changes
only what your Tallyfy role allows. The connector marks every tool that
deletes or archives as destructive, and your Claude app's tool permissions
decide whether Claude asks you before using one.

## Install

Install the Tallyfy plugin from the Claude directory. To try it locally in
Claude Code, clone this repository and run `claude --plugin-dir .` from it.

## Privacy

The plugin stores nothing itself. The skills are instructions for Claude,
and every read or change goes through the Tallyfy connector to your Tallyfy
account. See the Tallyfy privacy policy at
https://tallyfy.com/legal/privacy-policy/.

## Support

Email support@tallyfy.com. Product documentation is at
https://tallyfy.com/products/pro/integrations/mcp-server/.

## Contributing

- Files are ASCII only.
- A skill may name only tools the Tallyfy connector serves. `test/tools.txt`
  holds that list, taken from the live server; refresh it when the server
  adds or renames a tool.
- Run `node --test` and `claude plugin validate . --strict` before opening a
  pull request.

## License

MIT. See `LICENSE`.
