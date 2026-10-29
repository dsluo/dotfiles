# reveal.js authoring reference (6.x)

## CDN paths

Base: `https://cdn.jsdelivr.net/npm/reveal.js@6/`

| File | Purpose |
| --- | --- |
| `dist/reset.css` | Browser reset |
| `dist/reveal.css` | Core styles |
| `dist/theme/<name>.css` | Theme |
| `dist/reveal.js` | Core (UMD, defines `Reveal`) |
| `dist/plugin/markdown.js` | `RevealMarkdown` |
| `dist/plugin/highlight.js` | `RevealHighlight` |
| `dist/plugin/highlight/monokai.css` | Code theme |
| `dist/plugin/notes.js` | `RevealNotes` (speaker view) |
| `dist/plugin/math.js` | `RevealMath.KaTeX` / `.MathJax3` |
| `dist/plugin/search.js` | `RevealSearch` |
| `dist/plugin/zoom.js` | `RevealZoom` |

In 5.x these were `plugin/<name>/<name>.js`. The `.esm.js` builds are `.mjs`
in 6.x.

Themes: `black` (default), `white`, `league`, `beige`, `night`, `serif`,
`simple`, `solarized`, `moon`, `dracula`, `sky`, `blood`.

## Markdown plugin attributes

Set on the `<section data-markdown="slides.md">` element.

| Attribute | Default | Notes |
| --- | --- | --- |
| `data-markdown` | — | Path to the `.md` file; empty means inline `<textarea data-template>` |
| `data-separator` | `\r?\n---\r?\n` | Horizontal slide break |
| `data-separator-vertical` | *(none)* | Vertical slide break — **off unless set** |
| `data-separator-notes` | `^s*notes?:` | Speaker-note marker, case-insensitive. The shipped default really is `^s*notes?:` (an upstream typo for `^\s*`); it still matches `Note:` at the start of a line. The template sets `^Note:` explicitly. |
| `data-charset` | — | File encoding, e.g. `iso-8859-15` |

Marked options go under `markdown:` in `Reveal.initialize`, e.g.
`markdown: { smartypants: true }`.

## In-Markdown comments

```markdown
<!-- .slide: data-background-color="#333" class="my-class" -->
text <!-- .element: class="fragment" data-fragment-index="2" -->
```

Slide comments apply to the containing slide from anywhere in it; element
comments must sit on the element's own line (its last line, for a block).

## Fragment classes

Base class is `fragment`; add one animation class.

| Class | Effect |
| --- | --- |
| *(none)* | Fade in |
| `fade-out` | Starts visible, fades out |
| `fade-up` / `fade-down` / `fade-left` / `fade-right` | Fade in while sliding |
| `fade-in-then-out` | Fades in, then out on the next step |
| `current-visible` | Same as `fade-in-then-out` |
| `fade-in-then-semi-out` | Fades in, then to 50% on the next step |
| `grow` | Scale up |
| `shrink` | Scale down |
| `semi-fade-out` | Fade to 50% |
| `strike` | Strike through |
| `highlight-red` / `-green` / `-blue` | Recolor text |
| `highlight-current-red` / `-green` / `-blue` | Recolor, then revert next step |

`data-fragment-index="N"` sets order; equal indices reveal together.

## Background attributes

| Attribute | Default | Notes |
| --- | --- | --- |
| `data-background-color` | — | Any CSS color |
| `data-background-gradient` | — | `linear-` / `radial-` / `conic-gradient(...)` |
| `data-background-image` | — | URL; GIFs restart on slide entry |
| `data-background-size` | `cover` | CSS `background-size` |
| `data-background-position` | `center` | CSS `background-position` |
| `data-background-repeat` | `no-repeat` | CSS `background-repeat` |
| `data-background-opacity` | `1` | `0`–`1` |
| `data-background-video` | — | One URL or a comma-separated list |
| `data-background-video-loop` | `false` | Boolean attribute |
| `data-background-video-muted` | `false` | Boolean attribute |
| `data-background-iframe` | — | Live page as background |
| `data-background-interactive` | — | Let clicks reach the iframe |
| `data-preload` | — | Load the iframe ahead of time |
| `data-background-transition` | `fade` | `none` `fade` `slide` `convex` `concave` `zoom` |

