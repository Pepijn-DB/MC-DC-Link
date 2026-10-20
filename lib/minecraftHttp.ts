import type {MinecraftProfile} from "./types/minecraft.ts";
import {prisma} from "./db.ts";

const normalizeUuid = (uuid: string): string =>
    uuid.replaceAll("-", "").toLowerCase();

interface MinecraftUser {
    id: number
    uuid: string
    lowercaseName: string
    normalizedName: string
}

export async function isValidMinecraftUsername(username: string): Promise<boolean | null> {
    const response: Response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
    return response.status === 200
        ? true
        : response.status === 404
            ? false
            : null;
}

export async function getMinecraftProfilesBatch(
    uuids: string[],
): Promise<MinecraftProfile[]> {
    const uniqueUuids = [...new Set(uuids.map(normalizeUuid))];

    if (uniqueUuids.length === 0) return [];

    const cachedUsers = await prisma.minecraftUser.findMany({
        where: {
            uuid: { in: uniqueUuids },
        },
        select: {
            uuid: true,
            lowercaseName: true,
            normalizedName: true,
        },
    });

    const cachedUuids = new Set(cachedUsers.map((user:MinecraftUser) => normalizeUuid(user.uuid)));
    const missingUuids = uniqueUuids.filter((uuid) => !cachedUuids.has(uuid));

    const resolvedProfiles = await Promise.all(
        missingUuids.map(async (uuid) => {
            const response = await fetch(
                `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`,
            );

            if (response.status === 204 || response.status === 404) {
                return null;
            }

            if (!response.ok) {
                throw new Error(
                    `Mojang API error: ${response.status} ${response.statusText}`,
                );
            }

            const profile = await response.json() as MinecraftProfile;
            return {id: profile.id, name: profile.name};
        }),
    );

    const uncachedProfiles = resolvedProfiles.filter(
        (profile): profile is MinecraftProfile => profile !== null,
    );
    const batches = Array.from(
        {length: Math.ceil(uncachedProfiles.length / 10)},
        (_, index) => uncachedProfiles
            .slice(index * 10, index * 10 + 10)
            .map((profile) => profile.name),
    );

    const refreshedResults = await Promise.all(
        batches.map((batch) => getMinecraftProfiles(batch)),
    );

    const refreshedProfiles = refreshedResults.flat();

    if (refreshedProfiles.length > 0) {
        await prisma.minecraftUser.createMany({
            data: refreshedProfiles.map((profile) => ({
                uuid: profile.id.toLowerCase(),
                lowercaseName: profile.name.toLowerCase(),
                normalizedName: profile.name,
            })),
            skipDuplicates: true,
        });
    }

    const cachedProfiles = cachedUsers.map((user:MinecraftUser) => ({
        id: user.uuid,
        name: user.normalizedName,
    }));

    return [...cachedProfiles, ...refreshedProfiles];
}

export async function getMinecraftProfiles(
    usernames: string[],
): Promise<MinecraftProfile[]> {
    const response = await fetch(
        "https://api.mojang.com/profiles/minecraft",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(usernames),
        },
    );

    if (!response.ok) {
        throw new Error(
            `Mojang API error: ${response.status} ${response.statusText}`,
        );
    }

    return await response.json() as Promise<MinecraftProfile[]>;
}