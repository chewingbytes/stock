"use client";

import { useMemo, useState } from "react";
import { glossaryTerms } from "../domain/glossaryTerms";

export function GlossaryPanel() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const visibleTerms = useMemo(() => {
    if (!normalizedQuery) {
      return glossaryTerms;
    }

    return glossaryTerms.filter((term) =>
      [term.term, term.category, term.definition, term.example, term.caution]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery)),
    );
  }, [normalizedQuery]);

  return (
    <section className="panel glossary-panel" aria-labelledby="glossary-title">
      <div className="panel-title glossary-header">
        <div>
          <p className="eyebrow">Terminology</p>
          <h2 id="glossary-title">Glossary</h2>
        </div>
        <label className="glossary-search">
          <span>Search terminology</span>
          <input
            aria-label="Search terminology"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search terms"
          />
        </label>
      </div>

      <div className="glossary-list">
        {visibleTerms.length > 0 ? (
          visibleTerms.map((term) => (
            <article className="glossary-term" key={term.term}>
              <div>
                <h3>{term.term}</h3>
                <span>{term.category}</span>
              </div>
              <p>{term.definition}</p>
              {term.example ? <p className="glossary-detail">{term.example}</p> : null}
              {term.caution ? (
                <p className="glossary-detail warning">{term.caution}</p>
              ) : null}
            </article>
          ))
        ) : (
          <p className="empty-cell">No glossary terms match your search.</p>
        )}
      </div>
    </section>
  );
}