## Code block attributes

Markdown form: ```` ```lang [groups] ````

| Form | Effect |
| --- | --- |
| ```` ```js ```` | Highlight only |
| ```` ```js [] ```` | Show line numbers |
| ```` ```js [3,8-10] ```` | Highlight those lines |
| ```` ```js [1-2\|3\|4] ```` | Three reveal steps |
| ```` ```js [7: 1-2\|3] ```` | Same, first line numbered 7 |

HTML form uses `data-line-numbers="3-5|8-10"`, `data-ln-start-from="7"`,
`data-trim`, `data-noescape`, and `class="language-python"`. Wrap code
containing `<`/`>` in `<script type="text/template">` to skip escaping.

## Layout helper classes

| Class | Effect |
| --- | --- |
| `r-fit-text` | Scales text to the largest size that fits |
| `r-stretch` | Fills leftover vertical height; direct slide child only, one per slide |
| `r-stack` | Centers children stacked on each other |
| `r-frame` | Draws a frame around the element |
| `r-hstack` / `r-vstack` | Flex row / column layout of children |

## Auto-animate

| Attribute | Default | Scope |
| --- | --- | --- |
| `data-auto-animate` | — | Slide; required on both slides |
| `data-auto-animate-id` | — | Slide; groups slides into one chain |
| `data-auto-animate-restart` | — | Slide; breaks the chain with the previous slide |
| `data-auto-animate-easing` | `ease` | Slide or element |
| `data-auto-animate-duration` | `1.0` | Seconds; slide or element |
| `data-auto-animate-delay` | `0` | Seconds; element only |
| `data-auto-animate-unmatched` | `true` | Fade in elements with no match |
| `data-id` | — | Element; forces a match across slides |

Animatable properties: `position`, `font-size`, `line-height`, `color`,
`background-color`, `padding`, `margin`. Matching is by text content, by media
`src`, or by `data-id`.

## Reveal.initialize options worth setting

| Option | Default | Notes |
| --- | --- | --- |
| `transition` | `slide` | `none` `fade` `slide` `convex` `concave` `zoom` |
| `transitionSpeed` | `default` | `default` `fast` `slow` |
| `backgroundTransition` | `fade` | Same value set as `transition` |
| `controls` | `true` | Arrow controls |
| `progress` | `true` | Progress bar |
| `slideNumber` | `false` | `true`, `'c/t'`, `'c'`, `'h/v'`, `'h.v'` |
| `hash` | `false` | Slide in the URL; set `true` so links deep-link |
| `center` | `true` | Vertically center slide content |
| `width` / `height` | `960` / `700` | Logical deck size, scaled to the window |
| `margin` | `0.04` | Empty space around content |
| `autoAnimate` | `true` | Global on/off |
| `pdfSeparateFragments` | `true` | One PDF page per fragment step |
| `plugins` | `[]` | e.g. `[RevealMarkdown, RevealHighlight, RevealNotes]` |

## Math

```html
<script src="https://cdn.jsdelivr.net/npm/reveal.js@6/dist/plugin/math.js"></script>
```
```js
Reveal.initialize({ plugins: [RevealMath.KaTeX] });
```

KaTeX delimiters: `$…$` and `\(…\)` inline, `$$…$$` and `\[…\]` display.
Escape backslashes as needed inside Markdown, or wrap the block in
`<!-- .element: -->`-free raw HTML if the parser mangles it.

## Keys during a presentation

`S` speaker view · `F` fullscreen · `O` or `Esc` slide overview · `B` or `.`
blank screen · `?` help. Append `?print-pdf` to the URL and print to PDF for a
handout.
