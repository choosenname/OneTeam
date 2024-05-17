import { NextApiRequest } from "next";

import { NextApiResponseServerIo } from "@/types";
import { currentUserPages } from "@/lib/current-user-pages";
import { db } from "@/lib/db";


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponseServerIo,
) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const user = await currentUserPages(req, res);
        const { content, fileUrl } = req.body;
        const { conversationId } = req.query;

        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!conversationId) {
            return res.status(400).json({ error: "Conversation ID missing" });
        }

        if (!content) {
            return res.status(400).json({ error: "Content missing" });
        }


        const conversation = await db.conversationTwo.findFirst({
            where: {
                id: conversationId as string,
                OR: [
                    {
                        memberOne: {
                            userId: user.id,
                        }
                    },
                    {
                        memberTwo: {
                            userId: user.id,
                        }
                    }
                ]
            },
            include: {
                memberOne: {
                    include: {
                        user: true,
                    }
                },
                memberTwo: {
                    include: {
                        user: true,
                    }
                }
            }
        })

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        const member = conversation.memberOne.userId === user.id ? conversation.memberOne : conversation.memberTwo

        if (!member) {
            return res.status(404).json({ message: "Member not found" });
        }

        const message = await db.directMessageTwo.create({
            data: {
                content,
                fileUrl,
                conversationId: conversationId as string,
                memberId: member.id,
            },
            include: {
                member: {
                    include: {
                        user: true,
                    }
                }
            }
        });

        const channelKey = `chat:${conversationId}:messages`;

        res?.socket?.server?.io?.emit(channelKey, message);

        return res.status(200).json(message);
    } catch (error) {
        console.log("[DIRECT_MESSAGES_POST]", error);
        return res.status(500).json({ message: "Internal Error" });
    }
}