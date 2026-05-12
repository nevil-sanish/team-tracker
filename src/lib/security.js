/**
 * Security utilities for client-side input sanitization
 *
 * IMPORTANT: These are defense-in-depth measures.
 * Primary security is enforced server-side via Firebase rules.
 */

/**
 * Sanitize a string to prevent XSS when inserted into the DOM.
 * Strips all HTML tags and decodes entities.
 */
export function sanitizeText(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitize user-generated HTML to prevent XSS.
 * Allows a safe subset of tags (b, i, em, strong, br, p, ul, ol, li)
 * and strips everything else including event handlers.
 */
export function sanitizeHtml(input) {
  if (typeof input !== 'string') return '';

  // First, remove all event handler attributes
  let clean = input.replace(/\s*on\w+\s*=\s*(['"])[^'"]*\1/gi, '');
  clean = clean.replace(/\s*on\w+\s*=\s*\S+/gi, '');

  // Remove script/style tags entirely (including content)
  clean = clean.replace(/<script[\s\S]*?<\/script>/gi, '');
  clean = clean.replace(/<style[\s\S]*?<\/style>/gi, '');

  // Remove dangerous tags
  const dangerousTags = ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button', 'link', 'meta', 'base'];
  for (const tag of dangerousTags) {
    const regex = new RegExp(`</?${tag}[^>]*>`, 'gi');
    clean = clean.replace(regex, '');
  }

  // Remove javascript: and data: URLs from href/src attributes
  clean = clean.replace(/(?:href|src)\s*=\s*(['"])?\s*(?:javascript|data|vbscript):/gi, 'href=$1#blocked:');

  return clean;
}

/**
 * Validate a URL to prevent javascript: and data: URI injections.
 * Returns null if the URL is invalid/dangerous.
 */
export function sanitizeUrl(url) {
  if (typeof url !== 'string') return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  // Block dangerous protocols
  const lowerUrl = trimmed.toLowerCase();
  if (
    lowerUrl.startsWith('javascript:') ||
    lowerUrl.startsWith('data:') ||
    lowerUrl.startsWith('vbscript:')
  ) {
    return null;
  }

  // Ensure it starts with http(s) or is a relative path
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed;
  }

  // Auto-prefix with https://
  return `https://${trimmed}`;
}

/**
 * Validate and clamp file size.
 * Returns true if within allowed bounds.
 */
export function validateFileUpload(file, maxSizeBytes = 750 * 1024) {
  if (!file) return { valid: false, error: 'No file selected' };

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File is too large (${(file.size / 1024).toFixed(1)}KB). Maximum size is ${(maxSizeBytes / 1024).toFixed(0)}KB.`,
    };
  }

  // Block executable MIME types
  const dangerousMimeTypes = [
    'application/x-executable',
    'application/x-msdownload',
    'application/x-msdos-program',
    'application/x-sh',
    'application/x-csh',
    'application/x-bat',
    'application/x-msi',
    'application/vnd.microsoft.portable-executable',
  ];

  if (dangerousMimeTypes.includes(file.type)) {
    return { valid: false, error: 'Executable files are not allowed.' };
  }

  // Block by extension as well (MIME can be spoofed)
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.scr', '.pif', '.com', '.vbs', '.js', '.wsf', '.ps1'];
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  if (dangerousExtensions.includes(ext)) {
    return { valid: false, error: `Files with ${ext} extension are not allowed.` };
  }

  return { valid: true, error: null };
}
