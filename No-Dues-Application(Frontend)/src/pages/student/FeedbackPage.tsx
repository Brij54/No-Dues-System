import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { studentsApi } from '../../api/students.api';
import { feedbackApi, FeedbackRecord, FeedbackSubmission } from '../../api/feedback.api';
import type { Student } from '../../types/models';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { ClipboardList, CheckCircle2, MessageSquare, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/format';

interface Question {
  key: keyof FeedbackSubmission;
  label: string;
}

const PROGRAM_OPTIONS = [
  'Master of Technology',
  'Sponsored Master of Technology',
  'MSc in Digital Society',
  'Integrated Master of Technology',
  'Master of Science By Research',
  'Doctor of Philosophy'
];

const RATING_OPTIONS = [
  { value: 'Excellent', label: 'Excellent' },
  { value: 'Very Good', label: 'Very Good' },
  { value: 'Good', label: 'Good' },
  { value: 'Average', label: 'Average' },
  { value: 'Poor', label: 'Poor' },
  { value: 'Facility not used / Not applicable', label: 'N/A / Not Used' }
];

const FEEDBACK_SECTIONS = [
  {
    title: 'Academic Experience & Mentorship',
    description: 'Rate your academic curriculum, teaching quality, evaluation fairness, and counseling resources.',
    questions: [
      { key: 'academicContent', label: 'Academic Content' },
      { key: 'interactionFaculty', label: 'Interaction with Faculty' },
      { key: 'fairnessEvaluation', label: 'Fairness of Evaluation' },
      { key: 'mentorshipHandholding', label: 'Mentorship & Handholding by Faculty' },
      { key: 'counsellingServices', label: 'Counselling Services' }
    ] as Question[]
  },
  {
    title: 'Campus Infrastructure & Resources',
    description: 'Rate library materials, laboratory spaces, networking, accommodation, and food.',
    questions: [
      { key: 'libraryFacilities', label: 'Library facilities' },
      { key: 'labResearchFacilities', label: 'Laboratory & Research facilities' },
      { key: 'itWifiFacilities', label: 'IT & WiFi facilities' },
      { key: 'hostelFacilities', label: 'Hostel facilities' },
      { key: 'recreationalFacilities', label: 'Recreational facilities' },
      { key: 'foodCourtCatering', label: 'Food Court and catering' }
    ] as Question[]
  },
  {
    title: 'Student Activities & Careers',
    description: 'Rate student clubs, physical facilities, and career placement services.',
    questions: [
      { key: 'extraCurricular', label: 'Extra-curricular activities' },
      { key: 'sportsFacilities', label: 'Sports facilities' },
      { key: 'placementFacilities', label: 'Placement facilities' }
    ] as Question[]
  },
  {
    title: 'Administration, Support & Campus Environment',
    description: 'Rate campus community environment, overall infrastructure, governance, and administration services.',
    questions: [
      { key: 'interactionAdministration', label: 'Interaction with Administration' },
      { key: 'campusEnvironment', label: 'Campus Environment' },
      { key: 'overallCampus', label: 'Overall Campus' },
      { key: 'healthCareFacilities', label: 'Health Care facilities' },
      { key: 'governance', label: 'Governance' },
      { key: 'handlePandemic', label: 'How did the institute handle the Pandemic?' }
    ] as Question[]
  }
];

export default function FeedbackPage() {
  const { user } = useAuthStore();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<boolean>(false);
  const [existingFeedback, setExistingFeedback] = useState<FeedbackRecord | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Form State
  const [mobile, setMobile] = useState('');
  const [program, setProgram] = useState('');
  const [futureEmail, setFutureEmail] = useState('');
  const [futureAddress, setFutureAddress] = useState('');
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.sub) return;
    setLoading(true);
    try {
      // 1. Fetch duplicate feedback status
      const statusRes = await feedbackApi.checkStatus();
      if (statusRes.data.submitted) {
        setSubmittedStatus(true);
        const feedbackRes = await feedbackApi.get();
        setExistingFeedback(feedbackRes.data);
      } else {
        // 2. Load student detailed info to prefill
        const studentRes = await studentsApi.getProfile();
        setStudent(studentRes.data);
      }
    } catch {
      toast.error('Failed to load feedback details.');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (qKey: string, val: string) => {
    setRatings(prev => ({ ...prev, [qKey]: val }));
    if (errors[qKey]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[qKey];
        return copy;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Mobile Validation
    if (!mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(mobile.trim())) {
      newErrors.mobile = 'Mobile number must be exactly 10 digits';
    }

    // Program Validation
    if (!program) {
      newErrors.program = 'Please select your academic program';
    }

    // Future Email Validation
    if (!futureEmail.trim()) {
      newErrors.futureEmail = 'Future communication email is required';
    } else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/.test(futureEmail.trim())) {
      newErrors.futureEmail = 'Please enter a valid email address';
    }

    // Future Address Validation
    if (!futureAddress.trim()) {
      newErrors.futureAddress = 'Future communication address is required';
    }

    // Questions Validation
    FEEDBACK_SECTIONS.forEach(sec => {
      sec.questions.forEach(q => {
        if (!ratings[q.key as string]) {
          newErrors[q.key as string] = 'This question is required';
        }
      });
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error('Please complete all required fields and ratings.');
      
      // Scroll to the first error
      const firstErrorKey = Object.keys(newErrors)[0];
      const element = document.getElementById(`q-${firstErrorKey}`) || document.getElementById(`field-${firstErrorKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    return true;
  };

  const triggerConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowConfirm(true);
    }
  };

  const handleFinalSubmit = async () => {
    setShowConfirm(false);
    setIsSubmitting(true);

    const submissionData: FeedbackSubmission = {
      mobile: mobile.trim(),
      program,
      futureEmail: futureEmail.trim(),
      futureAddress: futureAddress.trim(),
      academicContent: ratings.academicContent,
      interactionFaculty: ratings.interactionFaculty,
      fairnessEvaluation: ratings.fairnessEvaluation,
      mentorshipHandholding: ratings.mentorshipHandholding,
      libraryFacilities: ratings.libraryFacilities,
      labResearchFacilities: ratings.labResearchFacilities,
      itWifiFacilities: ratings.itWifiFacilities,
      hostelFacilities: ratings.hostelFacilities,
      recreationalFacilities: ratings.recreationalFacilities,
      extraCurricular: ratings.extraCurricular,
      sportsFacilities: ratings.sportsFacilities,
      interactionAdministration: ratings.interactionAdministration,
      campusEnvironment: ratings.campusEnvironment,
      overallCampus: ratings.overallCampus,
      foodCourtCatering: ratings.foodCourtCatering,
      healthCareFacilities: ratings.healthCareFacilities,
      placementFacilities: ratings.placementFacilities,
      governance: ratings.governance,
      handlePandemic: ratings.handlePandemic,
      counsellingServices: ratings.counsellingServices,
      suggestions: suggestions.trim() || undefined
    };

    try {
      await feedbackApi.submit(submissionData);
      toast.success('Thank you! Your feedback has been submitted successfully.');
      await loadData();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to submit feedback. Please try again.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading student profile & feedback status...</p>
      </div>
    );
  }

  // Already Submitted screen
  if (submittedStatus && existingFeedback) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-indigo-600" />
            Feedback Form
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Feedback and evaluation details
          </p>
        </div>

        <Card className="border border-emerald-100 dark:border-emerald-950/30 overflow-hidden">
          <div className="bg-emerald-500/10 p-6 flex flex-col sm:flex-row items-center gap-4 border-b border-emerald-100 dark:border-emerald-950/20">
            <div className="p-3 bg-emerald-500 text-white rounded-full">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-lg font-bold text-emerald-800 dark:text-emerald-400">Feedback Already Submitted</h2>
              <p className="text-sm text-emerald-600/90 dark:text-emerald-500/90 mt-0.5">
                Thank you for sharing your feedback. Your submission is recorded.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Student Info Box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Name</span>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{existingFeedback.studentName}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Roll Number</span>
                <p className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{existingFeedback.rollNumber}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Email</span>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{existingFeedback.email}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Mobile</span>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{existingFeedback.mobile}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Program</span>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{existingFeedback.program}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Submitted At</span>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                  {existingFeedback.submittedAt ? formatDate(existingFeedback.submittedAt.split('T')[0]) : 'Recently'}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Future Communication Email</span>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{existingFeedback.futureEmail}</p>
              </div>
              <div className="md:col-span-3">
                <span className="text-[10px] uppercase font-bold text-slate-400">Future Communication Address</span>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5 bg-slate-100/50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-200/40 dark:border-slate-700/40">{existingFeedback.futureAddress}</p>
              </div>
            </div>

            {/* Suggestions summary */}
            {existingFeedback.suggestions && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Suggestions Provided</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 italic">
                  "{existingFeedback.suggestions}"
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-2xl p-6 md:p-8 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-white/10 blur-2xl z-0"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-white/20 mb-3 border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              Your Feedback Matters
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">Student Exit Survey</h1>
            <p className="text-indigo-100/90 text-sm mt-1 max-w-xl">
              Please take a few moments to fill this comprehensive campus feedback form. Your inputs directly influence administrative decisions.
            </p>
          </div>
          <div className="p-3 bg-white/15 rounded-xl border border-white/10 flex-shrink-0 self-start md:self-auto">
            <ClipboardList className="w-8 h-8" />
          </div>
        </div>
      </div>

      <form onSubmit={triggerConfirm} className="space-y-6">
        {/* Section 1: Prefilled Personal details */}
        <Card className="shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
            1. Student Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Input
              label="Roll Number (read-only)"
              value={student?.rollNumber || ''}
              disabled
              readOnly
              className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-mono"
            />
            <Input
              label="Full Name (read-only)"
              value={student?.name || ''}
              disabled
              readOnly
              className="bg-slate-50 dark:bg-slate-800/40 text-slate-500"
            />
            <Input
              label="Email Address (read-only)"
              value={student?.email || ''}
              disabled
              readOnly
              className="bg-slate-50 dark:bg-slate-800/40 text-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
            {/* Mobile entry */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={10}
                placeholder="Enter 10-digit mobile number"
                className={`w-full px-3.5 py-2 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-200
                  ${errors.mobile
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-800'
                    : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700'
                  }`}
                value={mobile}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, ''); // only digits
                  setMobile(val);
                  if (errors.mobile) {
                    setErrors(prev => {
                      const copy = { ...prev };
                      delete copy.mobile;
                      return copy;
                    });
                  }
                }}
              />
              {errors.mobile && (
                <p className="text-xs text-red-500 font-medium">{errors.mobile}</p>
              )}
            </div>

            {/* Program entry */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Academic Program <span className="text-red-500">*</span>
              </label>
              <select
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-200
                  ${errors.program
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-800'
                    : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700'
                  }`}
                value={program}
                onChange={(e) => {
                  setProgram(e.target.value);
                  if (errors.program) {
                    setErrors(prev => {
                      const copy = { ...prev };
                      delete copy.program;
                      return copy;
                    });
                  }
                }}
              >
                <option value="">Select Academic Program</option>
                {PROGRAM_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {errors.program && (
                <p className="text-xs text-red-500 font-medium">{errors.program}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5 border-t border-slate-100 dark:border-slate-700/60 pt-4">
            {/* Future Communication Email */}
            <div id="field-futureEmail" className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Future Communication Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="Enter email for future communication"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-200
                  \${errors.futureEmail
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-800'
                    : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700'
                  }`}
                value={futureEmail}
                onChange={(e) => {
                  setFutureEmail(e.target.value);
                  if (errors.futureEmail) {
                    setErrors(prev => {
                      const copy = { ...prev };
                      delete copy.futureEmail;
                      return copy;
                    });
                  }
                }}
              />
              {errors.futureEmail && (
                <p className="text-xs text-red-500 font-medium">{errors.futureEmail}</p>
              )}
            </div>

            {/* Future Communication Address */}
            <div id="field-futureAddress" className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Future Communication Address <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="Enter permanent/mailing address"
                className={`w-full px-3.5 py-2 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-200 resize-none
                  \${errors.futureAddress
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-800'
                    : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700'
                  }`}
                value={futureAddress}
                onChange={(e) => {
                  setFutureAddress(e.target.value);
                  if (errors.futureAddress) {
                    setErrors(prev => {
                      const copy = { ...prev };
                      delete copy.futureAddress;
                      return copy;
                    });
                  }
                }}
              />
              <p className="text-[11px] text-slate-400 italic">
                * Note: This address will be used by the institution for all future official correspondence and communications.
              </p>
              {errors.futureAddress && (
                <p className="text-xs text-red-500 font-medium">{errors.futureAddress}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Section 2: 20 Questions Grouped */}
        <div className="space-y-6">
          {FEEDBACK_SECTIONS.map((section, secIdx) => (
            <Card key={secIdx} className="shadow-sm">
              <div className="pb-3 mb-5 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {secIdx + 2}. {section.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {section.description}
                </p>
              </div>

              <div className="space-y-6">
                {section.questions.map((q) => {
                  const error = errors[q.key as string];
                  const currentVal = ratings[q.key as string];

                  return (
                    <div
                      key={q.key as string}
                      id={`q-${q.key as string}`}
                      className={`p-4 rounded-xl border transition-all duration-200
                        ${error
                          ? 'border-red-200 bg-red-50/10 dark:border-red-950/20'
                          : 'border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700/60 bg-slate-50/20 dark:bg-slate-800/10'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          {q.label}
                          <span className="text-red-500">*</span>
                        </label>
                        {error && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">
                            <ShieldAlert className="w-3 h-3" />
                            Required
                          </span>
                        )}
                      </div>

                      {/* Custom Radios Selection */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {RATING_OPTIONS.map((opt) => {
                          const isSelected = currentVal === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleRatingChange(q.key as string, opt.value)}
                              className={`px-3 py-2 rounded-lg text-xs font-medium text-center border transition-all duration-150 active:scale-95 flex items-center justify-center
                                ${isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-600 shadow-sm font-semibold'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/10 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700 dark:hover:border-indigo-500/50'
                                }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>

        {/* Section 3: Suggestions */}
        <Card className="shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            6. Suggestions for Improvement
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Is there anything else you want to share about your experience at IIIT-B? (Optional)
          </p>
          <textarea
            rows={4}
            placeholder="Share suggestions or details here..."
            className="w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border-slate-300 dark:border-slate-700 resize-none transition-colors duration-200"
            value={suggestions}
            onChange={(e) => setSuggestions(e.target.value)}
          />
        </Card>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            size="lg"
            className="px-8 shadow-md rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold tracking-wide active:scale-95 transition-transform"
          >
            Submit Feedback
          </Button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 max-w-md w-full relative overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full shrink-0">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Confirm Submission</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Are you absolutely sure you want to submit your exit survey?
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-2">
                  Important: You can only submit your feedback once. After submission, the form will be locked and cannot be edited.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
                className="rounded-lg text-xs"
              >
                Go Back
              </Button>
              <Button
                onClick={handleFinalSubmit}
                loading={isSubmitting}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              >
                Yes, Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
