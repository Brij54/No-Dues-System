import { useEffect, useState, useMemo } from 'react';
import { Search, Download, FileText } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Drawer from '../../components/ui/Drawer';
import Button from '../../components/ui/Button';
import { feedbackApi } from '../../api/feedback.api';
import type { FeedbackRecord } from '../../api/feedback.api';
import type { ColDef } from 'ag-grid-community';
import toast from 'react-hot-toast';

// ─── Rating display helpers ───────────────────────────────────────────────────

const RATING_COLOR: Record<string, { bg: string; text: string }> = {
  'Excellent':                          { bg: '#ecfdf5', text: '#059669' },
  'Very Good':                          { bg: '#eff6ff', text: '#2563eb' },
  'Good':                               { bg: '#f0fdf4', text: '#16a34a' },
  'Average':                            { bg: '#fffbeb', text: '#d97706' },
  'Poor':                               { bg: '#fef2f2', text: '#dc2626' },
  'Facility not used / Not applicable': { bg: '#f8fafc', text: '#94a3b8' },
};

function RatingBadge({ value }: { value: string }) {
  const style = RATING_COLOR[value] ?? { bg: '#f8fafc', text: '#64748b' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 600,
      background: style.bg,
      color: style.text,
    }}>
      {value}
    </span>
  );
}

// ─── Rating sections matching the student form layout ────────────────────────

const RATING_SECTIONS = [
  {
    title: 'Academic Experience & Mentorship',
    fields: [
      { key: 'academicContent',       label: 'Academic Content' },
      { key: 'interactionFaculty',    label: 'Interaction with Faculty' },
      { key: 'fairnessEvaluation',    label: 'Fairness of Evaluation' },
      { key: 'mentorshipHandholding', label: 'Mentorship & Handholding by Faculty' },
      { key: 'counsellingServices',   label: 'Counselling Services' },
    ],
  },
  {
    title: 'Campus Infrastructure & Resources',
    fields: [
      { key: 'libraryFacilities',     label: 'Library Facilities' },
      { key: 'labResearchFacilities', label: 'Lab & Research Facilities' },
      { key: 'itWifiFacilities',      label: 'IT & WiFi Facilities' },
      { key: 'hostelFacilities',      label: 'Hostel Facilities' },
      { key: 'recreationalFacilities',label: 'Recreational Facilities' },
      { key: 'foodCourtCatering',     label: 'Food Court & Catering' },
    ],
  },
  {
    title: 'Student Activities & Careers',
    fields: [
      { key: 'extraCurricular',       label: 'Extra-Curricular Activities' },
      { key: 'sportsFacilities',      label: 'Sports Facilities' },
      { key: 'placementFacilities',   label: 'Placement Facilities' },
    ],
  },
  {
    title: 'Administration, Support & Campus Environment',
    fields: [
      { key: 'interactionAdministration', label: 'Interaction with Administration' },
      { key: 'campusEnvironment',         label: 'Campus Environment' },
      { key: 'overallCampus',             label: 'Overall Campus' },
      { key: 'healthCareFacilities',      label: 'Health Care Facilities' },
      { key: 'governance',                label: 'Governance' },
      { key: 'handlePandemic',            label: 'Institute Handling of Pandemic' },
    ],
  },
] as const;

// ─── CSV export helpers ───────────────────────────────────────────────────────

const CSV_HEADERS = [
  'Roll Number', 'Student Name', 'Email', 'Mobile', 'Program',
  'Future Email', 'Future Address',
  'Academic Content', 'Interaction with Faculty', 'Fairness of Evaluation',
  'Mentorship & Handholding', 'Counselling Services',
  'Library Facilities', 'Lab & Research Facilities', 'IT & WiFi Facilities',
  'Hostel Facilities', 'Recreational Facilities', 'Food Court & Catering',
  'Extra-Curricular', 'Sports Facilities', 'Placement Facilities',
  'Interaction with Administration', 'Campus Environment', 'Overall Campus',
  'Health Care Facilities', 'Governance', 'Handling of Pandemic',
  'Suggestions', 'Submitted At',
];

