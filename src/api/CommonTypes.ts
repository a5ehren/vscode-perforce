import { Uri } from "vscode";

export interface NoOpts {}

export interface FixedJob { id: string; description: string[] }

export interface ChangeInfo {
    chnum: string;
    description: string[];
    date?: Date;
    user: string;
    client: string;
    isPending?: boolean;
}

export interface ChangeSpec {
    description?: string;
    files?: ChangeSpecFile[];
    change?: string;
    rawFields: RawField[];
}

export interface RawField {
    name: string;
    value: string[];
}

export interface ChangeSpecFile {
    depotPath: string;
    action: string;
}

export interface FstatInfo {
    depotFile: string;
    [key: string]: string;
}

export type PerforceFile = Uri | string;

export function isUri(obj: any): obj is Uri {
    return obj && obj.fsPath !== undefined && obj.scheme !== undefined;
}
