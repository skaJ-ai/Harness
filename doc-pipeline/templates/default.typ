// Typst Document Template for HARP
// MD → PDF 변환 시 사용되는 기본 템플릿
// Usage: typst compile input.typ output.pdf

#set document(
  title: "Document Title",
  author: "Team Name",
)

#set page(
  paper: "a4",
  margin: (top: 2.5cm, bottom: 2.5cm, left: 2.5cm, right: 2.5cm),
  header: context {
    if counter(page).get().first() > 1 [
      #set text(size: 9pt, fill: gray)
      _HARP_ #h(1fr) #counter(page).display()
    ]
  },
  footer: context {
    if counter(page).get().first() > 1 [
      #set text(size: 8pt, fill: gray)
      #line(length: 100%, stroke: 0.5pt + gray)
      #v(4pt)
      Confidential #h(1fr) Generated via HARP Doc Pipeline
    ]
  },
)

#set text(
  font: ("Pretendard", "Noto Sans KR", "sans-serif"),
  size: 10pt,
  lang: "ko",
)

#set heading(numbering: "1.1")

#show heading.where(level: 1): it => {
  v(12pt)
  text(size: 18pt, weight: "bold", fill: rgb("#1a1a2e"))[#it]
  v(6pt)
  line(length: 100%, stroke: 2pt + rgb("#1a1a2e"))
  v(8pt)
}

#show heading.where(level: 2): it => {
  v(10pt)
  text(size: 14pt, weight: "bold", fill: rgb("#16213e"))[#it]
  v(4pt)
}

#show heading.where(level: 3): it => {
  v(8pt)
  text(size: 12pt, weight: "bold", fill: rgb("#0f3460"))[#it]
  v(2pt)
}

// Table styling
#set table(
  stroke: 0.5pt + gray,
  inset: 8pt,
)

#show table.cell.where(y: 0): set text(weight: "bold", fill: white)
#show table.cell.where(y: 0): set cell(fill: rgb("#1a1a2e"))

// Code block styling
#show raw.where(block: true): it => {
  set text(size: 9pt)
  block(
    fill: rgb("#f5f5f5"),
    inset: 12pt,
    radius: 4pt,
    width: 100%,
    it
  )
}

// Inline code styling
#show raw.where(block: false): it => {
  box(
    fill: rgb("#f0f0f0"),
    inset: (x: 4pt, y: 2pt),
    radius: 2pt,
    text(size: 9pt, it)
  )
}

// ─── CONTENT STARTS HERE ───
// Replace below with actual content or use #include

#align(center)[
  #v(80pt)
  #text(size: 28pt, weight: "bold", fill: rgb("#1a1a2e"))[Document Title]
  #v(12pt)
  #text(size: 14pt, fill: gray)[Project Name]
  #v(24pt)
  #text(size: 11pt)[
    Author Name \
    #datetime.today().display("[year]-[month]-[day]")
  ]
  #v(60pt)
]

#pagebreak()

#outline(title: "Table of Contents", indent: auto)

#pagebreak()

// ─── Document body goes here ───
// = Section Title
// == Subsection
// Content...
