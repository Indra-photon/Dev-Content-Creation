interface ValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Validate code submission
 */
export function validateCode(code: string): ValidationResult {
    // Remove whitespace for length check
    const trimmedCode = code.trim();
    
    if (!trimmedCode) {
        return {
            valid: false,
            error: 'Code cannot be empty'
        };
    }
    
    if (trimmedCode.length < 10) {
        return {
            valid: false,
            error: 'Code must be at least 10 characters. Share a meaningful code snippet.'
        };
    }
    
    if (trimmedCode.length > 10000) {
        return {
            valid: false,
            error: 'Code is too long. Maximum 10,000 characters.'
        };
    }
    
    return { valid: true };
}

/**
 * Validate learning notes submission
 */
export function validateLearningNotes(notes: string): ValidationResult {
    const trimmedNotes = notes.trim();
    
    if (!trimmedNotes) {
        return {
            valid: false,
            error: 'Learning notes cannot be empty'
        };
    }
    
    if (trimmedNotes.length < 20) {
        return {
            valid: false,
            error: 'Learning notes must be at least 20 characters. Share what you learned!'
        };
    }
    
    if (trimmedNotes.length > 5000) {
        return {
            valid: false,
            error: 'Learning notes are too long. Maximum 5,000 characters.'
        };
    }
    
    return { valid: true };
}

/**
 * Validate GitHub URL format
 */
export function validateGitHubUrl(url: string): ValidationResult {
    const githubPattern = /^https:\/\/(github\.com|gist\.github\.com)\/.+/;
    
    if (!githubPattern.test(url)) {
        return {
            valid: false,
            error: 'Invalid GitHub URL. Must be from github.com or gist.github.com'
        };
    }
    
    return { valid: true };
}

/**
 * Sanitize code input (remove potentially harmful content)
 */
export function sanitizeCode(code: string): string {
    // Remove any script tags or suspicious content
    return code
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .trim();
}

/**
 * Sanitize learning notes
 */
export function sanitizeLearningNotes(notes: string): string {
    return notes.trim();
}
