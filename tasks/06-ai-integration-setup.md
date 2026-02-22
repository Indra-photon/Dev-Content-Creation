# Task 06: AI Integration Setup

**Phase:** 1 - Backend  
**Estimated Time:** 2-3 hours  
**Dependencies:** Task 05 (Task Completion Logic) ✅

---

## Objective

Set up Anthropic Claude API integration with optimized prompt templates for generating content in different tones (Learning vs Product) and formats (X, LinkedIn, Blog).

---

## Prerequisites

- ✅ Completion logic ready (Task 05)
- ✅ Example Posts model created (Task 01)
- ✅ Weekly Goals with type field (learning/product)
- Anthropic API key (get from https://console.anthropic.com/)

---

## Setup Steps

### 1. Install Anthropic SDK

```bash
npm install @anthropic-ai/sdk
```

---

### 2. Environment Variables

**File:** `.env.local`

Add the Anthropic API key:

```bash
# Existing variables...
MONGODB_URI=...
CLERK_SECRET_KEY=...

# Add this:
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**Security Note:** Never commit your API key to version control!

---

### 3. Create AI Service Helper

**File:** `lib/claudeService.ts`

```typescript
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
```

---

### 4. Create Weekly Wrap-up Generator

**File:** `lib/weeklyWrapupService.ts`

```typescript
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
```

---

## Testing the AI Integration

### Test Script

**File:** `scripts/testClaudeAPI.ts` (optional)

```typescript
import { generateContent } from '@/lib/claudeService';

async function testAIGeneration() {
    const testParams = {
        code: `
const [count, setCount] = useState(0);

useEffect(() => {
    document.title = \`Count: \${count}\`;
}, [count]);
        `,
        learningNotes: 'Today I learned how useState and useEffect work together. The useEffect hook runs after every render and the dependency array controls when it runs. Setting document.title in useEffect is a common pattern for side effects.',
        goalType: 'learning' as const,
        examplePosts: {
            x: 'Just learned about React hooks! The useState hook is 🔥 for managing state. #100DaysOfCode',
            linkedin: 'Excited to share my learning journey with React Hooks...',
            blog: '# Learning React Hooks\n\nToday I dove deep into hooks...'
        }
    };

    try {
        console.log('Testing Claude API...\n');
        
        const result = await generateContent(testParams);
        
        console.log('✅ X Post:');
        console.log(result.x_post);
        console.log('\n---\n');
        
        console.log('✅ LinkedIn Post:');
        console.log(result.linkedin_post);
        console.log('\n---\n');
        
        console.log('✅ Blog Post:');
        console.log(result.blog_post);
        
        console.log('\n✅ Test completed successfully!');
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testAIGeneration();
```

**Run test:**
```bash
npx ts-node scripts/testClaudeAPI.ts
```

---

## Prompt Engineering Tips

### For Learning Posts:
- Use words like: "learned", "discovered", "realized", "understood"
- Include aha moments and insights
- Share challenges and how you overcame them
- Be humble and show growth mindset

### For Product Posts:
- Use words like: "built", "shipped", "deployed", "launched"
- Focus on features and user value
- Highlight technical decisions
- Show impact and metrics if available

### Platform-Specific:
- **X:** Brief, punchy, emoji-friendly
- **LinkedIn:** Professional but personal, paragraph breaks
- **Blog:** Technical depth, code examples, markdown formatting

---

## Environment Variables Checklist

Make sure `.env.local` has:

```bash
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Database
MONGODB_URI=mongodb+srv://...

# Anthropic AI (NEW)
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Rate Limits & Costs

**Anthropic Claude Sonnet 4:**
- Input: $3 per million tokens
- Output: $15 per million tokens

**Typical usage per task completion:**
- ~1000 input tokens (prompt + context)
- ~500 output tokens (generated content)
- Cost: ~$0.01 per generation

**For 100 task completions:**
- ~$1.00 total cost

Very affordable for this use case!

---

## Error Handling

The service includes basic error handling. Add more robust handling in production:

```typescript
try {
    const content = await generateContent(params);
    return content;
} catch (error) {
    if (error.status === 429) {
        // Rate limit - retry with backoff
        console.error('Rate limited, retrying...');
    } else if (error.status === 401) {
        // Invalid API key
        console.error('Invalid API key');
    } else {
        // Other error
        console.error('AI generation failed:', error);
    }
    throw error;
}
```

---

## Checklist

- [ ] Install `@anthropic-ai/sdk` package
- [ ] Add `ANTHROPIC_API_KEY` to `.env.local`
- [ ] Create `lib/claudeService.ts` with all functions
- [ ] Create `lib/weeklyWrapupService.ts`
- [ ] Test API connection with test script
- [ ] Verify prompts generate good quality content
- [ ] Test both learning and product tones
- [ ] Test with and without example posts
- [ ] Adjust prompts based on output quality
- [ ] Test rate limits (optional)

---

## Next Steps

After completing this task:
1. Move to Task 07: Content Generation API
2. That task will integrate this AI service with the completion endpoint
3. Users will be able to generate content after completing tasks

---

## Git Commit

After successfully completing and testing this task:

```bash
# Stage the files
git add lib/claudeService.ts
git add lib/weeklyWrapupService.ts
git add .env.local.example  # If you create one
git add package.json
git add package-lock.json

# Commit with descriptive message
git commit -m "feat: integrate Claude AI for content generation

- Add Anthropic SDK and configure API client
- Create claudeService with platform-specific generators
- Implement prompt templates for Learning vs Product tones
- Add X, LinkedIn, and Blog post generators
- Create weekly wrap-up service
- Add prompt engineering for optimal output quality
- Include example posts for style matching
- Set up error handling and response parsing"

# Push to your branch
git push origin your-branch-name
```

---

**Status:** Ready to implement  
**Previous Task:** `05-task-completion-logic.md` ✅  
**Next Task:** `07-content-generation-api.md`