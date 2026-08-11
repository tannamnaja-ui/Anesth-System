// Some registry cases (e.g. still "รอการเปิด Visit") have no AN assigned
// yet — VN is used as a fallback identifier in that case. Only if a case
// has neither can its data-entry tabs not be loaded/saved at all.
export const NO_CASE_KEY_MESSAGE =
  'เคสนี้ไม่มีทั้งเลข AN และ VN จึงยังโหลด/บันทึกข้อมูลของแท็บนี้ไม่ได้';
