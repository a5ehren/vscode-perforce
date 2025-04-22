import * as sinon from "sinon";
import * as vscode from "vscode";
import quibble from "quibble";
import * as p4 from "../../api/PerforceApi";

import {
    ChangeInfo,
    ChangeSpec,
    FixedJob,
    FstatInfo,
    isUri,
    PerforceFile,
} from "../../api/CommonTypes";
import { Status } from "../../scm/Status";
import { PerforceService } from "../../PerforceService";
import { getStatusText } from "./testUtils";
import * as PerforceUri from "../../PerforceUri";
import { parseDate } from "../../TsUtils";

type PerforceResponseCallback = (
    err: Error | null,
    stdout: string,
    stderr: string
) => void;

export interface StubJob {
    name: string;
    description: string[];
}

export interface StubChangelist {
    chnum: string;
    description: string;
    submitted?: boolean;
    files: StubFile[];
    shelvedFiles?: StubFile[];
    jobs?: StubJob[];
}

export interface StubFile {
    localFile: vscode.Uri;
    suppressFstatClientFile?: boolean;
    depotPath: string;
    depotRevision: number;
    operation: Status;
    fileType?: string;
    resolveFromDepotPath?: string;
    resolveEndFromRev?: number;
}

export function stubExecute() {
    return sinon.stub(PerforceService, "execute").callsFake(executeStub);
}

function executeStub(
    _resource: vscode.Uri,
    command: string,
    responseCallback: PerforceResponseCallback,
    _args?: string[],
    _input?: string
) {
    setImmediate(() => {
        responseCallback(null, command, "");
    });
}

function makeDefaultInfo(resource: vscode.Uri) {
    const ret = new Map<string, string>();
    ret.set("User name", "user");
    ret.set("Client name", "cli");
    ret.set("Client root", resource.fsPath);
    ret.set("Current directory", resource.fsPath);
    return Promise.resolve(ret);
}

export class StubPerforceModel {
    public changelists: StubChangelist[];

    public isLoggedIn: sinon.SinonStub<[], Promise<boolean>>;
    public deleteChangelist: sinon.SinonStub<[vscode.Uri, string], Promise<string>>;
    public fixJob: sinon.SinonStub<[vscode.Uri, string, string, string], Promise<string>>;
    public getChangeSpec: sinon.SinonStub<[vscode.Uri, p4.ChangeSpecOptions], Promise<ChangeSpec>>;
    public getChangelists: sinon.SinonStub<[vscode.Uri, p4.ChangesOptions?], Promise<ChangeInfo[]>>;
    public getFixedJobs: sinon.SinonStub<[vscode.Uri, p4.GetFixedJobsOptions], Promise<FixedJob[]>>;
    public getFstatInfoMapped: sinon.SinonStub<[vscode.Uri, p4.FstatOptions], Promise<(FstatInfo | undefined)[]>>;
    public getInfo: sinon.SinonStub<[vscode.Uri], Promise<Map<string, string>>>;
    public getOpenedFiles: sinon.SinonStub<[vscode.Uri, p4.OpenedFileOptions], Promise<p4.OpenedFile[]>>;
    public getShelvedFiles: sinon.SinonStub<[vscode.Uri, p4.GetShelvedOptions], Promise<p4.ShelvedChangeInfo[]>>;
    public haveFile: sinon.SinonStub<[vscode.Uri, PerforceFile], Promise<boolean>>;
    public have: sinon.SinonStub<[vscode.Uri, p4.HaveFileOptions], Promise<p4.HaveFile | undefined>>;
    public reopenFiles: sinon.SinonStub<[vscode.Uri, string[], string], Promise<string>>;
    public revert: sinon.SinonStub<[vscode.Uri, p4.RevertOptions], Promise<string>>;
    public shelve: sinon.SinonStub<[vscode.Uri, p4.ShelveOptions], Promise<string>>;
    public submitChangelist: sinon.SinonStub<[vscode.Uri, string], Promise<{ rawOutput: string; chnum: string }>>;
    public sync: sinon.SinonStub<[vscode.Uri, p4.SyncOptions], Promise<string>>;
    public unshelve: sinon.SinonStub<[vscode.Uri, p4.UnshelveOptions], Promise<p4.UnshelvedFiles>>;
    public inputChangeSpec: sinon.SinonStub<[vscode.Uri, { spec: ChangeSpec }, p4.InputChangeSpecOptions?], Promise<{ chnum: string; rawOutput: string }>>;
    public del: sinon.SinonStub<[vscode.Uri, string[]], Promise<string>>;
    public move: sinon.SinonStub<[vscode.Uri, string, string], Promise<string>>;
    public edit: sinon.SinonStub<[vscode.Uri, string[]], Promise<string>>;
    public editIgnoringStdErr: sinon.SinonStub<[vscode.Uri, string[]], Promise<string>>;

