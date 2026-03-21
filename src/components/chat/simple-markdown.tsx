"use client";

import React from "react";

/**
 * Lightweight markdown renderer — no external deps, Turbopack-safe.
 * Supports: **bold**, *italic*, [links](url), `code`, lists, headings, blockquotes.
 */
export function SimpleMarkdown({ content, className, showCursor }: { content: string; className?: string; showCursor?: boolean }) {
  const blocks = parseBlocks(content);

  let renderedBlocks = blocks;
  if (showCursor && blocks.length > 0) {
    const cursor = <span key="__cursor" className="streaming-cursor" />;
    const lastIdx = blocks.length - 1;
    const last = blocks[lastIdx] as React.ReactElement;
    // Inject cursor inline inside the last block (usually <p>) so it sits on the same line as text
    renderedBlocks = [
      ...blocks.slice(0, lastIdx),
      React.cloneElement(last, { key: last.key ?? lastIdx }, last.props.children, cursor),
    ];
  }

  return (
    <div className={className} dir="auto">
      {renderedBlocks}
    </div>
  );
}

function parseBlocks(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line → spacing
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const cls = level === 1
        ? "text-[16px] font-bold mb-1.5 mt-3 first:mt-0 text-[var(--text-primary)]"
        : level === 2
        ? "text-[15px] font-bold mb-1 mt-2.5 first:mt-0 text-[var(--text-primary)]"
        : "text-[14px] font-semibold mb-1 mt-2 first:mt-0 text-[var(--text-primary)]";
      nodes.push(
        React.createElement(`h${level}`, { key: key++, className: cls }, parseInline(text))
      );
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <blockquote
          key={key++}
          className="border-l-2 pl-3 italic my-1.5 text-[14px]"
          style={{
            borderColor: "var(--border-subtle)",
            color: "var(--text-secondary)",
          }}
        >
          {parseInline(quoteLines.join(" "))}
        </blockquote>
      );
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      nodes.push(
        <ul key={key++} className="list-disc list-inside mb-2 space-y-1 pl-1">
          {items.map((item, j) => (
            <li key={j} className="leading-relaxed text-[var(--text-primary)]">
              {parseInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      nodes.push(
        <ol key={key++} className="list-decimal list-inside mb-2 space-y-1 pl-1">
          {items.map((item, j) => (
            <li key={j} className="leading-relaxed text-[var(--text-primary)]">
              {parseInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Paragraph — collect consecutive non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].match(/^#{1,3}\s/) &&
      !lines[i].startsWith("> ") &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      nodes.push(
        <p key={key++} className="mb-2 last:mb-0">{parseInline(paraLines.join("\n"))}</p>
      );
    }
  }

  return nodes;
}

function parseInline(text: string): React.ReactNode {
  // Split by inline patterns, build React nodes
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Italic: *text* (but not **)
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
    // Inline code: `text`
    const codeMatch = remaining.match(/`([^`]+)`/);
    // Link: [text](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

    // Find earliest match
    const matches = [
      boldMatch ? { type: "bold", match: boldMatch } : null,
      italicMatch ? { type: "italic", match: italicMatch } : null,
      codeMatch ? { type: "code", match: codeMatch } : null,
      linkMatch ? { type: "link", match: linkMatch } : null,
    ]
      .filter(Boolean)
      .sort((a, b) => a!.match.index! - b!.match.index!) as Array<{
      type: string;
      match: RegExpMatchArray;
    }>;

    if (matches.length === 0) {
      // No more patterns, push rest as text (handle \n)
      parts.push(...splitNewlines(remaining, key));
      break;
    }

    const first = matches[0];
    const idx = first.match.index!;

    // Text before match
    if (idx > 0) {
      parts.push(...splitNewlines(remaining.slice(0, idx), key));
      key += 2;
    }

    if (first.type === "bold") {
      parts.push(<strong key={key++} className="font-semibold">{first.match[1]}</strong>);
    } else if (first.type === "italic") {
      parts.push(
        <em key={key++} style={{ color: "var(--text-secondary)" }}>
          {first.match[1]}
        </em>
      );
    } else if (first.type === "code") {
      parts.push(
        <code
          key={key++}
          className="rounded px-1.5 py-0.5 text-[12px] font-mono"
          style={{
            background: "var(--bg-surface-raised)",
            color: "var(--accent-primary)",
          }}
        >
          {first.match[1]}
        </code>
      );
    } else if (first.type === "link") {
      parts.push(
        <a
          key={key++}
          href={first.match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 transition-colors"
          style={{ color: "var(--accent-primary)" }}
        >
          {first.match[1]}
        </a>
      );
    }

    remaining = remaining.slice(idx + first.match[0].length);
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

function splitNewlines(text: string, startKey: number): React.ReactNode[] {
  const segments = text.split("\n");
  const result: React.ReactNode[] = [];
  segments.forEach((seg, i) => {
    if (i > 0) result.push(<br key={`br-${startKey}-${i}`} />);
    if (seg) result.push(seg);
  });
  return result;
}
