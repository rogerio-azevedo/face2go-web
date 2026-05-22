import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type LegalDocumentMarkdownProps = {
  content: string;
};

export function LegalDocumentMarkdown({ content }: LegalDocumentMarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-brand-deep-navy mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-brand-deep-navy mt-10 mb-4 border-b border-slate-200 pb-2 text-xl font-semibold sm:text-2xl">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-brand-deep-navy mt-6 mb-3 text-lg font-semibold">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="text-brand-slate mb-4 text-base leading-7">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="text-brand-slate mb-4 list-disc space-y-2 pl-6">
            {children}
          </ul>
        ),
        li: ({ children }) => <li className="leading-7">{children}</li>,
        strong: ({ children }) => (
          <strong className="text-brand-deep-navy font-semibold">{children}</strong>
        ),
        hr: () => <hr className="my-8 border-slate-200" />,
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-brand-turquoise font-medium underline underline-offset-2 hover:text-brand-deep-navy"
            target={href?.startsWith('http') ? '_blank' : undefined}
            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
