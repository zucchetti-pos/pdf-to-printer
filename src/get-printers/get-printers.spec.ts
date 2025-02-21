import { mocked } from "jest-mock";
import getPrinters from "./get-printers";
import execFileAsync from "../utils/exec-file-async";
import { Printer } from "..";

jest.mock("../utils/exec-file-async");
jest.mock("../utils/windows-printer-valid");
jest.mock("../utils/throw-if-unsupported-os");

const mockedExecFileAsync = mocked(execFileAsync);

describe("getPrinters", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return a list of valid printers when PowerShell command succeeds", async () => {
    const mockPrinterListStdout = `
    [
      {"DeviceID": "OneNote", "Name": "OneNote", "PrinterPaperNames": []},
      {"DeviceID": "Microsoft-XPS-Document-Writer", "Name": "Microsoft XPS Document Writer", "PrinterPaperNames": []},
      {"DeviceID": "Microsoft_Print_to_PDF", "Name": "Microsoft Print to PDF", "PrinterPaperNames": []}
    ]
    `;

    mockedExecFileAsync.mockResolvedValue({
      stdout: mockPrinterListStdout,
      stderr: "",
    });

    const result: Printer[] = await getPrinters();

    expect(result).toEqual([
      { deviceId: "OneNote", name: "OneNote", paperSizes: [] },
      {
        deviceId: "Microsoft-XPS-Document-Writer",
        name: "Microsoft XPS Document Writer",
        paperSizes: [],
      },
      {
        deviceId: "Microsoft_Print_to_PDF",
        name: "Microsoft Print to PDF",
        paperSizes: [],
      },
    ]);
  });

  it("should return an empty array when no printers are found", async () => {
    const stdout = `[]`;
    mockedExecFileAsync.mockResolvedValue({ stdout, stderr: "" });

    const result = await getPrinters();

    expect(result).toEqual([]);
  });

  it("should handle printers with custom paper sizes", async () => {
    const customPrinterStdout = `
    [
      {"DeviceID": "Canon-Printer", "Name": "Canon Printer", "PrinterPaperNames": ["A4", "Letter"]}
    ]
    `;

    mockedExecFileAsync.mockResolvedValue({
      stdout: customPrinterStdout,
      stderr: "",
    });

    const result: Printer[] = await getPrinters();

    expect(result).toEqual([
      {
        deviceId: "Canon-Printer",
        name: "Canon Printer",
        paperSizes: ["A4", "Letter"],
      },
    ]);
  });
});
