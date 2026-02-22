import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const MODEL = 'claude-sonnet-4-20250514';

interface DailyTaskCompletion {
    dayNumber: number;
    description: string;
    code: string;
    learningNotes: string;
}

interface WeeklyWrapupParams {
    weekTitle: string;
    goalType: 'learning' | 'product';
    dailyTasks: DailyTaskCompletion[];
    examplePosts: {
        x?: string;
        linkedin?: string;
        blog?: string;
    };
}

interface WeeklyWrapup {
    x_post: string;
    linkedin_post: string;
    blog_post: string;
}

/**
 * Generate weekly wrap-up content for all platforms
 */
export async function generateWeeklyWrapup(params: WeeklyWrapupParams): Promise<WeeklyWrapup> {
    const { weekTitle, goalType, dailyTasks, examplePosts } = params;

    // Generate wrap-up for each platform
    const [xPost, linkedinPost, blogPost] = await Promise.all([
        generateXWrapup(weekTitle, goalType, dailyTasks, examplePosts.x),
        generateLinkedInWrapup(weekTitle, goalType, dailyTasks, examplePosts.linkedin),
        generateBlogWrapup(weekTitle, goalType, dailyTasks, examplePosts.blog)
    ]);

    return {
        x_post: xPost,
        linkedin_post: linkedinPost,
        blog_post: blogPost
    };
}

/**
 * Generate X weekly wrap-up
 */
async function generateXWrapup(
    weekTitle: string,
    goalType: 'learning' | 'product',
    dailyTasks: DailyTaskCompletion[],
    examplePost?: string
): Promise<string> {
    const prompt = buildXWrapupPrompt(weekTitle, goalType, dailyTasks, examplePost);
    
    const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
    });

    const content = message.content[0];
    return content.type === 'text' ? content.text.trim() : '';
}

/**
 * Generate LinkedIn weekly wrap-up
 */
async function generateLinkedInWrapup(
    weekTitle: string,
    goalType: 'learning' | 'product',
    dailyTasks: DailyTaskCompletion[],
    examplePost?: string
): Promise<string> {
    const prompt = buildLinkedInWrapupPrompt(weekTitle, goalType, dailyTasks, examplePost);
    
    const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }]
    });

    const content = message.content[0];
    return content.type === 'text' ? content.text.trim() : '';
}

/**
 * Generate blog weekly wrap-up
 */
async function generateBlogWrapup(
    weekTitle: string,
    goalType: 'learning' | 'product',
    dailyTasks: DailyTaskCompletion[],
    examplePost?: string
): Promise<string> {
    const prompt = buildBlogWrapupPrompt(weekTitle, goalType, dailyTasks, examplePost);
    
    const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }]
    });

    const content = message.content[0];
    return content.type === 'text' ? content.text.trim() : '';
}

/**
 * Build X wrap-up prompt
 */
function buildXWrapupPrompt(
    weekTitle: string,
    goalType: 'learning' | 'product',
    dailyTasks: DailyTaskCompletion[],
    examplePost?: string
): string {
    const tasksOverview = dailyTasks
        .map(t => `Day ${t.dayNumber}: ${t.description}`)
        .join('\n');

    let prompt = `Write a Twitter thread recap of a week's work.

**Week:** ${weekTitle}
**Type:** ${goalType === 'learning' ? 'Learning journey' : 'Product development'}

**Daily Tasks:**
${tasksOverview}

`;

    if (examplePost) {
        prompt += `**Style Reference:**
${examplePost}

`;
    }

    prompt += `**Instructions:**
- Create a short thread (2-3 tweets max, each under 280 chars)
- First tweet: Hook with week summary
- ${goalType === 'learning' ? 'Highlight key learnings' : 'Highlight features shipped'}
- Use emojis and relevant hashtags
- Make it engaging and authentic
- Return tweets separated by "---"

Write the thread now:`;

    return prompt;
}

/**
 * Build LinkedIn wrap-up prompt
 */
function buildLinkedInWrapupPrompt(
    weekTitle: string,
    goalType: 'learning' | 'product',
    dailyTasks: DailyTaskCompletion[],
    examplePost?: string
): string {
    const detailedTasks = dailyTasks
        .map(t => `**Day ${t.dayNumber}:** ${t.description}\n- ${t.learningNotes.slice(0, 100)}...`)
        .join('\n\n');

    let prompt = `Write a LinkedIn post recapping a week's work.

**Week:** ${weekTitle}
**Type:** ${goalType === 'learning' ? 'Learning journey' : 'Product development'}

**Daily Progress:**
${detailedTasks}

`;

    if (examplePost) {
        prompt += `**Style Reference:**
${examplePost}

`;
    }

    prompt += `**Instructions:**
- Write a comprehensive weekly recap (1500-2500 characters)
- Start with an engaging hook
- ${goalType === 'learning' ? 'Share the learning journey, challenges, and growth' : 'Share what was built, challenges solved, and impact'}
- Highlight 3-4 key accomplishments
- End with reflections or next week's goals
- Use short paragraphs and emojis
- Add relevant hashtags

Write the post now:`;

    return prompt;
}

/**
 * Build blog wrap-up prompt
 */
function buildBlogWrapupPrompt(
    weekTitle: string,
    goalType: 'learning' | 'product',
    dailyTasks: DailyTaskCompletion[],
    examplePost?: string
): string {
    const detailedTasks = dailyTasks
        .map(t => `### Day ${t.dayNumber}: ${t.description}

**Code:**
\`\`\`
${t.code.slice(0, 200)}...
\`\`\`

**Notes:** ${t.learningNotes}
`)
        .join('\n\n');

    let prompt = `Write a technical blog post recapping a week's work.

**Week:** ${weekTitle}
**Type:** ${goalType === 'learning' ? 'Learning journey' : 'Product development'}

**Daily Breakdown:**
${detailedTasks}

`;

    if (examplePost) {
        prompt += `**Style Reference:**
${examplePost}

`;
    }

    prompt += `**Instructions:**
- Write a detailed weekly recap blog post (800-1200 words)
- Structure: Intro → Daily breakdown → Key learnings → Conclusion
- Use markdown formatting
- Include code snippets where relevant
- ${goalType === 'learning' ? 'Focus on learning progression throughout the week' : 'Focus on development progress and technical decisions'}
- Add a compelling title
- End with next week's goals

Write the post now:`;

    return prompt;
}
