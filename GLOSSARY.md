# Skills UI

A desktop app that manages agent skills by running the `skills` CLI on the user's behalf and showing what happened.

## Language

**Package**:
A published collection of one or more skills that the `add` command installs from, usually a GitHub repository. A package itself is never installed; its skills are.
_Avoid_: Source, repo, repository

**Mutating command**:
A CLI command that changes which skills are installed: `add`, `update` or `remove`.
_Avoid_: Action, write

**Read command**:
A CLI command that only reports state, such as `ls`.
_Avoid_: Query, refresh

**Outcome**:
The result of one finished command: **ok**, **needs attention** or **failed**.
_Avoid_: Status, success flag

**Needs attention**:
The outcome of a command that completed but reported a warning or skipped part of its work.
_Avoid_: Warning state, partial success

**Notable line**:
A line of command output that reports a warning or a skip, together with the bullet items listed under it.
_Avoid_: Warning line, alert

**Result bar**:
The strip at the bottom of the main content showing the running state and outcome of the latest mutating command.
_Avoid_: Toast, banner, notification

**Activity**:
The chronological record of every command the app has run.
_Avoid_: Log, history
