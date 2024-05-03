import {Hash} from "lucide-react";

import {MobileToggle} from "@/components/mobile-toggle";
import {UserAvatar} from "@/components/user-avatar";
import {SocketIndicator} from "@/components/socket-indicator";
import {ChatVideoButton} from "@/components/chat/chat-video-button";
import {ServerSearch} from "@/components/server/server-search";
import {db} from "@/lib/db";

// import {ChatVideoButton} from "@/components/chat/chat-video-button";

interface ChatHeaderProps {
    serverId: string;
    channelId: string;
    name: string;
    type: "channel" | "conversation";
    imageUrl?: string;
}

export const ChatHeader = async ({
                                     serverId, channelId, name, type, imageUrl
                                 }: ChatHeaderProps) => {

    const messages = await db.message.findMany({
        where: {
            channelId: channelId,
        }, include: {
            member: {
                include: {
                    user: true,
                },
            }
        }
    });

    return (<div
            className="text-md font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2">
            <MobileToggle serverId={serverId}/>
            {type === "channel" && (<Hash className="w-5 h-5 text-zinc-500 dark:text-zinc-400 mr-2"/>)}
            {type === "conversation" && (<UserAvatar
                    src={imageUrl}
                    className="h-8 w-8 md:h-8 md:w-8 mr-2"
                />)}
            <p className="font-semibold text-md text-black dark:text-white">
                {name}
            </p>
            <div className="ml-auto flex items-center">
                <ServerSearch
                    data={[{
                        label: "Messages", type: "message", data: messages?.map((message) => ({
                            id: message.id, name: message.content, icon: !!message.fileUrl, sub_id: channelId,
                        }))
                    },]}
                />
                {type === "conversation" && (<ChatVideoButton/>)}
                <SocketIndicator/>
            </div>
        </div>)
}