    constructor() {
        this.changelists = [];

        // Create all stubs with proper type annotations
        this.isLoggedIn = sinon.stub<[], Promise<boolean>>().resolves(true);
        this.deleteChangelist = sinon.stub<[vscode.Uri, string], Promise<string>>().resolves("changelist deleted");
        this.fixJob = sinon.stub<[vscode.Uri, string, string, string], Promise<string>>().resolves("job fixed");
        this.getChangeSpec = sinon.stub<[vscode.Uri, p4.ChangeSpecOptions], Promise<ChangeSpec>>().callsFake(this.resolveChangeSpec.bind(this));
        this.getChangelists = sinon.stub<[vscode.Uri, p4.ChangesOptions?], Promise<ChangeInfo[]>>().callsFake(this.resolveChangelists.bind(this));
        this.getFixedJobs = sinon.stub<[vscode.Uri, p4.GetFixedJobsOptions], Promise<FixedJob[]>>().callsFake(this.resolveFixedJobs.bind(this));
        this.getFstatInfoMapped = sinon.stub<[vscode.Uri, p4.FstatOptions], Promise<(FstatInfo | undefined)[]>>().callsFake(this.fstatFiles.bind(this));
        this.getInfo = sinon.stub<[vscode.Uri], Promise<Map<string, string>>>().callsFake(makeDefaultInfo);
        this.getOpenedFiles = sinon.stub<[vscode.Uri, p4.OpenedFileOptions], Promise<p4.OpenedFile[]>>().callsFake(this.resolveOpenFiles.bind(this));
        this.getShelvedFiles = sinon.stub<[vscode.Uri, p4.GetShelvedOptions], Promise<p4.ShelvedChangeInfo[]>>().callsFake(this.resolveShelvedFiles.bind(this));
        this.haveFile = sinon.stub<[vscode.Uri, PerforceFile], Promise<boolean>>().resolves(true);
        this.have = sinon.stub<[vscode.Uri, p4.HaveFileOptions], Promise<p4.HaveFile | undefined>>().callsFake(this.resolveHave.bind(this));
        this.reopenFiles = sinon.stub<[vscode.Uri, string[], string], Promise<string>>().resolves("reopened");
        this.revert = sinon.stub<[vscode.Uri, p4.RevertOptions], Promise<string>>().resolves("reverted");
        this.shelve = sinon.stub<[vscode.Uri, p4.ShelveOptions], Promise<string>>().resolves("shelved");
        this.submitChangelist = sinon.stub<[vscode.Uri, string], Promise<{ rawOutput: string; chnum: string }>>().resolves({
            rawOutput: "submitting...\n change 250 submitted",
            chnum: "250",
        });
        this.sync = sinon.stub<[vscode.Uri, p4.SyncOptions], Promise<string>>().resolves("synced");
        this.unshelve = sinon.stub<[vscode.Uri, p4.UnshelveOptions], Promise<p4.UnshelvedFiles>>().resolves({
            files: [{ depotPath: "//depot/dummy", operation: "edit" }],
            warnings: []
        });
        this.inputChangeSpec = sinon.stub<[vscode.Uri, { spec: ChangeSpec }, p4.InputChangeSpecOptions?], Promise<{ chnum: string; rawOutput: string }>>().resolves({ 
            chnum: "99", 
            rawOutput: "Change 99 created" 
        });
        this.del = sinon.stub<[vscode.Uri, string[]], Promise<string>>().resolves("Files deleted");
        this.move = sinon.stub<[vscode.Uri, string, string], Promise<string>>().resolves("File moved");
        this.edit = sinon.stub<[vscode.Uri, string[]], Promise<string>>().resolves("File edited");
        this.editIgnoringStdErr = sinon.stub<[vscode.Uri, string[]], Promise<string>>().resolves("File edited");

        // Organize stubs by module
        // All basicOps stubs in a single quibble call
        quibble("../../api/commands/basicOps", {
            isLoggedIn: this.isLoggedIn,
            deleteChangelist: this.deleteChangelist,
            fixJob: this.fixJob,
            reopenFiles: this.reopenFiles,
            revert: this.revert,
            shelve: this.shelve,
            sync: this.sync,
            del: this.del,
            move: this.move,
            edit: {
                default: this.edit,
                ignoringAndHidingStdErr: this.editIgnoringStdErr
            },
            haveFile: this.haveFile,
            have: this.have,
            unshelve: this.unshelve,
            submitChangelist: this.submitChangelist
        });

        quibble("../../api/commands/changeSpec", {
            getChangeSpec: this.getChangeSpec,
            inputChangeSpec: this.inputChangeSpec
        });

        quibble("../../api/commands/fstat", {
            getFstatInfoMapped: this.getFstatInfoMapped
        });

        quibble("../../api/commands/opened", {
            getOpenedFiles: this.getOpenedFiles
        });

        quibble("../../api/commands/changes", {
            getChangelists: this.getChangelists
        });

        quibble("../../api/commands/describe", {
            getFixedJobs: this.getFixedJobs,
            getShelvedFiles: this.getShelvedFiles
        });
    }

