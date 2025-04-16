import * as path from "path";
import Mocha from "mocha";
import * as glob from "glob";

export async function run(): Promise<void> {
    // Create the mocha test
    const mocha = new Mocha({
        ui: "bdd",
        color: true,
    });
    mocha.reporter("cypress-multi-reporters", {
        reporterEnabled: "mocha-junit-reporter, spec",
        mochaJunitReporterReporterOptions: {
            mochaFile: "./reports/junit-unit.xml",
        },
    });

    const testsRoot = __dirname;

    try {
        const files: string[] = await glob.glob("**/**.test.js", { cwd: testsRoot });
        
        // Add files to the test suite
        files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

        return new Promise<void>((c, e) => {
            try {
                // Run the mocha test
                mocha.run((failures) => {
                    if (failures > 0) {
                        e(new Error(`${failures} tests failed.`));
                    } else {
                        c();
                    }
                });
            } catch (err) {
                e(err);
            }
        });
    } catch (err) {
        throw err;
    }
}
