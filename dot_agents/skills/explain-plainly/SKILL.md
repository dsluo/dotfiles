---
name: explain-plainly
description: Explain a technical cause, mechanism, change or finding to someone without the domain background, while teaching the precise terms instead of hiding them. Use when asked to "explain", "eli5", "what does this mean", "walk me through", "in plain terms", or why something happened. Complements the dejargon skill, which rewrites existing text the same way.
argument-hint: "[what to explain] [optional: who the reader is]"
---

# Explain plainly

Explain so a non-expert understands the mechanism, and still leaves
knowing the real names for things. Plain does not mean imprecise.

## First: explain the right thing

Confirm what "this" or "it" refers to before explaining. If the user just
read a PR body, "explain the cause" may mean "explain that body", not the
incident behind it. When the referent is ambiguous and getting it wrong
would waste the answer, explain the most recent concrete artifact and
say which one you picked in the first line.

## Structure

1. **One-sentence answer first.** The whole point, in plain words, before
   any detail.
2. **Mechanism as a short chain of steps.** Each step is one plain
   sentence: what happens, then why that leads to the next step. Number
   the steps when order matters.
3. **Introduce each term inside the step where it matters**, glossed by
   what it does here: "the kernel's page cache (copies of recently read
   file data kept in RAM)". One gloss per term, then use the term bare.
4. **Keep the specifics.** Real numbers, names and flags stay: "48Gi
   requested, about 35 used", not "much more than it needed".
5. **Close with what it means for them.** One or two sentences: the fix,
   the risk, or the decision it informs.

## Analogies

An analogy is allowed only as scaffolding. Map each part of it back to
the real term ("bookings are memory *requests*"), so the reader can drop
the analogy and keep the vocabulary. Skip the analogy when the plain
mechanism is already short. Never let an analogy carry a claim the
real system doesn't support.

## Honesty

- Separate what was verified (read in the source, measured, seen in logs)
  from what is inferred, in plain words: "I read this in the code" vs "I
  expect this".
- When explaining your own earlier mistake or correction, say what was
  wrong in one sentence. Don't bury it.

## Length

Match the question. A "why?" gets a short chain of steps, not an essay.
Use a table only for real comparisons or breakdowns with numbers.
