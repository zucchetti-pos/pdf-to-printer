import execFileAsync from "../utils/exec-file-async";
import isValidPrinter from "../utils/windows-printer-valid";
import throwIfUnsupportedOperatingSystem from "../utils/throw-if-unsupported-os";
import { Printer } from "..";

async function getPrinters(): Promise<Printer[]> {
  function stdoutHandler(stdout: string) {
    try {
      let printersRaw;
      
      if (stdout.trim().startsWith("{") || stdout.trim().startsWith("[")) {
        printersRaw = JSON.parse(stdout);
      } else {
        throw new Error("Invalid JSON string");
      }

      const printersArray = Array.isArray(printersRaw)
        ? printersRaw
        : [printersRaw];

      return printersArray
        .map(({ DeviceID, Name, PrinterPaperNames }) => {
          const printerData = {
            deviceId: String(DeviceID),
            name: String(Name),
            paperSizes: PrinterPaperNames || [],
          };
          return isValidPrinter(printerData.name).isValid ? printerData : null;
        })
        .filter((printer): printer is Printer => printer !== null);
    } catch (error) {
      console.error("Erro ao processar saída do PowerShell:", error);
      return [];
    }
  }

  try {
    throwIfUnsupportedOperatingSystem();
    const { stdout } = await execFileAsync("Powershell.exe", [
      "-Command",
      "Get-CimInstance Win32_Printer | Select-Object DeviceID,Name,PrinterPaperNames | ConvertTo-Json -Compress",
    ]);
    return stdoutHandler(stdout);
  } catch (error) {
    throw error;
  }
}

export default getPrinters;