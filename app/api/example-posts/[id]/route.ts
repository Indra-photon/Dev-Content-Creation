import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ExamplePostModel from '@/app/api/models/ExamplePostModel';

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
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

        // Find and update the example post, ensuring it belongs to the user
        const updatedPost = await ExamplePostModel.findOneAndUpdate(
            { _id: params.id, clerk_id: userId },
            { type, platform, content },
            { new: true }
        );

        if (!updatedPost) {
            return NextResponse.json(
                { error: 'Example post not found or unauthorized' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: updatedPost
        });

    } catch (error) {
        console.error('Example post update error:', error);
        return NextResponse.json(
            { error: 'Failed to update example post' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        // Find and delete the example post, ensuring it belongs to the user
        const deletedPost = await ExamplePostModel.findOneAndDelete({
            _id: params.id,
            clerk_id: userId
        });

        if (!deletedPost) {
            return NextResponse.json(
                { error: 'Example post not found or unauthorized' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Example post deleted successfully'
        });

    } catch (error) {
        console.error('Example post deletion error:', error);
        return NextResponse.json(
            { error: 'Failed to delete example post' },
            { status: 500 }
        );
    }
}
