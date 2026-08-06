const express = require('express');
const { loadConnectionConfig } = require('../utils/connectionStore');
const { withConnection } = require('../utils/dbClient');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.officer) {
    return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' });
  }
  next();
}

router.use(requireAuth);

const BASE_QUERY = `
select o1.operation_set_id,
    o5.room_name,
    o1.hn,
    cast(concat(p.pname,p.fname,' ',p.lname) as varchar(250)) as patient_name,
    o1.operation_name,
    o1.an,
    d.name as doctor_name,
    o2.operation_set_type_name,
    o3.operation_time_type_name,
    o4.emergency_name,
    o1.operation_request_date,
    o1.operation_request_time,
    o1.operation_position,
    o1.emergency_id,
    o1.room_id,
    o1.operation_list_anes_type_id,
    o1.operation_set_cmpn_id,
    o1.anes_doctor_code,
    o1.screen_text,
    o1.operation_set_npo_time,
    o1.operation_set_npo_date,
    o1.bps,
    o1.bpd,
    o1.bw,
    o1.gcs_scale_eye_type_id,
    o1.operation_set_pc_type_id,
    o1.pulse,
    o1.gcs_scale_motor_type_id,
    o1.gcs_scale_verbal_type_id,
    o1.operation_set_depcode,
    o1.operation_set_resp_type_id,
    o1.rr,
    o1.temperature,
    o1.schedule_ok,
    o1.staff,
    o6.name as operation_type_name,
    o7.operation_list_anes_type_name,
    k1.department as set_department,
    w3.name as ward_name,
    o9.operation_list_anes_type_name as operation_list_anes_type_name_2,
    cast(o1.note as varchar(250)) as note,
    cast(o1.provision_diagnosis_text as varchar(250)) as provision_diagnosis_text
from operation_set o1
left outer join doctor d on d.code = o1.operation_set_doctor_code
left outer join operation_set_type o2 on o2.operation_set_type_id = o1.operation_set_type_id
left outer join operation_time_type o3 on o3.operation_time_type_id = o1.operation_time_type_id
left outer join operation_emergency o4 on o4.emergency_id = o1.emergency_id
left outer join operation_room o5 on o5.room_id = o1.room_id
left outer join operation_type o6 on o6.operation_type_id = o1.operation_type_id
left outer join operation_list_anes_type o7 on o7.operation_list_anes_type_id = o1.operation_list_anes_type_id
left outer join patient p on p.hn = o1.hn
left outer join operation_list_anes_type o9 on o9.operation_list_anes_type_id = o1.operation_list_anes_type_id
left outer join kskdepartment k1 on k1.depcode = o1.operation_set_depcode
left outer join ipt i3 on i3.an = o1.an
left outer join ward w3 on w3.ward = i3.ward
`;

router.get('/search', async (req, res) => {
  const { an, hn, dateFrom, dateTo } = req.query;
  const connectionConfig = loadConnectionConfig();
  if (!connectionConfig) {
    return res.status(400).json({ success: false, message: 'ยังไม่ได้ตั้งค่าการเชื่อมต่อฐานข้อมูล' });
  }
  const { dbType, ...dbConfig } = connectionConfig;

  const conditions = [];
  const params = [];
  const placeholder = () => (dbType === 'mysql' ? '?' : `$${params.length + 1}`);

  if (dateFrom && dateTo) {
    const fromPlaceholder = placeholder();
    params.push(dateFrom);
    const toPlaceholder = placeholder();
    params.push(dateTo);
    conditions.push(`o1.operation_set_date between ${fromPlaceholder} and ${toPlaceholder}`);
  }
  if (an) {
    conditions.push(`o1.an = ${placeholder()}`);
    params.push(an);
  }
  if (hn) {
    conditions.push(`o1.hn = ${placeholder()}`);
    params.push(hn);
  }

  const whereClause = conditions.length ? `where ${conditions.join(' and ')}` : '';
  const sql = `${BASE_QUERY} ${whereClause} order by o1.operation_set_date, o1.operation_set_time`;

  try {
    const rows = await withConnection(dbType, dbConfig, (conn) => conn.query(sql, params));
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: `ดึงข้อมูลผู้ป่วยไม่สำเร็จ: ${err.message}` });
  }
});

module.exports = router;
