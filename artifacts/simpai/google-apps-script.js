const SHEET_PROFIL = "Profil";
const SHEET_PEMETAAN = "Pemetaan";
const SHEET_PROMES = "Promes";
const SECRET_KEY = "GPAI-SeDjati"; // Sesuai dengan kode GS Bapak/Ibu

function doGet(e) {
  return out({ error: "Gunakan method POST atau GET dengan parameter yang sesuai" });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    
    // Opsional: Jika ingin menggunakan SECRET_KEY, aktifkan kode di bawah ini
    // dan pastikan di index.html bagian payload ditambahkan key: "GPAI-SeDjati"
    // if (body.key !== SECRET_KEY) {
    //   return out({ error: "Unauthorized" });
    // }

    switch (body.action) {
      case "save":
        return out(saveProfil(body.data));
      case "load":
        return out(loadProfil(body.token));
      case "save_pemetaan":
        return out(savePemetaan(body.Token_Akses, body.Fase_Semester, body.Paket_TP_ATP));
      case "load_pemetaan":
        return out(loadPemetaan(body.Token_Akses, body.Fase_Semester));
      case "save_promes":
        return out(savePromes(body.Token_Akses, body.Fase_Semester, body.Paket_Promes));
      case "load_promes":
        return out(loadPromes(body.Token_Akses, body.Fase_Semester));
      case "getAllUsers":
        return out(getAllUsers());
      case "addUser":
        return out(addUser(body));
      case "updateUser":
        return out(updateUser(body));
      case "deleteUser":
        return out(deleteUser(body));
      case "incrementQuota":
        return out(incrementQuota(body));
      case "getCPTP":
        return out(getCPTP());
      case "saveCPTP":
      case "updateCPTP":
        return out(saveCPTP(body.data));
      case "getKaldik":
        return out(getKaldik());
      case "saveKaldik":
      case "updateKaldik":
        return out(saveKaldik(body.data));
      default:
        return out({ result: "error", message: "Unknown action: " + body.action });
    }
  } catch (err) {
    return out({ result: "error", message: err.toString() });
  }
}

// -------------------------------------------------------------
// FUNGSI PROFIL
// -------------------------------------------------------------
function saveProfil(data) {
  const sheet = getOrCreateSheet(SHEET_PROFIL);
  const rows = sheet.getDataRange().getValues();
  const token = data.Token_Akses;
  
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === token) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowData = [
    token, 
    JSON.stringify(data) // Simpan semua data sebagai JSON string untuk kemudahan
  ];

  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, 2).setValues([rowData]);
  } else {
    // Jika header belum ada
    if(rows.length === 1 && rows[0][0] === "") {
        sheet.getRange(1, 1, 1, 2).setValues([["Token", "Data_JSON"]]);
    }
    sheet.appendRow(rowData);
  }

  return { result: "success", message: "Data Profil Berhasil Disimpan!" };
}

function loadProfil(token) {
  const sheet = getOrCreateSheet(SHEET_PROFIL);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === token) {
      return { result: "success", data: JSON.parse(rows[i][1]) };
    }
  }
  return { result: "error", message: "Token tidak ditemukan" };
}

// -------------------------------------------------------------
// FUNGSI PEMETAAN
// -------------------------------------------------------------
function savePemetaan(token, faseSemester, paketData) {
  const sheet = getOrCreateSheet(SHEET_PEMETAAN);
  const rows = sheet.getDataRange().getValues();
  const id = token + "_" + faseSemester;
  
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowData = [id, token, faseSemester, JSON.stringify(paketData)];

  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, 4).setValues([rowData]);
  } else {
    if(rows.length === 1 && rows[0][0] === "") {
        sheet.getRange(1, 1, 1, 4).setValues([["ID", "Token", "Fase_Semester", "Data_JSON"]]);
    }
    sheet.appendRow(rowData);
  }

  return { result: "success", message: "Data Pemetaan Berhasil Disimpan!" };
}

function loadPemetaan(token, faseSemester) {
  const sheet = getOrCreateSheet(SHEET_PEMETAAN);
  const rows = sheet.getDataRange().getValues();
  const id = token + "_" + faseSemester;
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      return { result: "success", data: JSON.parse(rows[i][3]) };
    }
  }
  return { result: "error", message: "Data belum ada" };
}

