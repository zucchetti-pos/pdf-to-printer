import { Printer } from "..";
import execFileAsync from "../utils/exec-file-async";

async function getPrinters(): Promise<Printer[]> {
  function stdoutHandler(stdout: string) {
    try {
      if (!stdout || stdout.trim().length === 0) {
        throw new Error("Saída do PowerShell vazia ou inválida.");
      }

      if (!(stdout.trim().startsWith("{") || stdout.trim().startsWith("["))) {
        throw new Error("Saída não é um JSON válido.");
      }

      const printersRaw = JSON.parse(stdout);
      const printersArray = Array.isArray(printersRaw)
        ? printersRaw
        : [printersRaw];

      return printersArray.map(({ DeviceID, Name, PrinterPaperNames }) => {
        return {
          deviceId: String(DeviceID),
          name: String(Name),
          paperSizes: (PrinterPaperNames || []).map((paperName: string) => String(paperName)),
        };
      });
    } catch (error) {
      console.error(
        "Erro ao processar saída do PowerShell:",
        error instanceof Error ? error.message : error
      );
      return [];
    }
  }

  try {
    const { stdout } = await execFileAsync("Powershell.exe", [
      "-Command",
      "Get-CimInstance Win32_Printer | Select-Object DeviceID,Name,PrinterPaperNames | ConvertTo-Json -Compress",
    ]);

    let fixedString = Buffer.from(stdout, 'latin1').toString('utf8');

    console.log(fixedString)
    return stdoutHandler(stdout);
  } catch (error) {
    console.error(
      "Erro ao executar comando do PowerShell:",
      error instanceof Error ? error.message : error
    );
    throw error;
  }
}

export default getPrinters;
