
import getConfig from "../src/config.ts";
import type {
    LuckPermsUser,
    LuckPermsUserLookup,
    LuckPermsUserSearchResult,
} from "./types/luckperms.ts";
import {getMinecraftProfiles} from "./minecraftHttp.ts";

function toStandardUuid(uuid: string): string {
    const value = uuid.replaceAll("-", "").toLowerCase();

    if (!/^[0-9a-f]{32}$/.test(value)) {
        throw new Error(`Invalid UUID: ${uuid}`);
    }

    return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

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
        `user/${uuid}`,
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
    const uuid = toStandardUuid(
        (await getMinecraftProfiles([username]))[0]?.id ?? crypto.randomUUID(),
    );
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
            `Failed to create LuckPerms user ${username}: ${response.status} ${response.statusText}. Response body: ${await response.text()}. ` + JSON.stringify({
                uniqueId: uuid,
                username: username.toLowerCase(),
            }),
        );
    }
    return true;
}

export async function addUserToGroup(
    uuid: string,
    groupName: string,
): Promise<boolean> {
    const response = await fetch(`${getConfig().luckpermsUrl}/user/${uuid}/nodes`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            key: `group.${groupName}`,
            value: true,
        }),
    });


    if (!response.ok) {
        throw new Error(
            `Failed to add user ${uuid} to group ${groupName}: ${response.status} ${response.statusText}`,
        );
    }
    return true;
}

export async function getUserFromUsername(username: string): Promise<LuckPermsUserLookup | null> {
    const response = await luckpermsHTTPRequest(
        `user/lookup?username=${encodeURIComponent(username)}`,
    );

    if (!response.ok && !(response.status === 404)) {
        throw new Error(
            `Failed to fetch LuckPerms user ${username}: ${response.status} ${response.statusText}`,
        );
    } else if (response.status === 404) {
        return null;
    } else {
        return (await response.json()) as LuckPermsUserLookup;
    }
}

export async function getUserFromUuid(uuid: string): Promise<LuckPermsUser | null> {
    const response = await luckpermsHTTPRequest(
        `user/${uuid}`,
    );

    if (!response.ok && !(response.status === 404)) {
        throw new Error(
            `Failed to fetch LuckPerms user ${uuid}: ${response.status} ${response.statusText}`,
        );
    } else if (response.status === 404) {
        return null;
    } else {
        return (await response.json()) as LuckPermsUser;
    }
}

export async function addNodeToUser(uuid: string, node: {key: string, value: boolean}): Promise<boolean> {
    const response = await fetch(`${getConfig().luckpermsUrl}/user/${uuid}/nodes`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(node),
    });

    return response.ok;

}