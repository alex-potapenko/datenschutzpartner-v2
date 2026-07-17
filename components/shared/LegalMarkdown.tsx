import Link from 'next/link';
import { type ReactNode } from 'react';

type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: ListItem[] };

type ListItem = {
  text: string;
  children: ListItem[];
};

function parseListItems(lines: string[]): ListItem[] {
  const items: ListItem[] = [];
  const stack: { indent: number; item: ListItem }[] = [];

  for (const line of lines) {
    const match = line.match(/^(\s*)\*\s+(.*)$/);
    if (!match) continue;

    const indent = match[1]?.replace(/\t/g, '  ').length ?? 0;
    const item: ListItem = { text: match[2] ?? '', children: [] };

    while (stack.length > 0 && (stack.at(-1)?.indent ?? 0) >= indent) {
      stack.pop();
    }

    if (stack.length === 0) {
      items.push(item);
    } else {
      stack.at(-1)?.item.children.push(item);
    }

    stack.push({ indent, item });
  }

  return items;
}

function parseMarkdown(source: string): Block[] {
  const blocks: Block[] = [];
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? '';

    if (line.trim() === '') {
      index += 1;
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1]?.length as 1 | 2 | 3,
        text: headingMatch[2] ?? '',
      });
      index += 1;
      continue;
    }

    if (/^\s*\*\s+/.test(line)) {
      const listLines: string[] = [];
      while (index < lines.length && /^\s*\*\s+/.test(lines[index] ?? '')) {
        listLines.push(lines[index] ?? '');
        index += 1;
      }
      blocks.push({ type: 'list', items: parseListItems(listLines) });
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      index < lines.length &&
      (lines[index] ?? '').trim() !== '' &&
      !/^(#{1,3})\s+/.test(lines[index] ?? '') &&
      !/^\s*\*\s+/.test(lines[index] ?? '')
    ) {
      paragraphLines.push(lines[index] ?? '');
      index += 1;
    }

    blocks.push({ type: 'paragraph', text: paragraphLines.join('\n') });
  }

  return blocks;
}

function slugifyHeading(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const pattern =
    /(\*\*[^*]+\*\*|_[^_]+_|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s)]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let matchIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const token = match[0];
    const start = match.index;

    if (start > lastIndex) {
      nodes.push(
        <span key={`${keyPrefix}-text-${matchIndex}`}>{text.slice(lastIndex, start)}</span>
      );
    }

    const key = `${keyPrefix}-${matchIndex}`;
    matchIndex += 1;

    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('_') && token.endsWith('_')) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith('[')) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const href = linkMatch[2] ?? '#';
        const label = linkMatch[1] ?? href;
        const external = href.startsWith('http');
        nodes.push(
          <Link
            key={key}
            href={href}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {label}
          </Link>
        );
      } else {
        nodes.push(<span key={key}>{token}</span>);
      }
    } else if (token.includes('@') && !token.startsWith('http')) {
      nodes.push(
        <Link key={key} href={`mailto:${token}`}>
          {token}
        </Link>
      );
    } else {
      nodes.push(
        <Link key={key} href={token} target="_blank" rel="noopener noreferrer">
          {token}
        </Link>
      );
    }

    lastIndex = start + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(<span key={`${keyPrefix}-tail`}>{text.slice(lastIndex)}</span>);
  }

  return nodes.length > 0 ? nodes : [<span key={`${keyPrefix}-only`}>{text}</span>];
}

function renderList(items: ListItem[], keyPrefix: string) {
  return (
    <ul className="text-foreground list-disc space-y-2 pl-5">
      {items.map((item, index) => (
        <li key={`${keyPrefix}-${index}`} className="leading-relaxed">
          {renderInline(item.text, `${keyPrefix}-${index}`)}
          {item.children.length > 0 ? renderList(item.children, `${keyPrefix}-${index}-sub`) : null}
        </li>
      ))}
    </ul>
  );
}

function visibleMarkdownBlocks(blocks: Block[], skipFirstHeading: boolean) {
  if (!skipFirstHeading) {
    return blocks;
  }

  let skipped = false;
  return blocks.filter((block) => {
    if (!skipped && block.type === 'heading' && block.level === 1) {
      skipped = true;
      return false;
    }
    return true;
  });
}

function renderParagraph(text: string, key: string) {
  const parts = text.split('\n');
  const children: ReactNode[] = [];

  parts.forEach((part, index) => {
    if (index > 0) {
      children.push(<br key={`${key}-br-${index}`} />);
    }
    children.push(...renderInline(part, `${key}-${index}`));
  });

  return (
    <p key={key} className="text-foreground leading-relaxed">
      {children}
    </p>
  );
}

export function LegalMarkdown({
  source,
  skipFirstHeading = false,
}: {
  source: string;
  skipFirstHeading?: boolean;
}) {
  const blocks = parseMarkdown(source);
  const visibleBlocks = visibleMarkdownBlocks(blocks, skipFirstHeading);

  return (
    <article className="flex flex-col gap-6">
      {visibleBlocks.map((block, index) => {
        const key = `block-${index}`;

        if (block.type === 'heading') {
          if (block.level === 1) {
            return (
              <h1 key={key} className="text-foreground text-2xl font-bold sm:text-3xl">
                {renderInline(block.text, key)}
              </h1>
            );
          }

          if (block.level === 2) {
            return (
              <h2
                key={key}
                id={slugifyHeading(block.text)}
                className="text-foreground mt-4 scroll-mt-24 text-xl font-semibold"
              >
                {renderInline(block.text, key)}
              </h2>
            );
          }

          return (
            <h3
              key={key}
              id={slugifyHeading(block.text)}
              className="text-foreground mt-2 scroll-mt-24 text-lg font-semibold"
            >
              {renderInline(block.text, key)}
            </h3>
          );
        }

        if (block.type === 'list') {
          return <div key={key}>{renderList(block.items, key)}</div>;
        }

        return renderParagraph(block.text, key);
      })}
    </article>
  );
}
