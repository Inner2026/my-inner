export interface PublicTest {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl?: string;
  price: { amount: number; currency: string };
  categories: { key: string; name: string }[];
  questionCount: number;
  versionLabel: string;
  available: boolean;
}

export interface TestRatingSummary {
  average: number;
  count: number;
  userRating: number | null;
  canRate: boolean;
}

export interface AuthUser {
  id: string;
  role: 'user' | 'admin';
  username?: string;
  email?: string;
  marketingEmails?: boolean;
  marketingConsentAt?: string | null;
}

export interface AttemptQuestionOption {
  id: string;
  text: string;
  order: number;
}

export interface AttemptQuestion {
  id: string;
  categoryKey: string | null;
  questionText: string;
  questionType: 'likert' | 'multiple_choice';
  order: number;
  answerOptions: AttemptQuestionOption[];
}

export interface ResultSummary {
  attemptId: string;
  testName: string;
  completedAt: string;
  resultTitle?: string;
}

export interface AttemptSummary {
  _id: string;
  status: 'in_progress' | 'scoring' | 'submitted';
  startedAt: string;
  completedAt?: string | null;
  testId: { slug: string; name: string };
}

export interface ResultItem {
  resultKey: string;
  imageUrl?: string | null;
  title: string;
  description: string;
  strengths: string | null;
  challenges: string | null;
  communication: string | null;
  relationships: string | null;
  recommendations: string | null;
}

export interface ResultDetail {
  attemptId: string;
  purchaseId: string;
  testSlug?: string;
  testName: string;
  completedAt: string;
  categoryScores: Record<string, unknown>;
  resultKey: string;
  snapshot: {
    title: string;
    description: string;
    strengths: string | null;
    challenges: string | null;
    communication: string | null;
    relationships: string | null;
    recommendations: string | null;
    /** Per-category/per-result breakdown -- length 1 for single-result tests. */
    results: ResultItem[];
  };
}
