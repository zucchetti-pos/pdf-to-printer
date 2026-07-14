import { mocked } from "jest-mock";
import getPrinters from "./get-printers";
import execFileAsync from "../utils/exec-file-async";
import { Printer } from "..";

jest.mock("../utils/exec-file-async");
jest.mock("../utils/windows-printer-valid");
jest.mock("../utils/throw-if-unsupported-os");

const mockedExecFileAsync = mocked(execFileAsync);

const exactProblematicWindowsOutputAsLibraryJson = JSON.stringify([
  {
    DeviceID: "TANCA TP-650",
    Name: "TANCA TP-650",
    PrinterPaperNames: [
      "Printer 80(72.1) x 210 mm",
      "Printer 80(72.1) x 297 mm",
      "Printer 80(72.1) x 3276 mm",
      "Printer 80(72.1) x 99999 mm",
    ],
  },
  {
    DeviceID: "OneNote for Windows 10",
    Name: "OneNote for Windows 10",
    PrinterPaperNames: ["Carta", "A4"],
  },
  {
    DeviceID: "Microsoft XPS Document Writer",
    Name: "Microsoft XPS Document Writer",
    PrinterPaperNames: ["Carta", "Carta pequeno", "Tablóide", "Ledger..."],
  },
  {
    DeviceID: "Microsoft Print to PDF",
    Name: "Microsoft Print to PDF",
    PrinterPaperNames: ["Carta", "Tablóide", "Ofício", "Extrato..."],
  },
  {
    DeviceID: "Fax",
    Name: "Fax",
    PrinterPaperNames: ["Carta", "Carta pequeno", "Ofício", "Extrato..."],
  },
  {
    DeviceID: "AnyDesk Printer",
    Name: "AnyDesk Printer",
    PrinterPaperNames: ["Carta", "Tablóide", "Ofício", "Executivo..."],
  },
]);

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

  it("should parse the problematic Windows output converted to the library JSON format", async () => {
    mockedExecFileAsync.mockResolvedValue({
      stdout: exactProblematicWindowsOutputAsLibraryJson,
      stderr: "",
    });
    const consoleLog = jest
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await expect(getPrinters()).resolves.toEqual([
      {
        deviceId: "TANCA TP-650",
        name: "TANCA TP-650",
        paperSizes: [
          "Printer 80(72.1) x 210 mm",
          "Printer 80(72.1) x 297 mm",
          "Printer 80(72.1) x 3276 mm",
          "Printer 80(72.1) x 99999 mm",
        ],
      },
      {
        deviceId: "OneNote for Windows 10",
        name: "OneNote for Windows 10",
        paperSizes: ["Carta", "A4"],
      },
      {
        deviceId: "Microsoft XPS Document Writer",
        name: "Microsoft XPS Document Writer",
        paperSizes: ["Carta", "Carta pequeno", "Tablóide", "Ledger..."],
      },
      {
        deviceId: "Microsoft Print to PDF",
        name: "Microsoft Print to PDF",
        paperSizes: ["Carta", "Tablóide", "Ofício", "Extrato..."],
      },
      {
        deviceId: "Fax",
        name: "Fax",
        paperSizes: ["Carta", "Carta pequeno", "Ofício", "Extrato..."],
      },
      {
        deviceId: "AnyDesk Printer",
        name: "AnyDesk Printer",
        paperSizes: ["Carta", "Tablóide", "Ofício", "Executivo..."],
      },
    ]);

    consoleLog.mockRestore();
  });
});
