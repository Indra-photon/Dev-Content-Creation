import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ExamplePostModel from '@/app/api/models/ExamplePostModel';

export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { type, platform, content } = await request.json();

        // Validate required fields
        if (!type || !platform || !content) {
            return NextResponse.json(
                { error: 'Missing required fields: type, platform, content' },
                { status: 400 }
            );
        }

        // Validate enum values
        if (!['learning', 'product'].includes(type)) {
            return NextResponse.json(
                { error: 'Invalid type. Must be "learning" or "product"' },
                { status: 400 }
            );
        }

        if (!['x', 'linkedin', 'blog'].includes(platform)) {
            return NextResponse.json(
                { error: 'Invalid platform. Must be "x", "linkedin", or "blog"' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if user already has 2 examples for this type+platform combination
        const existingCount = await ExamplePostModel.countDocuments({
            clerk_id: userId,
            type,
            platform
        });

        if (existingCount >= 2) {
            return NextResponse.json(
                { error: `Maximum 2 example posts allowed per type per platform. Delete an existing ${type} post for ${platform} first.` },
                { status: 400 }
            );
        }

        // Create the example post
        const examplePost = await ExamplePostModel.create({
            clerk_id: userId,
            type,
            platform,
            content
        });

        return NextResponse.json({
            success: true,
            data: examplePost
        }, { status: 201 });

    } catch (error) {
        console.error('Example post creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create example post' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        // Get query parameters for filtering
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const platform = searchParams.get('platform');

        // Build query
        const query: any = { clerk_id: userId };
        
        if (type && ['learning', 'product'].includes(type)) {
            query.type = type;
        }
        
        if (platform && ['x', 'linkedin', 'blog'].includes(platform)) {
            query.platform = platform;
        }

        // Fetch example posts
        const examplePosts = await ExamplePostModel.find(query)
            .sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            data: examplePosts,
            count: examplePosts.length
        });

    } catch (error) {
        console.error('Example posts fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch example posts' },
            { status: 500 }
        );
    }
}
