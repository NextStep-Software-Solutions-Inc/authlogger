import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { WebhookEvent } from '@clerk/nextjs/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

type Params = Promise<{ "app-name": string }>;

export async function POST(req: Request, { params }: { params: Params }) {
    const { "app-name": appName } = await params;
    const WEBHOOK_SECRET = process.env[`WEBHOOK_SECRET_${appName}`.toUpperCase()];

    if (!WEBHOOK_SECRET) {
        return new Response('Webhook secret not found.', { status: 400 });
    }

    const headerPayload = await headers();
    const svixId = headerPayload.get("svix-id");
    const svixTimestamp = headerPayload.get("svix-timestamp");
    const svixSignature = headerPayload.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
        return new Response("Error occurred -- no svix headers", { status: 400 });
    }

    const payload = await req.json();
    const body = JSON.stringify(payload);
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;
    try {
        evt = wh.verify(body, {
            "svix-id": svixId,
            "svix-timestamp": svixTimestamp,
            "svix-signature": svixSignature,
        }) as WebhookEvent;
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return new Response('Error occured', { status: 400 });
    }

    const eventType = evt.type;

    try {
        // Handle the event
        switch (eventType) {
            case 'session.created':
                await prisma.authEvent.create({
                    data: {
                        eventType,
                        application: { connect: { name: appName } },
                        user: { connect: { authUserId: evt.data.user_id } }
                    },
                });
                console.log(`User ${evt.data.user_id} logged in to ${appName}`);
                break;
            case 'session.ended':
                await prisma.authEvent.create({
                    data: {
                        user: { connect: { authUserId: evt.data.user_id } },
                        eventType,
                        application: { connect: { name: appName } }
                    },
                });
                console.log(`User ${evt.data.user_id} logged out of ${appName}`);
                break;
            case 'user.created':
                await prisma.authEvent.create({
                    data: {
                        application: { connect: { name: appName } },
                        user: {
                            connectOrCreate: {
                                where: { authUserId: evt.data.id },
                                create: {
                                    authUserId: evt.data.id,
                                    firstName: evt.data.first_name,
                                    lastName: evt.data.last_name,
                                    image: evt.data.image_url,
                                }
                            }
                        },
                        eventType,
                    },
                });
                console.log(`User ${evt.data.id} created in ${appName}`);
                break;
            case 'user.updated':
                await prisma.$transaction(async (tx) => {
                    await tx.authEvent.create({
                        data: {
                            eventType,
                            application: { connect: { name: appName } },
                            user: { connect: { authUserId: evt.data.id } },
                        }
                    });
                    await tx.user.update({
                        where: { id: evt.data.id },
                        data: {
                            image: evt.data.image_url,
                            firstName: evt.data.first_name,
                            lastName: evt.data.last_name,
                        }
                    });
                }, {
                    isolationLevel: 'Serializable',
                    maxWait: 5000,
                    timeout: 10000,
                });
                console.log(`User ${evt.data.id} updated in ${appName}`);
                break;
            default:
                console.log(`Unhandled event type: ${eventType}`);
        }

        return NextResponse.json({ success: true, message: 'Webhook received' });
    } catch (dbError) {
        console.error('Database error:', dbError);
        return new Response('Database error', { status: 500 });
    }
}