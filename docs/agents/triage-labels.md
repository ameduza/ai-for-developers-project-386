# Triage Labels

Skills speak in terms of five canonical states. This file maps them to the label
strings actually used in the issue tracker.

The tracker is GitHub, so these are real GitHub labels: all five exist in
`ameduza/ai-for-developers-project-386`, alongside the standard category labels `bug` /
`enhancement`.

| Label in mattpocock/skills | Label in our tracker | Meaning |
| -------------------------- | -------------------- | ------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate the issue |
| `needs-info`               | `needs-info`         | Waiting on data from the issue author |
| `ready-for-agent`          | `ready-for-agent`    | Fully described, agent can pick it up |
| `ready-for-human`          | `ready-for-human`    | Requires a human |
| `wontfix`                  | `wontfix`            | Will not be done |

When a skill references a state (e.g. "apply the agent-ready label"), apply the
corresponding label via `gh issue edit <n> --add-label "..."`. Each triaged issue
has exactly one category label and exactly one state label.