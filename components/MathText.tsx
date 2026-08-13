import katex from "katex";

interface MathTextProps {
  text: string;
  className?: string;
}

/**
 * Renders inline LaTeX delimited by $...$ via KaTeX, leaving everything
 * else as plain text. Pure function of `text` — safe as a server component,
 * no hydration risk.
 */
export default function MathText({ text, className = "" }: MathTextProps) {
  const parts = text.split(/(\$[^$]+\$)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          try {
            const html = katex.renderToString(part.slice(1, -1), {
              throwOnError: false,
              displayMode: false,
            });
            // eslint-disable-next-line react/no-danger
            return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch {
            return <span key={i}>{part}</span>;
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
