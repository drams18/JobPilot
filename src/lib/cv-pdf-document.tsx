import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ParsedResumeJson } from '@/hooks/useResumes';

const BLACK = '#111111';
const DARK = '#222222';
const MID = '#333333';
const MUTED = '#555555';
const WHITE = '#ffffff';

const s = StyleSheet.create({
  page: {
    flexDirection: 'column',
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: WHITE,
    paddingHorizontal: 50,
    paddingVertical: 45,
    color: BLACK,
  },

  // Header
  header: { alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: BLACK },
  name: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: BLACK, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 1 },
  jobTitle: { fontSize: 11, color: MID, marginBottom: 5 },
  contact: { fontSize: 9, color: MUTED },

  // Sections
  section: { marginBottom: 13 },
  sectionHeader: { marginBottom: 5 },
  sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1, color: BLACK, marginBottom: 3 },
  sectionDivider: { height: 1, backgroundColor: BLACK },

  // Summary
  summaryText: { fontSize: 9.5, color: DARK, lineHeight: 1.55 },

  // Skills
  skillsText: { fontSize: 9.5, color: DARK, lineHeight: 1.55 },

  // Experience
  expBlock: { marginBottom: 9 },
  expHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 },
  expLeft: { flex: 1 },
  expRole: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: BLACK },
  expCompany: { fontSize: 9.5, color: MID },
  expDates: { fontSize: 9, color: MUTED, fontFamily: 'Helvetica-Oblique' },
  bullet: { fontSize: 9.5, color: DARK, marginBottom: 2, paddingLeft: 12, lineHeight: 1.5 },

  // Education
  eduRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 7 },
  eduLeft: { flex: 1 },
  eduInstitution: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: BLACK },
  eduDegree: { fontSize: 9.5, color: MID },
  eduYear: { fontSize: 9, color: MUTED, fontFamily: 'Helvetica-Oblique' },
});

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionDivider} />
    </View>
  );
}

export function CVPdfDocument({ data }: { data: ParsedResumeJson }) {
  const contactParts = [data.email, data.phone, data.location, data.linkedin].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.name}>{data.name || 'Votre Nom'}</Text>
          {data.title && <Text style={s.jobTitle}>{data.title}</Text>}
          {contactParts.length > 0 && (
            <Text style={s.contact}>{contactParts.join(' · ')}</Text>
          )}
        </View>

        {/* Summary */}
        {data.summary && (
          <View style={s.section}>
            <SectionHeader title="Summary" />
            <Text style={s.summaryText}>{data.summary}</Text>
          </View>
        )}

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <View style={s.section}>
            <SectionHeader title="Skills" />
            <Text style={s.skillsText}>{data.skills.join(' · ')}</Text>
          </View>
        )}

        {/* Experience */}
        {data.experiences && data.experiences.length > 0 && (
          <View style={s.section}>
            <SectionHeader title="Experience" />
            {data.experiences.map((exp, i) => (
              <View key={i} style={s.expBlock}>
                <View style={s.expHeader}>
                  <View style={s.expLeft}>
                    <Text style={s.expRole}>{exp.role || '—'}</Text>
                    {exp.company && <Text style={s.expCompany}>{exp.company}</Text>}
                  </View>
                  {(exp.startDate || exp.endDate) && (
                    <Text style={s.expDates}>
                      {exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}
                    </Text>
                  )}
                </View>
                {exp.bullets?.filter((b) => b.trim()).map((b, j) => (
                  <Text key={j} style={s.bullet}>• {b}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <View style={s.section}>
            <SectionHeader title="Education" />
            {data.education.map((edu, i) => (
              <View key={i} style={s.eduRow}>
                <View style={s.eduLeft}>
                  <Text style={s.eduInstitution}>{edu.institution}</Text>
                  {edu.degree && <Text style={s.eduDegree}>{edu.degree}</Text>}
                </View>
                {edu.year && <Text style={s.eduYear}>{edu.year}</Text>}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
