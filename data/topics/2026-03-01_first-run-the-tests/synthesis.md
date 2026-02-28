# First Run the Tests

**TL;DR:** The "First run the tests" prompt is a deceptively powerful pattern for agentic development. By having agents execute the test suite at session start, you establish testing as a first-class concern, give the agent context about the codebase, and create a feedback loop that catches regressions before they reach production.

## Key Insights

**Tests verify AI-generated code actually works.** The old excuses for skipping tests— they're time-consuming to write and expensive to maintain during rapid iteration—no longer apply when agents can generate and refine them in minutes. More importantly, if code has never been executed, it's luck whether it works in production. Agents will confidently produce code that appears correct but fails in edge cases; tests are the guardrail.

**The four-word prompt does heavy lifting.** Prompting "First run the tests" (or "Run uv run pytest" for Python projects) serves multiple purposes: it signals that a test suite exists, forces the agent to discover how to execute it, and creates a strong likelihood the agent will re-run tests after making changes. This single prompt embeds testing culture into the agent's workflow without verbose instructions.

**Tests double as codebase documentation.** Agents are already biased toward reading tests when exploring unfamiliar code. An existing test suite acts as a specification of expected behavior—far more reliable than outdated comments or stale README files. When you prompt an agent about a feature, it'll likely find and read the relevant tests first, using them as a blueprint for any changes.

## Why This Matters

In agentic workflows where code is generated faster than humans can review it, automated tests are the only scalable way to verify correctness and prevent regression—making them not optional but foundational to responsible AI-assisted development.