function formatSubmittedAt(value: string | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function feedbackToRow(f: FeedbackRecord): string[] {
  const esc = (v: string | undefined) => `"${(v ?? '').replace(/"/g, '""')}"`;
  return [
    esc(f.rollNumber), esc(f.studentName), esc(f.email), esc(f.mobile), esc(f.program),
    esc(f.futureEmail), esc(f.futureAddress),
    esc(f.academicContent), esc(f.interactionFaculty), esc(f.fairnessEvaluation),
    esc(f.mentorshipHandholding), esc(f.counsellingServices),
    esc(f.libraryFacilities), esc(f.labResearchFacilities), esc(f.itWifiFacilities),
    esc(f.hostelFacilities), esc(f.recreationalFacilities), esc(f.foodCourtCatering),
    esc(f.extraCurricular), esc(f.sportsFacilities), esc(f.placementFacilities),
    esc(f.interactionAdministration), esc(f.campusEnvironment), esc(f.overallCampus),
    esc(f.healthCareFacilities), esc(f.governance), esc(f.handlePandemic),
    esc(f.suggestions), esc(formatSubmittedAt(f.submittedAt)),
  ];
}

function downloadCsv(filename: string, rows: string[][]) {
  const content = [CSV_HEADERS.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function FeedbackReviewPage() {
  const [feedbacks, setFeedbacks]               = useState<FeedbackRecord[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [search, setSearch]                     = useState('');
  const [selected, setSelected]                 = useState<FeedbackRecord | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await feedbackApi.getAll();
        setFeedbacks(res.data);
      } catch {
        toast.error('Failed to load feedback submissions');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const columnDefs = useMemo<ColDef<FeedbackRecord>[]>(() => [
    {
      headerName: 'Roll Number',
      field: 'rollNumber',
      minWidth: 140,
      cellStyle: { fontFamily: 'monospace', fontWeight: 500 },
    },
    {
      headerName: 'Student Name',
      field: 'studentName',
      minWidth: 180,
      cellStyle: { fontWeight: 500 },
    },
    {
      headerName: 'Email',
      field: 'email',
      minWidth: 220,
      cellStyle: { color: '#64748b' },
    },
    {
      headerName: 'Program',
      field: 'program',
      minWidth: 200,
    },
    {
      headerName: 'Submitted At',
      field: 'submittedAt',
      minWidth: 180,
      valueGetter: (p: any) => {
        const v = p.data?.submittedAt;
        if (!v) return '—';
        return new Date(v).toLocaleString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        });
      },
    },
    // {
    //   headerName: 'Action',
    //   minWidth: 140,
    //   sortable: false,
    //   filter: false,
    //   cellRenderer: (p: any) => (
    //     <button
    //       onClick={(e) => { e.stopPropagation(); downloadCsv(`feedback_${p.data?.rollNumber ?? 'student'}.csv`, [feedbackToRow(p.data)]); }}
    //       style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', cursor: 'pointer' }}
    //     >
    //       <span>⬇</span> Export
    //     </button>
    //   ),
    // },
  ], []);

  const handleExportAll = () => {
    if (feedbacks.length === 0) { toast.error('No feedback to export'); return; }
    downloadCsv('all_feedback.csv', feedbacks.map(feedbackToRow));
    toast.success(`Exported ${feedbacks.length} feedback submissions`);
  };

  const handleExportSelected = () => {
    if (!selected) return;
    downloadCsv(`feedback_${selected.rollNumber}.csv`, [feedbackToRow(selected)]);
    toast.success(`Exported feedback for ${selected.studentName}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Feedback</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {loading ? 'Loading…' : `${feedbacks.length} student${feedbacks.length !== 1 ? 's' : ''} submitted feedback`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, roll no, email…"
              className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-72 text-slate-900 dark:text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportAll}
            disabled={feedbacks.length === 0}
          >
            Export All
          </Button>
        </div>
      </div>

      {/* Main table */}
      <DataTable
        rowData={feedbacks}
        columnDefs={columnDefs}
        loading={loading}
        quickFilterText={search}
        onRowClick={(row) => setSelected(row)}
      />

      {/* Detail drawer */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Feedback Details"
        description={selected ? `${selected.studentName} · ${selected.rollNumber}` : undefined}
        size="lg"
        footer={
          <Button
            icon={<FileText className="w-4 h-4" />}
            onClick={handleExportSelected}
          >
            Export This Student
          </Button>
        }
      >
        {selected && (
          <div className="space-y-6 text-sm">

            {/* Student info */}
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Student Information
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[
                  ['Roll Number',    selected.rollNumber],
                  ['Name',           selected.studentName],
                  ['Institute Email',selected.email],
                  ['Mobile',         selected.mobile],
                  ['Program',        selected.program],
                  ['Future Email',   selected.futureEmail],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200 break-words">{value}</p>
                  </div>
                ))}
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 mb-0.5">Future Address</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{selected.futureAddress}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Submitted At</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    {new Date(selected.submittedAt).toLocaleString('en-IN', {
                      day: '2-digit', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </section>

            <div className="border-t border-slate-100 dark:border-slate-700" />

            {/* Rating sections */}
            {RATING_SECTIONS.map((section) => (
              <section key={section.title}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  {section.title}
                </h3>
                <div className="space-y-2">
                  {section.fields.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between gap-4 py-1.5 border-b border-slate-50 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-300 text-sm">{label}</span>
                      <RatingBadge value={(selected as any)[key] ?? '—'} />
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* Suggestions */}
            {selected.suggestions && (
              <>
                <div className="border-t border-slate-100 dark:border-slate-700" />
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Suggestions for Improvement
                  </h3>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-sm">
                    {selected.suggestions}
                  </p>
                </section>
              </>
            )}

          </div>
        )}
      </Drawer>
    </div>
  );
}
