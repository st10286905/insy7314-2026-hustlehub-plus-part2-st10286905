#import "@preview/cmarker:0.1.10"

#let get-callout-icon-svg(icon-name, color-hex) = {
  let icons = (
    flame: "<path d=\"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z\"/>",
    check: "<polyline points=\"20 6 9 17 4 12\"/>",
    info: "<circle cx=\"12\" cy=\"12\" r=\"10\"/><line x1=\"12\" y1=\"16\" x2=\"12\" y2=\"12\"/><line x1=\"12\" y1=\"8\" x2=\"12.01\" y2=\"8\"/>",
    pencil: "<path d=\"M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z\"/><path d=\"m15 5 4 4\"/>",
    warning: "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z\"/><line x1=\"12\" y1=\"9\" x2=\"12\" y2=\"13\"/><line x1=\"12\" y1=\"17\" x2=\"12.01\" y2=\"17\"/>",
    error: "<circle cx=\"12\" cy=\"12\" r=\"10\"/><line x1=\"15\" y1=\"9\" x2=\"9\" y2=\"15\"/><line x1=\"9\" y1=\"9\" x2=\"15\" y2=\"15\"/>",
    bug: "<rect width=\"8\" height=\"14\" x=\"8\" y=\"6\" rx=\"4\"/><path d=\"m19 7-3 2\"/><path d=\"m5 7 3 2\"/><path d=\"m19 19-3-2\"/><path d=\"m5 19 3-2\"/><path d=\"M20 13h-4\"/><path d=\"M4 13h4\"/><path d=\"m10 4 1 2\"/><path d=\"m14 4-1 2\"/>",
    zap: "<polygon points=\"13 2 3 14 12 14 11 22 21 10 12 10 13 2\"/>",
    list: "<line x1=\"8\" y1=\"6\" x2=\"21\" y2=\"6\"/><line x1=\"8\" y1=\"12\" x2=\"21\" y2=\"12\"/><line x1=\"8\" y1=\"18\" x2=\"21\" y2=\"18\"/><line x1=\"3\" y1=\"6\" x2=\"3.01\" y2=\"6\"/><line x1=\"3\" y1=\"12\" x2=\"3.01\" y2=\"12\"/><line x1=\"3\" y1=\"18\" x2=\"3.01\" y2=\"18\"/>",
    quote: "<path d=\"M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z\"/><path d=\"M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z\"/>",
  )

  let icon-body = icons.at(icon-name, default: icons.info)
  let raw-svg = (
    "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\""
      + color-hex
      + "\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">"
      + icon-body
      + "</svg>"
  )

  image(bytes(raw-svg), format: "svg", width: 1.15em, height: 1.15em)
}

#let render-callout(attrs, body) = {
  let callout-type = lower(attrs.at("type", default: "note"))
  let title = attrs.at("title", default: "")

  let themes = (
    important: (icon: "flame", color: rgb("#0284c7"), default-title: "Important"),
    info: (icon: "info", color: rgb("#0284c7"), default-title: "Info"),
    note: (icon: "pencil", color: rgb("#0284c7"), default-title: "Note"),
    success: (icon: "check", color: rgb("#16a34a"), default-title: "Success"),
    tip: (icon: "flame", color: rgb("#0d9488"), default-title: "Tip"),
    warning: (icon: "warning", color: rgb("#d97706"), default-title: "Warning"),
    caution: (icon: "warning", color: rgb("#d97706"), default-title: "Caution"),
    error: (icon: "error", color: rgb("#dc2626"), default-title: "Error"),
    danger: (icon: "zap", color: rgb("#dc2626"), default-title: "Danger"),
    bug: (icon: "bug", color: rgb("#dc2626"), default-title: "Bug"),
    example: (icon: "list", color: rgb("#9333ea"), default-title: "Example"),
    quote: (icon: "quote", color: rgb("#6b7280"), default-title: "Quote"),
  )

  let theme = themes.at(callout-type, default: (
    icon: "info",
    color: rgb("#0284c7"),
    default-title: upper(callout-type.slice(0, 1)) + callout-type.slice(1),
  ))

  let display-title = if title != "" { title } else { theme.default-title }
  let hex-str = theme.color.to-hex()

  block(
    width: 100%,
    breakable: true,
    stroke: (left: 3.5pt + theme.color),
    fill: theme.color.lighten(94%),
    radius: (right: 4pt),
    inset: (x: 12pt, top: 8pt, bottom: 8pt),
    spacing: 1.2em,
  )[
    #grid(
      columns: (auto, 1fr),
      gutter: 7pt,
      align: (horizon, horizon),
      get-callout-icon-svg(theme.icon, hex-str), text(weight: 700, fill: theme.color, size: 0.95em)[#display-title],
    )
    #v(3pt)
    #body
  ]
}