    resolveOpenFiles(
        _resource: vscode.Uri,
        options: p4.OpenedFileOptions
    ): Promise<p4.OpenedFile[]> {
        return Promise.resolve(
            this.changelists
                .filter((cl) => (options.chnum ? cl.chnum === options.chnum : true))
                .flatMap((cl) =>
                    cl.files.map<p4.OpenedFile>((file) => {
                        return {
                            depotPath: file.depotPath,
                            revision: file.depotRevision.toString(),
                            chnum: cl.chnum,
                            filetype: file.fileType ?? "text",
                            message:
                                file.depotPath +
                                " opened for " +
                                getStatusText(file.operation),
                            operation: getStatusText(file.operation),
                        };
                    })
                )
        );
    }

    resolveChangelists(): Promise<ChangeInfo[]> {
        // Note - doesn't take account of options! (TODO if required)
        return Promise.resolve(
            this.changelists
                .filter((cl) => !cl.submitted && cl.chnum !== "default")
                .map<ChangeInfo>((cl) => {
                    return {
                        chnum: cl.chnum,
                        date: parseDate("01/01/2020"),
                        client: "cli",
                        user: "user",
                        description: cl.description.split("\n"),
                        isPending: true,
                    };
                })
        );
    }

    findFile(uri: vscode.Uri): [StubChangelist, StubFile] | undefined {
        const change = this.changelists.find((ch) =>
            ch.files.some((f) => f.localFile.fsPath === uri.fsPath)
        );
        const file = change?.files.find((f) => f.localFile.fsPath === uri.fsPath);
        return change && file ? [change, file] : undefined;
    }

