#import "@preview/basic-report:0.5.0": *
#import "obsidian.typ": render_markdown

#show: it => basic-report(
  doc-category: "TODO",
  doc-title: "TODO",
  author: "TODO",
  language: "en",
  it,
)

#render_markdown(
  "main.md",
)

#pagebreak()

#bibliography(
  "Citations/references.bib",
  title: "References",
  style: "ieee",
)

#pagebreak()

#render_markdown(
  "AI Disclosure.md",
  file-headings: true,
)
