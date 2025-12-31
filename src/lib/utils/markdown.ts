/**
 * Markdown Rendering Utility
 * 
 * Secure markdown rendering with DOMPurify sanitization.
 * Prevents XSS attacks while allowing rich content.
 */

import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked for security
marked.setOptions({
    gfm: true,       // GitHub Flavored Markdown
    breaks: true,    // Convert \n to <br>
});

/**
 * Render markdown to sanitized HTML
 */
export function renderMarkdown(content: string): string {
    if (!content) return '';

    // Parse markdown to HTML
    const rawHtml = marked.parse(content) as string;

    // Sanitize with strict allowlist
    return DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'br', 'hr',
            'ul', 'ol', 'li',
            'strong', 'em', 'b', 'i', 'u', 's',
            'code', 'pre',
            'blockquote',
            'a', 'img',
            'table', 'thead', 'tbody', 'tr', 'th', 'td'
        ],
        ALLOWED_ATTR: [
            'href', 'src', 'alt', 'title',
            'class'  // For syntax highlighting
        ],
        ALLOW_DATA_ATTR: false,
        ADD_ATTR: ['target', 'rel'],  // For links
        FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input'],
        FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover']
    });
}

/**
 * Strip all HTML/markdown for plain text preview
 */
export function stripMarkdown(content: string): string {
    if (!content) return '';
    const html = marked.parse(content) as string;
    const div = document.createElement('div');
    div.innerHTML = DOMPurify.sanitize(html);
    return div.textContent || '';
}