// -------------------------------------------------------------
// FUNGSI PROMES
// -------------------------------------------------------------
function savePromes(token, faseSemester, paketPromes) {
  const sheet = getOrCreateSheet(SHEET_PROMES);
  const rows = sheet.getDataRange().getValues();
  const id = token + "_" + faseSemester;
  
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowData = [id, token, faseSemester, JSON.stringify(paketPromes)];

  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, 4).setValues([rowData]);
  } else {
    if(rows.length === 1 && rows[0][0] === "") {
        sheet.getRange(1, 1, 1, 4).setValues([["ID", "Token", "Fase_Semester", "Data_JSON"]]);
    }
    sheet.appendRow(rowData);
  }

  return { result: "success", message: "Data Promes Berhasil Disimpan!" };
}

function loadPromes(token, faseSemester) {
  const sheet = getOrCreateSheet(SHEET_PROMES);
  const rows = sheet.getDataRange().getValues();
  const id = token + "_" + faseSemester;
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      return { result: "success", data: JSON.parse(rows[i][3]) };
    }
  }
  return { result: "error", message: "Data belum ada" };
}

// -------------------------------------------------------------
// UTILS
// -------------------------------------------------------------
function getOrCreateSheet(sheetName) {
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

// -------------------------------------------------------------
// FUNGSI USERS
// -------------------------------------------------------------
function getAllUsers() {
  const sheet = getOrCreateSheet("users");
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return { users: [] };
  
  const headers = rows[0];
  const users = [];
  for (let i = 1; i < rows.length; i++) {
    let user = {};
    for (let j = 0; j < headers.length; j++) {
      user[headers[j]] = rows[i][j];
    }
    users.push(user);
  }
  return { users };
}

function addUser(body) {
  const sheet = getOrCreateSheet("users");
  const rows = sheet.getDataRange().getValues();
  
  if (rows.length === 1 && rows[0][0] === "") {
    sheet.getRange(1, 1, 1, 5).setValues([["username", "password", "kuotaMaks", "kuotaTerpakai", "status"]]);
  }
  
  sheet.appendRow([body.username, body.password, body.kuotaMaks, 0, body.status]);
  return { success: true };
}

function updateUser(body) {
  const sheet = getOrCreateSheet("users");
  const rows = sheet.getDataRange().getValues();
  
  const headers = rows[0];
  const colUsername = headers.indexOf("username");
  const colPassword = headers.indexOf("password");
  const colKuotaMaks = headers.indexOf("kuotaMaks");
  const colKuotaTerpakai = headers.indexOf("kuotaTerpakai");
  const colStatus = headers.indexOf("status");

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][colUsername] == body.username) {
      if (body.password !== undefined && colPassword !== -1) sheet.getRange(i + 1, colPassword + 1).setValue(body.password);
      if (body.kuotaMaks !== undefined && colKuotaMaks !== -1) sheet.getRange(i + 1, colKuotaMaks + 1).setValue(body.kuotaMaks);
      if (body.kuotaTerpakai !== undefined && colKuotaTerpakai !== -1) sheet.getRange(i + 1, colKuotaTerpakai + 1).setValue(body.kuotaTerpakai);
      if (body.status !== undefined && colStatus !== -1) sheet.getRange(i + 1, colStatus + 1).setValue(body.status);
      return { success: true };
    }
  }
  return { error: "User not found" };
}

function incrementQuota(body) {
  const sheet = getOrCreateSheet("users");
  const rows = sheet.getDataRange().getValues();
  
  const headers = rows[0];
  const colUsername = headers.indexOf("username");
  const colKuotaTerpakai = headers.indexOf("kuotaTerpakai");
  
  if (colUsername === -1 || colKuotaTerpakai === -1) return { error: "Column not found" };

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][colUsername] == body.username) {
      const current = Number(rows[i][colKuotaTerpakai]) || 0;
      sheet.getRange(i + 1, colKuotaTerpakai + 1).setValue(current + 1);
      return { success: true };
    }
  }
  return { error: "User not found" };
}

function deleteUser(body) {
  const sheet = getOrCreateSheet("users");
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] == body.username) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { error: "User not found" };
}

