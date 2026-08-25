# Repository

- **Owner:** ameduza
- **Repo:** ai-for-developers-project-386

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues. see [docs/agents/issue-tracker.md](docs/agents/issue-tracker.md).

### Triage labels

Five canonical roles map to GitHub labels. See [triage-labels.md](docs/agents/triage-labels.md).

### Domain docs

Single-context layout: one `CONTEXT.md` + `docs/adr/` at repo root. See `docs/agents/domain.md`.

### Spec Driven Development

SDD pipeline — [mattpocock/skills](https://github.com/mattpocock/skills),
installed in `.agents/skills/`. Tasks live in GitHub issues — see
[docs/agents/issue-tracker.md](docs/agents/issue-tracker.md).

## Commits

Agents must format every commit message according to
[Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/):

```text
<type>[optional scope][optional !]: <description>
```

- Use `feat` for new features and `fix` for bug fixes. Other types permitted by
  the specification may be used when appropriate.
- Mark breaking changes with `!` before the colon or with a
  `BREAKING CHANGE: <description>` footer.
- When present, commit bodies and footers must follow the specification.