    resolveHave(
        resource: vscode.Uri,
        options: p4.HaveFileOptions
    ): Promise<p4.HaveFile | undefined> {
        if (!isUri(options.file)) {
            throw new Error("Doesn't support non-uri types yet");
        }
        const details = this.findFile(options.file);
        if (!details) {
            return Promise.resolve(undefined);
        }
        const [, file] = details;
        return Promise.resolve({
            depotPath: file.depotPath,
            revision: file.depotRevision.toString(),
            depotUri: PerforceUri.fromDepotPath(
                resource,
                file.depotPath,
                file.depotRevision.toString()
            ),
            localUri: file.localFile,
        });
    }

    resolveFixedJobs(
        _resource: vscode.Uri,
        options: p4.GetFixedJobsOptions
    ): Promise<FixedJob[]> {
        const cl = this.changelists.find((cl) => cl.chnum === options.chnum);
        if (!cl) {
            return Promise.reject("Changelist does not exist");
        }
        return Promise.resolve(
            cl.jobs?.map<FixedJob>((job) => {
                return { description: job.description, id: job.name };
            }) ?? []
        );
    }

    resolveShelvedFiles(
        _resource: vscode.Uri,
        options: p4.GetShelvedOptions
    ): Promise<p4.ShelvedChangeInfo[]> {
        return Promise.resolve(
            this.changelists
                .filter((cl) => options.chnums.includes(cl.chnum))
                .map((cl) => {
                    return {
                        chnum: parseInt(cl.chnum),
                        paths: cl.shelvedFiles?.map((s) => s.depotPath),
                    };
                })
                .filter((cl): cl is p4.ShelvedChangeInfo => cl.paths !== undefined)
        );
    }

    fstatFile(
        depotPath: PerforceFile,
        chnum?: string,
        shelved?: boolean
    ): FstatInfo | undefined {
        const cl = this.changelists.find((c) =>
            chnum
                ? c.chnum === chnum
                : c.files.some((file) => file.depotPath === depotPath)
        );
        const file = shelved
            ? cl?.shelvedFiles?.find((file) => file.depotPath === depotPath)
            : cl?.files.find((file) => file.depotPath === depotPath);

        if (file) {
            return {
                depotFile: depotPath,
                clientFile: file.suppressFstatClientFile
                    ? undefined
                    : file.localFile.fsPath,
                isMapped: "true",
                haveRev: file.depotRevision.toString(),
                headType: file.fileType ?? "text",
                action: getStatusText(file.operation),
                workRev: file.depotRevision?.toString(),
                change: cl?.chnum,
                resolveFromFile0: file.resolveFromDepotPath,
                resolveEndFromRev0: file.resolveEndFromRev?.toString(),
            } as FstatInfo;
        }
    }

    fstatFiles(
        _resource: vscode.Uri,
        options: p4.FstatOptions
    ): Promise<(FstatInfo | undefined)[]> {
        const files = options.depotPaths.map((path) =>
            this.fstatFile(path, options.chnum, options.limitToShelved)
        );
        return Promise.resolve(files);
        //return Promise.reject("implement me");
    }

    resolveChangeSpec(
        _resource: vscode.Uri,
        options: p4.ChangeSpecOptions
    ): Promise<ChangeSpec> {
        if (options.existingChangelist) {
            const cl = this.changelists.find(
                (cl) => cl.chnum === options.existingChangelist
            );
            if (!cl) {
                return Promise.reject("No such changelist " + options.existingChangelist);
            }
            return Promise.resolve<ChangeSpec>({
                change: options.existingChangelist,
                description: cl.description,
                files: cl.files.map((file) => {
                    return {
                        action: getStatusText(file.operation),
                        depotPath: file.depotPath,
                    };
                }),
                rawFields: [{ name: "A field", value: ["don't know"] }],
            });
        }
        const cl = this.changelists.find((cl) => cl.chnum === "default");
        return Promise.resolve<ChangeSpec>({
            description: "<Enter description>",
            files: cl?.files.map((file) => {
                return {
                    action: getStatusText(file.operation),
                    depotPath: file.depotPath,
                };
            }),
            rawFields: [{ name: "A field", value: ["don't know"] }],
        });
    }
}
