import { getPrinters } from "../src";

async function testGetPrinters() {
  try {
    const printers = await getPrinters();
    console.log("Retorno da função getPrinters:", printers);
  } catch (error) {
    console.error("Erro ao obter impressoras:", error);
  }
}

testGetPrinters();
