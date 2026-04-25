import { forwardRef } from 'react';
import type { ParsedResumeJson } from '@/hooks/useResumes';

interface Props {
  data: ParsedResumeJson;
}

const CVPreview = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const contactParts = [
    data.email,
    data.phone,
    data.location,
    data.linkedin,
  ].filter(Boolean);

  return (
    <div
      ref={ref}
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '18mm 20mm',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '10pt',
        color: '#111111',
        backgroundColor: '#ffffff',
        boxSizing: 'border-box',
        lineHeight: 1.4,
      }}
    >
      {/* ─── Header ─────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: '12px', paddingBottom: '10px', borderBottom: '2px solid #111111' }}>
        <h1 style={{ fontSize: '20pt', fontWeight: 'bold', margin: '0 0 4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          {data.name || 'Votre Nom'}
        </h1>
        {data.title && (
          <p style={{ fontSize: '11pt', margin: '0 0 6px', color: '#333333' }}>
            {data.title}
          </p>
        )}
        {contactParts.length > 0 && (
          <p style={{ fontSize: '9pt', margin: 0, color: '#444444' }}>
            {contactParts.join(' · ')}
          </p>
        )}
      </div>

      {/* ─── Summary ────────────────────────────────── */}
      {data.summary && (
        <section style={{ marginBottom: '12px' }}>
          <SectionTitle>Summary</SectionTitle>
          <p style={{ margin: 0, fontSize: '9.5pt', lineHeight: 1.55, color: '#222222' }}>
            {data.summary}
          </p>
        </section>
      )}

      {/* ─── Skills ─────────────────────────────────── */}
      {data.skills && data.skills.length > 0 && (
        <section style={{ marginBottom: '12px' }}>
          <SectionTitle>Skills</SectionTitle>
          <p style={{ margin: 0, fontSize: '9.5pt', lineHeight: 1.55, color: '#222222' }}>
            {data.skills.join(' · ')}
          </p>
        </section>
      )}

      {/* ─── Experience ─────────────────────────────── */}
      {data.experiences && data.experiences.length > 0 && (
        <section style={{ marginBottom: '12px' }}>
          <SectionTitle>Experience</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.experiences.map((exp, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', fontSize: '10pt' }}>{exp.role || '—'}</span>
                    {exp.company && (
                      <span style={{ fontSize: '9.5pt', color: '#333333' }}> — {exp.company}</span>
                    )}
                  </div>
                  {(exp.startDate || exp.endDate) && (
                    <span style={{ fontSize: '9pt', color: '#555555', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                      {exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}
                    </span>
                  )}
                </div>
                {exp.bullets.filter((b) => b.trim()).length > 0 && (
                  <ul style={{ margin: '4px 0 0 16px', padding: 0, listStyleType: 'disc' }}>
                    {exp.bullets.filter((b) => b.trim()).map((b, j) => (
                      <li key={j} style={{ fontSize: '9.5pt', color: '#222222', marginBottom: '2px', lineHeight: 1.5 }}>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Education ──────────────────────────────── */}
      {data.education && data.education.length > 0 && (
        <section style={{ marginBottom: '12px' }}>
          <SectionTitle>Education</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.education.map((edu, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontWeight: 'bold', fontSize: '10pt' }}>{edu.institution}</span>
                  {edu.degree && (
                    <span style={{ fontSize: '9.5pt', color: '#333333' }}> — {edu.degree}</span>
                  )}
                </div>
                {edu.year && (
                  <span style={{ fontSize: '9pt', color: '#555555', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                    {edu.year}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Empty state ────────────────────────────── */}
      {!data.name && !data.summary && !(data.experiences?.length) && !(data.skills?.length) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', color: '#aaaaaa', fontSize: '11pt' }}>
          Remplissez les champs à gauche pour voir l&apos;aperçu ATS
        </div>
      )}
    </div>
  );
});

CVPreview.displayName = 'CVPreview';
export { CVPreview };

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '6px' }}>
      <h2 style={{
        fontSize: '10pt',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        margin: '0 0 3px',
        color: '#111111',
      }}>
        {children}
      </h2>
      <div style={{ height: '1px', backgroundColor: '#111111' }} />
    </div>
  );
}
