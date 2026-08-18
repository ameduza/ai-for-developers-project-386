# Issue Tracker: GitHub

Tasks and specs for this repo live as GitHub issues in
[ameduza/ai-for-developers-project-386/](https://github.com/ameduza/ai-for-developers-project-386/). All operations use
the `gh` CLI: it auto-detects the repo from `git remote -v`.

## Conventions

- **Create issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read issue**: `gh issue view <number> --comments`, optionally filtering comments via `jq` and requesting labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with the needed `--label` and `--state` filters.
- **Comment**: `gh issue comment <number> --body "..."`
- **Add / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

## Pull requests as a source of requests

**PRs as a source of requests: no.** _(Set to `yes` if external PRs in this repo are considered feature requests; `/triage` reads this flag.)_

## When a skill says "publish to tracker"

Create a GitHub issue.

## When a skill says "pick up the needed ticket"

Run `gh issue view <number> --comments`.

## Blocking dependencies between tickets

The canonical approach is **native GitHub dependencies**:

```bash
gh api repos/ameduza/ai-for-developers-project-386/issues/<n> --jq .id          # database id of the blocker
gh api --method POST repos/ameduza/ai-for-developers-project-386/issues/<child>/dependencies/blocked_by \
  -F issue_id=<blocker-db-id>
```

Note: you need the numeric **database id**, not `#number` and not
`node_id`. In `issue_dependencies_summary.blocked_by`, GitHub counts only
**open** blockers — this is the live gate. If dependencies are unavailable, the
fallback is a `Blocked by: #<n>, #<n>` line at the beginning of the ticket body.
A ticket is unblocked when all its blockers are closed.

## Wayfinding operations

Used by the `/wayfinder` skill. A **map** is a separate issue with the label
`wayfinder:map`, containing sections Notes / Decisions-so-far / Fog in its body.
Child tickets are linked as sub-issues (or via a task list in the map plus a
`Part of #<map>` line in the child) and receive the label `wayfinder:<type>`
(`research`/`prototype`/`grilling`/`task`). Pick up a ticket with
`gh issue edit <n> --add-assignee @me`; close it with a comment containing the
answer, then `gh issue close`, then add a pointer to the decision in the map's
Decisions-so-far section.