// -------------------------------------------------------------
// FUNGSI CPTP (Mendukung format tabel manual maupun JSON_DATA backup)
// -------------------------------------------------------------
function getCPTP() {
  const sheet = getOrCreateSheet("cptp");
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return { data: [] };
  
  // Deteksi format JSON lama
  if (rows[0][0] === "Data_JSON" || rows[0][0] === "JSON_DATA") {
    try {
      return { data: JSON.parse(rows[1][0]) };
    } catch(e) {
      return { data: [] };
    }
  }
  
  // Format manual tabel tabular
  const headers = rows[0].map(h => String(h).trim().toLowerCase());
  const data = [];
  for (let i = 1; i < rows.length; i++) {
    let rowObj = {};
    let hasData = false;
    for (let j = 0; j < headers.length; j++) {
      const val = rows[i][j];
      let key = headers[j];
      
      // Standarisasi key CPTP
      if (key === "fase") key = "fase";
      else if (key === "kelas") key = "kelas";
      else if (key === "semester") key = "semester";
      else if (key === "elemen") key = "elemen";
      else if (key === "cp" || key === "capaian") key = "cp";
      else if (key === "tp" || key === "tujuan") key = "tp";
      else if (key === "materi") key = "materi";
      else if (key === "sub materi" || key === "sub_materi" || key === "submateri") key = "subMateri";
      
      rowObj[key] = val;
      if (val !== "") hasData = true;
    }
    if (hasData) {
      data.push(rowObj);
    }
  }
  return { data };
}

function saveCPTP(data) {
  const sheet = getOrCreateSheet("cptp");
  sheet.clear();
  sheet.getRange(1, 1).setValue("Data_JSON");
  sheet.getRange(2, 1).setValue(JSON.stringify(data));
  return { success: true };
}

// -------------------------------------------------------------
// FUNGSI KALDIK (SANGAT CERDAS - Mendukung format tabel manual maupun JSON_DATA backup)
// -------------------------------------------------------------
function getKaldik() {
  const sheet = getOrCreateSheet("kaldik");
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return { data: [] };
  
  // Deteksi format JSON lama
  if (rows[0][0] === "Data_JSON" || rows[0][0] === "JSON_DATA") {
    try {
      return { data: JSON.parse(rows[1][0]) };
    } catch(e) {
      return { data: [] };
    }
  }

  // Format manual tabel tabular (Tanggal | Nama Agenda | Tipe | Target_Jenjang)
  const headers = rows[0].map(h => String(h).trim().toLowerCase());
  const data = [];
  
  for (let i = 1; i < rows.length; i++) {
    let rowObj = {};
    let hasData = false;
    
    for (let j = 0; j < headers.length; j++) {
      const val = rows[i][j];
      let formattedVal = val;
      
      // Ubah format Date Google Sheets menjadi string standard YYYY-MM-DD
      if (val instanceof Date) {
        const year = val.getFullYear();
        const month = String(val.getMonth() + 1).padStart(2, '0');
        const day = String(val.getDate()).padStart(2, '0');
        formattedVal = `${year}-${month}-${day}`;
      }
      
      let key = headers[j];
      // Standarisasi key Kaldik agar cocok dengan program frontend
      if (key === "tanggal" || key === "tgl") {
        key = "tanggal";
      } else if (key === "nama agenda" || key === "nama_agenda" || key === "agenda" || key === "judul") {
        key = "judul";
      } else if (key === "tipe" || key === "jenis" || key === "kategori") {
        key = "tipe";
      } else if (key === "target_jenjang" || key === "target jenjang" || key === "jenjang") {
        key = "target_jenjang";
      }
      
      rowObj[key] = formattedVal;
      if (val !== "") hasData = true;
    }
    
    if (hasData) {
      if (!rowObj.id) {
        rowObj.id = "gsheet-kaldik-" + i;
      }
      data.push(rowObj);
    }
  }
  return { data };
}

function saveKaldik(data) {
  const sheet = getOrCreateSheet("kaldik");
  sheet.clear();
  sheet.getRange(1, 1).setValue("Data_JSON");
  sheet.getRange(2, 1).setValue(JSON.stringify(data));
  return { success: true };
}

// -------------------------------------------------------------
// OUTPUT UTILS
// -------------------------------------------------------------
function out(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
