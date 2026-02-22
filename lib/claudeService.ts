import Anthropic from '@anthropic-ai/sdk';

// Initialize the Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Model to use
const MODEL = 'claude-sonnet-4-20250514';

interface GenerateContentParams {
    code: string;
    learningNotes: string;
    goalType: 'learning' | 'product';
    examplePosts: {
        x?: string;
        linkedin?: string;
        blog?: string;
    };
}

interface GeneratedContent {
    x_post: string;
    linkedin_post: string;
    blog_post: string;
}

/**
 * Generate content for all three platforms
 */
export async function generateContent(params: GenerateContentParams): Promise<GeneratedContent> {
    const { code, learningNotes, goalType, examplePosts } = params;

    // Generate content for each platform
    const [xPost, linkedinPost, blogPost] = await Promise.all([
        generateXPost(code, learningNotes, goalType, examplePosts.x),
        generateLinkedInPost(code, learningNotes, goalType, examplePosts.linkedin),
        generateBlogPost(code, learningNotes, goalType, examplePosts.blog)
    ]);

    return {
        x_post: xPost,
        linkedin_post: linkedinPost,
        blog_post: blogPost
    };
}

/**
 * Generate X/Twitter post (280 characters max)
 */
async function generateXPost(
    code: string,
    learningNotes: string,
    goalType: 'learning' | 'product',
    examplePost?: string
): Promise<string> {
    const prompt = buildXPrompt(code, learningNotes, goalType, examplePost);
    
    const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 300,
        messages: [
            {
                role: 'user',
                content: prompt
            }
        ]
    });

    const content = message.content[0];
    if (content.type === 'text') {
        return content.text.trim();
    }
    
    throw new Error('Unexpected response format from Claude API');
}

/**
 * Generate LinkedIn post (1300-3000 characters ideal)
 */
async function generateLinkedInPost(
    code: string,
    learningNotes: string,
    goalType: 'learning' | 'product',
    examplePost?: string
): Promise<string> {
    const prompt = buildLinkedInPrompt(code, learningNotes, goalType, examplePost);
    
    const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1000,
        messages: [
            {
                role: 'user',
                content: prompt
            }
        ]
    });

    const content = message.content[0];
    if (content.type === 'text') {
        return content.text.trim();
    }
    
    throw new Error('Unexpected response format from Claude API');
}

/**
 * Generate technical blog post (long-form)
 */
async function generateBlogPost(
    code: string,
    learningNotes: string,
    goalType: 'learning' | 'product',
    examplePost?: string
): Promise<string> {
    const prompt = buildBlogPrompt(code, learningNotes, goalType, examplePost);
    
    const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2000,
        messages: [
            {
                role: 'user',
                content: prompt
            }
        ]
    });

    const content = message.content[0];
    if (content.type === 'text') {
        return content.text.trim();
    }
    
    throw new Error('Unexpected response format from Claude API');
}

/**
 * Build prompt for X/Twitter post
 */
function buildXPrompt(
    code: string,
    learningNotes: string,
    goalType: 'learning' | 'product',
    examplePost?: string
): string {
    const tone = goalType === 'learning' 
        ? 'educational and enthusiastic (e.g., "Today I learned...")'
        : 'product update and shipping focused (e.g., "Shipped...", "Built...")';

    let prompt = `You are a developer writing a Twitter/X post about your work.

**Tone:** ${tone}

**What you worked on:**
Code:
${code}

Learning Notes:
${learningNotes}

`;

    if (examplePost) {
        prompt += `**Style Reference (match this tone and style):**
${examplePost}

`;
    }

    prompt += `**Instructions:**
- Write a concise, engaging Twitter post (max 280 characters)
- ${goalType === 'learning' ? 'Focus on what you learned and key insights' : 'Focus on what you built and shipped'}
- Include relevant emojis (1-2 max)
- Use hashtags if appropriate (#100DaysOfCode, #BuildInPublic, etc.)
- Make it authentic and conversational
- DO NOT use quotation marks around the post
- Return ONLY the post text, nothing else

Write the post now:`;

    return prompt;
}

/**
 * Build prompt for LinkedIn post
 */
function buildLinkedInPrompt(
    code: string,
    learningNotes: string,
    goalType: 'learning' | 'product',
    examplePost?: string
): string {
    const tone = goalType === 'learning'
        ? 'professional yet personal, sharing learning journey'
        : 'professional product update, showing progress';

    let prompt = `You are a developer writing a LinkedIn post about your work.

**Tone:** ${tone}

**What you worked on:**
Code:
${code}

Learning Notes:
${learningNotes}

`;

    if (examplePost) {
        prompt += `**Style Reference (match this tone and structure):**
${examplePost}

`;
    }

    prompt += `**Instructions:**
- Write a professional LinkedIn post (1300-2000 characters)
- ${goalType === 'learning' ? 'Share your learning journey, challenges overcome, and insights gained' : 'Describe what you built, why it matters, and the impact'}
- Use short paragraphs for readability
- Include a hook in the first line
- Add 3-5 relevant hashtags at the end
- Use emojis sparingly (2-3 max)
- Be authentic and specific
- DO NOT use quotation marks around the post
- Return ONLY the post text, nothing else

Write the post now:`;

    return prompt;
}

/**
 * Build prompt for technical blog post
 */
function buildBlogPrompt(
    code: string,
    learningNotes: string,
    goalType: 'learning' | 'product',
    examplePost?: string
): string {
    const tone = goalType === 'learning'
        ? 'educational tutorial or learning log'
        : 'product development blog post or technical write-up';

    let prompt = `You are a developer writing a technical blog post about your work.

**Tone:** ${tone}

**What you worked on:**
Code:
${code}

Learning Notes:
${learningNotes}

`;

    if (examplePost) {
        prompt += `**Style Reference (match this structure and depth):**
${examplePost}

`;
    }

    prompt += `**Instructions:**
- Write a detailed technical blog post (500-800 words)
- ${goalType === 'learning' 
    ? 'Structure: What you learned → How you learned it → Key takeaways → Code examples' 
    : 'Structure: Problem → Solution → Implementation → Results/Next steps'}
- Use markdown formatting (##, ###, \`code\`, **bold**)
- Include code snippets with explanations
- Be technical but accessible
- Add a compelling title at the top (# Title)
- End with a conclusion or next steps
- DO NOT wrap the entire post in quotation marks
- Return ONLY the blog post content, nothing else

Write the post now:`;

    return prompt;
}
