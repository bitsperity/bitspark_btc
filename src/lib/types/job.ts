/**
 * Job Types
 */

import type { NostrEntity } from './nostr';

/**
 * Job status values
 * - open: No contract exists, devs can apply
 * - assigned: Contract created, dev working
 * - review: PR submitted, awaiting review
 * - completed: PR approved, work done
 */
export type JobStatus = 'open' | 'assigned' | 'review' | 'completed';

/**
 * Parsed Job from NDK Event
 */
export interface Job extends NostrEntity {
    title: string;
    requirements: string;
    content: string;  // Markdown description
    bannerUrl?: string;
    languages: string[];
    categories: string[];
    ideaId: string;
    previousJobId?: string;
    status: JobStatus;
}

/**
 * Input for creating a new job
 */
export interface CreateJobInput {
    title: string;
    requirements: string;
    content: string;
    bannerUrl?: string;
    languages: string[];
    categories: string[]
    ideaId: string;
}

/**
 * Available programming languages
 */
export const PROGRAMMING_LANGUAGES = [
    'typescript',
    'javascript',
    'rust',
    'go',
    'python',
    'solidity',
    'c',
    'cpp',
    'java',
    'swift',
    'kotlin',
    'other'
] as const;

export type ProgrammingLanguage = typeof PROGRAMMING_LANGUAGES[number];

/**
 * Language display labels
 */
export const LANGUAGE_LABELS: Record<ProgrammingLanguage, string> = {
    typescript: '🔷 TypeScript',
    javascript: '🟨 JavaScript',
    rust: '🦀 Rust',
    go: '🐹 Go',
    python: '🐍 Python',
    solidity: '💎 Solidity',
    c: '©️ C',
    cpp: '➕ C++',
    java: '☕ Java',
    swift: '🍎 Swift',
    kotlin: '🟣 Kotlin',
    other: '📦 Other'
};

/**
 * Job status display config
 */
export const JOB_STATUS_CONFIG: Record<JobStatus, { label: string; color: string }> = {
    open: { label: 'Open', color: 'success' },
    assigned: { label: 'Assigned', color: 'warning' },
    review: { label: 'In Review', color: 'info' },
    completed: { label: 'Completed', color: 'muted' }
};
