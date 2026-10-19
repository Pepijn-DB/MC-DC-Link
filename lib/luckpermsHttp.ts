
import getConfig from "../src/config.ts";
import type {
    LuckPermsUser,
    LuckPermsUserSearchResult,
} from "./types/luckperms.ts";
import {getMinecraftProfiles, getMinecraftProfilesBatch} from "./minecraftHttp.ts";

async function luckpermsHTTPRequest(endpoint: string): Promise<Response> {
    return fetch(`${getConfig().luckpermsUrl}/${endpoint}`);
}

export async function getUsersFromGroup(
    groupName: string,
): Promise<LuckPermsUser[]> {
    const response = await luckpermsHTTPRequest(
        `user/search?group=${encodeURIComponent(groupName)}`,
    );

    if (!response.ok) {
        throw new Error(
            `Failed to fetch users from group ${groupName}: ${response.status} ${response.statusText}`,
        );
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
        throw new Error(`Invalid user search response for group ${groupName}.`);
    }

    const users = data as LuckPermsUserSearchResult[];
    return Promise.all(
        users
            .filter((user) =>
                user.results.some(
                    (node) =>
                        node.type === "inheritance" &&
                        node.value &&
                        node.key === `group.${groupName}`,
                ),
            )
            .map((user) => getLuckPermsUser(user.uniqueId)),
    );
}

export async function getLuckPermsUser(
    uuid: string,
): Promise<LuckPermsUser> {
    const response = await luckpermsHTTPRequest(
        `user/${encodeURIComponent(uuid)}`,
    );

    if (!response.ok) {
        throw new Error(
            `Failed to fetch LuckPerms user ${uuid}: ${response.status} ${response.statusText}`,
        );
    }

    return (await response.json()) as LuckPermsUser;
}


export async function getUsersOnWhitelist(): Promise<LuckPermsUser[]> {
    const groups = ["forever-access", "forever-stop-server"];

    const groupUsers = await Promise.all(
        groups.map((group) => getUsersFromGroup(group)),
    );

    return [
        ...new Map(
            groupUsers
                .flat()
                .map((user) => [user.uniqueId, user] as const),
        ).values(),
    ];
}

export async function checkIfUserExists(username: string): Promise<boolean> {
    try{
        const response = await luckpermsHTTPRequest(
            `user/lookup?username=${encodeURIComponent(username)}`,
        );

        if (!response.ok && !(response.status === 404)) {
            throw new Error(
                `Failed to check if user exists ${username}: ${response.status} ${response.statusText}`,
            );
        } else if (response.status === 404) {
            return false;
        } else {
            return true;
        }
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function createUserByUsername(username: string): Promise<boolean> {
    const uuid:string = (await getMinecraftProfiles([username]))[0]?.id ?? crypto.randomUUID();
    const response = await fetch(`${getConfig().luckpermsUrl}/user`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            uniqueId: uuid,
            username: username.toLowerCase(),
        }),
    });

    if (!response.ok) {
        throw new Error(
            `Failed to create LuckPerms user ${username}: ${response.status} ${response.statusText}`,
        );
    }
    return true;
}
