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

        const { id } = params;
        const { type, platform, content } = await request.json();

        await dbConnect();

        // Find the example post and verify ownership
        const examplePost = await ExamplePostModel.findOne({
            _id: id,
            clerk_id: userId
        });

        if (!examplePost) {
            return NextResponse.json(
                { error: 'Example post not found or unauthorized' },
                { status: 404 }
            );
        }

        // Validate if type or platform is being changed
        if (type && !['learning', 'product'].includes(type)) {
            return NextResponse.json(
                { error: 'Invalid type. Must be "learning" or "product"' },
                { status: 400 }
            );
        }

        if (platform && !['x', 'linkedin', 'blog'].includes(platform)) {
            return NextResponse.json(
                { error: 'Invalid platform. Must be "x", "linkedin", or "blog"' },
                { status: 400 }
            );
        }

        // If changing type or platform, check the 2-per-type-per-platform limit
        if ((type && type !== examplePost.type) || (platform && platform !== examplePost.platform)) {
            const newType = type || examplePost.type;
            const newPlatform = platform || examplePost.platform;

            const existingCount = await ExamplePostModel.countDocuments({
                clerk_id: userId,
                type: newType,
                platform: newPlatform,
                _id: { $ne: id } // Exclude current document
            });

            if (existingCount >= 2) {
                return NextResponse.json(
                    { error: `Maximum 2 example posts allowed for ${newType} on ${newPlatform}` },
                    { status: 400 }
                );
            }
        }

        // Update the example post
        const updatedPost = await ExamplePostModel.findByIdAndUpdate(
            id,
            {
                ...(type && { type }),
                ...(platform && { platform }),
                ...(content && { content })
            },
            { new: true, runValidators: true }
        );

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

        const { id } = params;

        await dbConnect();

        // Find and delete the example post (verify ownership)
        const deletedPost = await ExamplePostModel.findOneAndDelete({
            _id: id,
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
