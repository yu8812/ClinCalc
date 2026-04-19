import React from "react";

// Renders simple markdown used by Gemini responses:
// 【Header】 → styled section title
// **bold** → accent-colored bold
// Plain lines → paragraph rows
export function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");

  return lines.map((line, i) => {
    // Section header 【...】
    const headerMatch = line.match(/^【(.+?)】/);
    if (headerMatch) {
      const rest = line.slice(headerMatch[0].length).trim();
      return (
        <div key={i} className="mt-4 mb-1 flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
          >
            {headerMatch[1]}
          </span>
          {rest && <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{rest}</span>}
        </div>
      );
    }

    // Empty line
    if (!line.trim()) {
      return <div key={i} style={{ height: "0.4em" }} />;
    }

    // Bullet points (lines starting with * or - or numbers like 1. 2.)
    const bulletMatch = line.match(/^(\*|-|\d+\.)\s+(.+)/);
    if (bulletMatch) {
      return (
        <div key={i} className="flex gap-2 my-0.5 pl-1">
          <span style={{ color: "var(--accent)", flexShrink: 0, marginTop: "1px" }}>•</span>
          <span style={{ color: "var(--text-secondary)" }}>
            {renderInline(bulletMatch[2])}
          </span>
        </div>
      );
    }

    // Regular line with possible inline bold
    return (
      <div key={i} className="my-0.5" style={{ color: "var(--text-secondary)" }}>
        {renderInline(line)}
      </div>
    );
  });
}

function renderInline(text: string): React.ReactNode {
  // Split on **bold** markers
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} style={{ color: "var(--text-primary)", fontWeight: 600 }}>
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}
