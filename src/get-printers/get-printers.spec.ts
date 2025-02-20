import { mocked } from "jest-mock";
import getPrinters from "./get-printers";
import execFileAsync from "../utils/exec-file-async";
import isValidPrinter from "../utils/windows-printer-valid";
import throwIfUnsupportedOperatingSystem from "../utils/throw-if-unsupported-os";
import { Printer } from "..";

jest.mock("../utils/exec-file-async");
jest.mock("../utils/windows-printer-valid");
jest.mock("../utils/throw-if-unsupported-os");

const mockedExecFileAsync = mocked(execFileAsync);
const mockedIsValidPrinter = mocked(isValidPrinter);
const mockedThrowIfUnsupportedOperatingSystem = mocked(throwIfUnsupportedOperatingSystem);

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
    
    // Mock execFileAsync to return the mocked stdout
    mockedExecFileAsync.mockResolvedValue({ stdout: mockPrinterListStdout, stderr: "" });
    
    // Mock isValidPrinter to return valid printers
    mockedIsValidPrinter.mockReturnValue({ isValid: true });

    const result: Printer[] = await getPrinters();

    expect(result).toEqual([
      { deviceId: "OneNote", name: "OneNote", paperSizes: [] },
      { deviceId: "Microsoft-XPS-Document-Writer", name: "Microsoft XPS Document Writer", paperSizes: [] },
      { deviceId: "Microsoft_Print_to_PDF", name: "Microsoft Print to PDF", paperSizes: [] }
    ]);
  });

  it("should return an empty array when no printers are found", async () => {
    const stdout = `[]`; // Empty JSON array
    mockedExecFileAsync.mockResolvedValue({ stdout, stderr: "" });
    mockedIsValidPrinter.mockReturnValue({ isValid: false }); // No valid printers

    const result = await getPrinters();

    expect(result).toEqual([]);
  });

  it("should throw an error when PowerShell command fails", async () => {
    mockedExecFileAsync.mockRejectedValue(new Error("PowerShell command failed"));

    await expect(getPrinters()).rejects.toThrow("PowerShell command failed");
  });

  it("should handle printers with custom paper sizes", async () => {
    const customPrinterStdout = `
    [
      {"DeviceID": "Canon-Printer", "Name": "Canon Printer", "PrinterPaperNames": ["A4", "Letter"]}
    ]
    `;
    
    mockedExecFileAsync.mockResolvedValue({ stdout: customPrinterStdout, stderr: "" });
    mockedIsValidPrinter.mockReturnValue({ isValid: true });

    const result: Printer[] = await getPrinters();

    expect(result).toEqual([
      { deviceId: "Canon-Printer", name: "Canon Printer", paperSizes: ["A4", "Letter"] }
    ]);
  });
});
