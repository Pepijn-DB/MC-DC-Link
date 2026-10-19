
export type UUID = string;

export interface LuckPermsUser {
    uniqueId: UUID;
    username?: string;
    parentGroups?: string[];
    nodes: LuckPermsNode[];
    metadata: LuckPermsMetadata;
}

export interface LuckPermsNode {
    key: string;
    type: LuckPermsNodeType;
    value: boolean;
    context: LuckPermsContext[];
    /** Expiration timestamp in Unix epoch seconds. */
    expiry?: number;
}

export type LuckPermsNodeType =
    | "permission"
    | "regex_permission"
    | "inheritance"
    | "prefix"
    | "suffix"
    | "meta"
    | "weight"
    | "display_name";

export interface LuckPermsContext {
    key: string;
    value: string;
}

export interface LuckPermsMetadata {
    meta: Record<string, unknown>;
    prefix?: string;
    suffix?: string;
    primaryGroup?: string;
}

/** Response from GET /user/search */
export interface LuckPermsUserSearchResult {
    uniqueId: UUID;
    results: LuckPermsNode[];
}

/** Response from GET /user/lookup */
export interface LuckPermsUserLookup {
    uniqueId: UUID;
    username?: string;
}

/** Request body for POST /user */
export interface LuckPermsNewUser {
    uniqueId: UUID;
    username: string;
}
