---
name: dejargon
description: Rewrite existing text (PR bodies, commit messages, docs, comments, reports) so a reader without the domain background can follow it, while keeping every precise term, name, number and flag. Use when asked to "de-jargon", "make this readable", "don't assume they know X", "simplify this without losing detail", or "plain-language version" of something already written.
argument-hint: "[text, file path, or PR number] [optional: who the reader is]"
---

# De-jargon

Make text readable for someone outside the domain without making it vaguer.
The reader should come away understanding what happened *and* knowing the
real terms, so they can search for them or talk to an expert.

## The core rule: gloss, don't replace

Keep the precise term and attach a plain explanation the first time it
appears. Never swap a term for a vague paraphrase.

- Bad (jargon): "reads the n-gram table with O_DIRECT"
- Bad (vague): "reads the big lookup table straight from disk"
- Good: "reads the model's large on-disk lookup table (the 47.7 GiB n-gram
  embedding) with O_DIRECT, straight from disk and bypassing the kernel's
  page cache"

Each term gets one gloss, on first use. After that, use the term bare.

## Steps

1. **Pick the reader.** Use the one the user names; otherwise assume a
   technical generalist: knows what RAM, disk, a server and a config file
   are, but not this project's tools or this field's vocabulary.
2. **List the terms that reader wouldn't know.** Include acronyms, flag
   names, project-specific names (`qfn`, `talos1`), library or kernel
   concepts (`O_DIRECT`, page cache, cgroup), and field terms (n-gram,
   preemption). Leave out words the reader certainly knows.
3. **Gloss each one by what it does here**, not by its textbook definition.
   "O_DIRECT (reads straight from disk, skipping the kernel's RAM cache)"
   beats "O_DIRECT (a Linux open(2) flag)". One clause, in parentheses or
   after a comma.
4. **Keep every specific.** Numbers, units, file paths, flag values, PR
   numbers, version strings, and names all survive. If the original says
   "47.7 GiB", the rewrite says "47.7 GiB", not "very large".
5. **Turn implied causes into explicit ones.** Jargon-heavy text often
   skips the "so" between two facts. Say why A leads to B in plain words.
6. **Check facts as you rewrite.** Simplifying is when errors slip in, such
   as merging two separate facts into one wrong claim. Re-check each
   sentence against the source before replacing the original.
7. **Keep the length close.** Glosses add words, so cut filler elsewhere.
   Aim for at most about 1.5x the original. Terse formats stay terse:
   PR bodies, commit messages, code comments.

## Format notes

- Keep code-formatted terms in backticks (`--embedding-placement ram`) and
  put the plain gloss outside the backticks.
- Respect the destination's conventions. Code comments stay short:
  gloss only the term the comment hinges on. A commit subject line is
  never glossed; gloss in the body line if anywhere.
- When editing something already published (a PR body, an issue), show the
  new text after updating it.
