import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/claudeService';

/**
 * Generate content preview without requiring a completed task
 * Useful for testing or previewing before submission
 */
export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { code, learningNotes, goalType, examplePosts } = await request.json();

        // Validate inputs
        if (!code || !learningNotes || !goalType) {
            return NextResponse.json(
                { error: 'Missing required fields: code, learningNotes, goalType' },
                { status: 400 }
            );
        }

        if (!['learning', 'product'].includes(goalType)) {
            return NextResponse.json(
                { error: 'Invalid goalType. Must be "learning" or "product"' },
                { status: 400 }
            );
        }

        // Generate content
        const generatedContent = await generateContent({
            code,
            learningNotes,
            goalType,
            examplePosts: examplePosts || {}
        });

        return NextResponse.json({
            success: true,
            data: {
                generatedContent,
                characterCounts: {
                    x: generatedContent.x_post.length,
                    linkedin: generatedContent.linkedin_post.length,
                    blog: generatedContent.blog_post.length
                }
            }
        });

    } catch (error) {
        console.error('Preview generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate preview' },
            { status: 500 }
        );
    }
}