#let parse-obsidian-callouts(text) = {
  text.replace(
    regex("(?m)^>[ \t]*\[!([a-zA-Z0-9_-]+)\][ \t]*(.*?)\r?\n((?:>[ \t]*.*(?:\r?\n|$))*)"),
    m => {
      let callout-type = m.captures.at(0)
      let raw-title = m.captures.at(1).trim()

      let title = raw-title.replace(regex("^\*+|\*+$"), "").replace(regex("^_+|_+$"), "").trim().replace("\"", "&quot;")

      let body = m.captures.at(2).replace(regex("(?m)^>[ \t]?"), "")

      "\n\n<callout type=\"" + callout-type + "\" title=\"" + title + "\">\n\n" + body + "\n\n</callout>\n\n"
    },
  )
}

#let get-min-heading-level(raw-text) = {
  let lines = raw-text.split("\n")
  let min-h = 7
  let in-code-block = false
  let in-exclude-block = false

  for line in lines {
    let trimmed = line.trim()

    if trimmed.starts-with("<!--typst-begin-exclude-->") {
      in-exclude-block = true
    }
    if in-exclude-block {
      if trimmed.ends-with("<!--typst-end-exclude-->") or trimmed.contains("<!--typst-end-exclude-->") {
        in-exclude-block = false
      }
      continue
    }

    if trimmed.starts-with("```") or trimmed.starts-with("~~~") {
      in-code-block = not in-code-block
      continue
    }
    if in-code-block { continue }

    let h-match = line.match(regex("^ *(#{1,6}) +"))
    if h-match != none {
      let lvl = h-match.captures.at(0).len()
      min-h = calc.min(min-h, lvl)
    }
  }

  if min-h > 6 { 1 } else { min-h }
}

#let shift-markdown-headings(text, offset) = {
  if offset == 0 { return text }
  text.replace(
    regex("(?m)^([ \t]*)(#{1,6})([ \t]+)"),
    m => {
      let indent = m.captures.at(0)
      let hashes = m.captures.at(1)
      let space = m.captures.at(2)
      let new-level = calc.min(calc.max(hashes.len() + offset, 1), 6)
      indent + ("#" * new-level) + space
    },
  )
}

