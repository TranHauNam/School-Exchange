import type { ReactNode } from 'react';

interface PageHeadProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHead({ eyebrow, title, description, actions }: PageHeadProps) {
  return (
    <section className="page-head">
      <div className="stack">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="row">{actions}</div> : null}
    </section>
  );
}
