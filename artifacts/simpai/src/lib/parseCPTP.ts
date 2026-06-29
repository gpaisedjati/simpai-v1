import * as XLSX from "xlsx";
import * as mammoth from "mammoth";

export interface ParsedCPTPRow {
  fase: string;
  kelas: string;
  semester: string;
  elemen: string;
  cp: string;
  tp: string;
  materi: string;
  subMateri: string;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // split base64 part
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

export async function parseCPTPFile(file: File, serverUrl: string, clientKey?: string): Promise<ParsedCPTPRow[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  let payload: any = {};
  
  // 1. If Excel / CSV -> read locally to CSV string to save tokens and use AI for restructuring
  if (extension === 'xlsx' || extension === 'xls' || extension === 'csv') {
    const data = await new Promise<any>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target?.result, { type: "binary" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const csvText = XLSX.utils.sheet_to_csv(firstSheet);
          resolve(csvText);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
    payload = { textContent: data };
  }
  // 2. If DOCX -> extract text using mammoth and send text to AI
  else if (extension === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    payload = { textContent: result.value };
  }
  // 3. If PDF or plain text -> send directly to Gemini AI
  else if (extension === 'pdf') {
    const base64 = await fileToBase64(file);
    payload = { data: base64, mimeType: 'application/pdf' };
  } else if (extension === 'txt') {
    const text = await file.text();
    payload = { textContent: text };
  } else {
    throw new Error("Format file tidak didukung. Harap unggah .xlsx, .csv, .docx, .pdf, atau .txt");
  }

  // Inject clientKey if exists
  if (clientKey) {
    payload.clientKey = clientKey;
  }

  // Hit the backend AI endpoint
  const response = await fetch(`${serverUrl}/api/ai/parse-cptp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.error || "Gagal mengekstrak data menggunakan AI.");
  }

  return resData.data as ParsedCPTPRow[];
}