#let process-markdown-text(raw-text, base-h: 0, embed-headings: true, embed-offset: 1) = {
  let lines = raw-text.split("\n")
  let out-lines = ()
  let current-h = base-h
  let in-code-block = false
  let in-exclude-block = false

  for line in lines {
    let trimmed = line.trim()

    if trimmed.starts-with("<!--typst-begin-exclude-->") {
      in-exclude-block = true
    }
    if in-exclude-block {
      if trimmed.ends-with("<!--typst-end-exclude-->") or trimmed.contains("<!--typst-end-exclude-->") {
        in-exclude-block = false
      }
      out-lines.push(line)
      continue
    }

    if trimmed.starts-with("```") or trimmed.starts-with("~~~") {
      in-code-block = not in-code-block
      out-lines.push(line)
      continue
    }
    if in-code-block {
      out-lines.push(line)
      continue
    }

    let h-match = line.match(regex("^ *(#{1,6}) +"))
    if h-match != none {
      current-h = h-match.captures.at(0).len()
      out-lines.push(line)
      continue
    }

    let embed-match = line.match(regex("!\[(.*?)\]\((?:<)?([^>\)]+?\.(?:md|markdown))(?:>)?\)"))
    if embed-match != none {
      let alt-title = embed-match.captures.at(0).trim()
      let target-path = embed-match.captures.at(1).trim()
      let clean-path = if target-path.starts-with("/") { target-path.slice(1) } else { target-path }

      let file-title = clean-path.split("/").last().split("\\").last().split(".").slice(0, -1).join(".")
      let display-title = if alt-title != "" { alt-title } else { file-title }
      let embed-raw = read(clean-path)
      let embed-min-h = get-min-heading-level(embed-raw)

      if current-h == 0 {
        let target-embed-h = 1
        if embed-headings {
          let heading-line = ("#" * target-embed-h) + " " + display-title + "\n\n"
          let child-target-h = calc.min(target-embed-h + (if embed-offset > 0 { 1 } else { 0 }), 6)
          let shift-amount = child-target-h - embed-min-h
          let shifted-body = shift-markdown-headings(embed-raw, shift-amount)

          let processed-sub = process-markdown-text(
            shifted-body,
            base-h: target-embed-h,
            embed-headings: embed-headings,
            embed-offset: embed-offset,
          )
          out-lines.push(heading-line + processed-sub)
        } else {
          let shift-amount = target-embed-h - embed-min-h
          let shifted-body = shift-markdown-headings(embed-raw, shift-amount)

          let processed-sub = process-markdown-text(
            shifted-body,
            base-h: 0,
            embed-headings: embed-headings,
            embed-offset: embed-offset,
          )
          out-lines.push(processed-sub)
        }
      } else {
        let target-embed-h = calc.min(calc.max(current-h + embed-offset, 1), 6)
        if embed-headings {
          let heading-line = ("#" * target-embed-h) + " " + display-title + "\n\n"
          let child-target-h = calc.min(target-embed-h + (if embed-offset > 0 { 1 } else { 0 }), 6)
          let shift-amount = child-target-h - embed-min-h
          let shifted-body = shift-markdown-headings(embed-raw, shift-amount)

          let processed-sub = process-markdown-text(
            shifted-body,
            base-h: target-embed-h,
            embed-headings: embed-headings,
            embed-offset: embed-offset,
          )
          out-lines.push(heading-line + processed-sub)
        } else {
          let shift-amount = target-embed-h - embed-min-h
          let shifted-body = shift-markdown-headings(embed-raw, shift-amount)

          let processed-sub = process-markdown-text(
            shifted-body,
            base-h: current-h,
            embed-headings: embed-headings,
            embed-offset: embed-offset,
          )
          out-lines.push(processed-sub)
        }
      }
      continue
    }

    out-lines.push(line)
  }

  out-lines.join("\n")
}

#let render_markdown(..args) = {
  let file-headings = args.named().at("file-headings", default: false)
  let embed-headings = args.named().at("embed-headings", default: true)
  let embed-offset = args.named().at("embed-offset", default: 1)
  let auto-pagebreak = args.named().at("auto-pagebreak", default: true)
  let files = args.pos()

  let process_file(path) = {
    let filename = path.split("/").last().split("\\").last()
    let title = filename.split(".").slice(0, -1).join(".")
    let raw-content = read(path)

    let initial-text = if file-headings {
      "# " + title + "\n\n" + raw-content
    } else {
      raw-content
    }

    let expanded = process-markdown-text(
      initial-text,
      base-h: if file-headings { 1 } else { 0 },
      embed-headings: embed-headings,
      embed-offset: embed-offset,
    )

    parse-obsidian-callouts(expanded)
  }

  let combined_md = files.map(process_file).join("\n<!--raw-typst #pagebreak(weak: true)-->\n")

  let rendered = cmarker.render(
    combined_md,
    html: (
      callout: (attrs, body) => render-callout(attrs, body),
    ),
    scope: (
      image: (source, ..args) => image(source, ..args),
    ),
  )

  if auto-pagebreak {
    show heading.where(level: 1): it => {
      pagebreak(weak: true)
      it
    }
    rendered
  } else {
    rendered
  }
}
