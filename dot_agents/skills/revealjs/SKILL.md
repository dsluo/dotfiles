---
name: revealjs
description: Author HTML slide decks with reveal.js, writing the slides as Markdown. Covers slide separation, speaker notes, fragments, slide/element attributes, backgrounds, code highlighting, layout helpers and auto-animate. Use whenever asked to build a presentation, slide deck, talk or talk-through in reveal.js, or to convert notes/a document into slides.
---

# Authoring reveal.js decks in Markdown

A deck is two files: an `index.html` that boots reveal.js, and a `slides.md`
holding every slide. Almost all the work happens in `slides.md`.

Docs: https://revealjs.com/markdown/ · Current major: **6.x** (plugins live at
`dist/plugin/<name>.js`; in 5.x they were at `plugin/<name>/<name>.js`).

## Start a deck

1. Copy `templates/index.html` from this skill directory next to a new
   `slides.md`. Set the `<title>` and pick a theme.
2. Write the slides in `slides.md`.
3. Preview: external Markdown is fetched over HTTP, so `file://` will not work.
   Run `python3 -m http.server 8000` in the deck directory and open
   `http://localhost:8000`.

Keep Markdown in a separate file rather than inline in the HTML. Inline
`<textarea data-template>` blocks are indentation-sensitive and break on
consecutive blank lines.

## Slide separation

The template sets these separators explicitly — do not drop them:

```
data-separator="^\r?\n---\r?\n"
data-separator-vertical="^\r?\n--\r?\n"
data-separator-notes="^Note:"
```

- `---` alone on its own line, blank line above and below, starts a new
  horizontal slide.
- `--` alone on its own line starts a **vertical** slide beneath the current
  one. Vertical separation is off unless `data-separator-vertical` is set, so a
  stray `--` in a deck without it lands in the slide body as text.
- Use vertical stacks for optional depth: the audience moves right through the
  spine of the talk, down only when you want the detail.

```markdown
# Title slide

Subtitle

---

## Second slide

--

### Detail under the second slide
```

## Speaker notes

A line starting with `Note:` ends the slide body; everything after it, to the
end of the slide, shows only in the speaker view (press `S`).

```markdown
## Deployment

- Blue/green cutover
- Rollback in one command

Note:
Mention the 2am incident here. Don't read the bullets aloud.
```

## Slide and element attributes

Attributes ride along in HTML comments.

- **Slide** attributes: `<!-- .slide: ... -->`, anywhere in the slide; put it on
  the first line by convention.
- **Element** attributes: `<!-- .element: ... -->`, on the same line as the
  element it decorates (for a multi-line block, the last line).

```markdown
<!-- .slide: data-background-color="#1c1c26" class="text-left" -->

## Findings

- Latency is fine <!-- .element: class="fragment" -->
- Cost is not <!-- .element: class="fragment highlight-red" -->

![Architecture](img/arch.svg) <!-- .element: class="r-stretch" -->
```

## Fragments

`class="fragment"` reveals an element on the next keypress. Add a second class
for the animation (`fade-up`, `grow`, `highlight-red`, `strike`,
`fade-in-then-out`, …) and `data-fragment-index="N"` to reorder or to reveal
several elements together. Full list in `reference.md`.

```markdown
- Ship it <!-- .element: class="fragment fade-up" data-fragment-index="2" -->
- Test it <!-- .element: class="fragment fade-up" data-fragment-index="1" -->
```

## Backgrounds

Set on the slide comment. Common ones:

```markdown
<!-- .slide: data-background-color="#004080" -->
<!-- .slide: data-background-image="img/city.jpg" data-background-opacity="0.4" -->
<!-- .slide: data-background-gradient="linear-gradient(to bottom, #283b95, #17b2c3)" -->
<!-- .slide: data-background-video="clip.mp4" data-background-video-loop data-background-video-muted -->
```

A full-bleed image slide reads better with `data-background-opacity` around
`0.3`–`0.5` so text stays legible.

## Code

Fence as usual. The bracket suffix drives step-by-step highlighting: each
`|`-separated group is one keypress.

````markdown
```python [1-2|4|6-8]
import polars as pl

df = pl.read_parquet("events.parquet")

(df.filter(pl.col("status") == "error")
   .group_by("service")
   .agg(pl.len()))
```
````

- `[]` with no groups (`[]`) shows line numbers with nothing highlighted.
- Offset the first line number with `[7: 1-2|3]` when showing an excerpt.
- Long lines get scaled down, not wrapped — keep code under ~60 columns and
  strip imports and boilerplate that the point does not need.

## Layout helpers

Plain CSS classes, applied through element attributes:

- `r-fit-text` — scale text to fill the slide width. One-word or one-phrase
  slides only.
- `r-stretch` — size an image or video to the leftover vertical space. One per
  slide, and it must be a direct child of the slide.
- `r-stack` — center children on top of each other; combine with fragments to
  swap images in place.
- `r-frame` — a bordered frame around an element.

```markdown
## 40x faster <!-- .element: class="r-fit-text" -->

![Architecture](img/arch.svg) <!-- .element: class="r-stretch" -->
```

`r-stack` wraps a *group* of elements, which Markdown has no syntax for, so
write that one as raw HTML in the slide:

```markdown
<div class="r-stack">
  <img class="fragment" src="before.png" width="450" />
  <img class="fragment" src="after.png" width="450" />
</div>
```

## Auto-animate

Put `data-auto-animate` on two adjacent slides and reveal.js tweens matching
elements between them — matched by text content, by media `src`, or explicitly
by `data-id`. Good for growing a diagram, walking through a formula, or
building up code.

`````markdown
<!-- .slide: data-auto-animate -->

## The pipeline

```sql [1]
select * from raw.events
```

---

<!-- .slide: data-auto-animate -->

## The pipeline

```sql [1-3]
select * from raw.events
where status = 'error'
group by service
```
`````

Both slides need the attribute. `data-auto-animate-restart` breaks the chain,
`data-auto-animate-duration` (seconds) changes the pace.

## Raw HTML

Anything Markdown cannot express — a two-column layout, a wrapper div, a table
with colspans — can be written as HTML directly in `slides.md`. Markdown inside
a block-level HTML tag is not parsed, so write that content as HTML too.

```markdown
<div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem">
  <div><h3>Now</h3><p>Nightly batch</p></div>
  <div><h3>Next</h3><p>Streaming</p></div>
</div>
```

## Writing the deck

- One idea per slide. If a slide needs a paragraph, it needs to be two slides,
  or the paragraph belongs in `Note:`.
- Six or so bullets is the ceiling, and fragments make long lists bearable.
- Headings carry the argument. Reading only the `##` lines top to bottom should
  give the shape of the talk.
- Images and code beat prose. Reveal.js scales content to fit, so an oversized
  block shrinks into illegibility rather than overflowing — check it rendered.
- Ask the audience, length, and whether it is presented live or read alone
  before writing, if not already clear. A read-alone deck carries more text and
  no speaker notes.

## Gotchas

- `---` needs a blank line on both sides. `--` too.
- An element comment on the wrong line silently does nothing; there is no error.
- `Note:` swallows everything after it in that slide.
- Local images must sit under the served directory; absolute `file://` paths
  will not load.
- Vertical slides break linear PDF export and confuse audiences following
  along — reach for them sparingly.

`reference.md` has the complete tables: fragment classes, background
attributes, code attributes, auto-animate options, `Reveal.initialize` config,
theme names and CDN paths.
