// Mock data matching the database schema
// This data structure mirrors the SQL tables defined in schema.sql

// 1.1 PERSON (บุคคล)
export const persons = [
  {
    PersonID: 1,
    FirstName: 'สมชาย',
    LastName: 'ดวงดี',
    Alias: 'เสือใหญ่',
    NationalID: '1100700123456',
    DateOfBirth: '1985-03-15',
    Gender: 'M',
    HomeAddress: '123/45 ซ.ลาดพร้าว 71 แขวงลาดพร้าว เขตลาดพร้าว',
    CurrentAddress: '789/12 ถ.รัชดาภิเษก แขวงดินแดง เขตดินแดง',
    RiskLevel: 'High',
    Status: 'Arrested',
    Notes: 'หัวหน้าเครือข่ายค้ายาเสพติดภาคเหนือ',
    PhotoURL: 'https://ui-avatars.com/api/?name=สมชาย+ดวงดี&background=dc2626&color=fff',
    CurrentAddressID: 1
  },
  {
    PersonID: 2,
    FirstName: 'วิชัย',
    LastName: 'แสงทอง',
    Alias: 'ไอ้หนุ่ม',
    NationalID: '1509900234567',
    DateOfBirth: '1990-07-22',
    Gender: 'M',
    HomeAddress: '456 หมู่ 3 ต.แม่สาย อ.แม่สาย',
    CurrentAddress: null,
    RiskLevel: 'Medium',
    Status: 'Suspect',
    Notes: 'ผู้ติดต่อประสานงานกับเครือข่ายต่างประเทศ',
    PhotoURL: 'https://ui-avatars.com/api/?name=วิชัย+แสงทอง&background=f59e0b&color=fff',
    CurrentAddressID: 2
  },
  {
    PersonID: 3,
    FirstName: 'มาลี',
    LastName: 'จันทร์ดี',
    Alias: 'แม่มด',
    NationalID: '3100500345678',
    DateOfBirth: '1982-11-08',
    Gender: 'F',
    HomeAddress: '789/1 ถ.สุขุมวิท แขวงคลองตัน เขตคลองเตย',
    CurrentAddress: '789/1 ถ.สุขุมวิท แขวงคลองตัน เขตคลองเตย',
    RiskLevel: 'Critical',
    Status: 'Active',
    Notes: 'ผู้จัดหาเงินทุนและฟอกเงิน',
    PhotoURL: 'https://ui-avatars.com/api/?name=มาลี+จันทร์ดี&background=9333ea&color=fff',
    CurrentAddressID: 3
  },
  {
    PersonID: 4,
    FirstName: 'ประสิทธิ์',
    LastName: 'เจริญสุข',
    Alias: 'ป๋าสิทธิ์',
    NationalID: '5100600456789',
    DateOfBirth: '1975-05-20',
    Gender: 'M',
    HomeAddress: '321 หมู่ 5 ต.ท่าขี้เหล็ก อ.แม่สาย',
    CurrentAddress: null,
    RiskLevel: 'High',
    Status: 'Active',
    Notes: 'ผู้ประสานงานขนส่งยาข้ามพรมแดน',
    PhotoURL: 'https://ui-avatars.com/api/?name=ประสิทธิ์+เจริญสุข&background=dc2626&color=fff',
    CurrentAddressID: 4
  },
  {
    PersonID: 5,
    FirstName: 'นภา',
    LastName: 'สุขใจ',
    Alias: 'อ้อย',
    NationalID: '1100800567890',
    DateOfBirth: '1995-09-12',
    Gender: 'F',
    HomeAddress: '555/99 คอนโดวิวทะเล ซ.สุขุมวิท 21',
    CurrentAddress: null,
    RiskLevel: 'Low',
    Status: 'Released',
    Notes: 'อดีตผู้ขนยา ให้ความร่วมมือในการสืบสวน',
    PhotoURL: 'https://ui-avatars.com/api/?name=นภา+สุขใจ&background=22c55e&color=fff',
    CurrentAddressID: 5
  },

  // ============================================================
  // OPERATION PHANTOM GARAGE — Bangkok Luxury Auto-Theft Ring
  // ============================================================
  {
    PersonID: 101,
    FirstName: 'ธนกร',
    LastName: 'วงศ์ประเสริฐ',
    Alias: 'บอส ธน',
    NationalID: '1100200891234',
    DateOfBirth: '1978-08-04',
    Gender: 'M',
    HomeAddress: '88/8 หมู่บ้านเศรษฐสิริ ถ.ประดิษฐ์มนูธรรม แขวงลาดพร้าว',
    CurrentAddress: '88/8 หมู่บ้านเศรษฐสิริ ถ.ประดิษฐ์มนูธรรม แขวงลาดพร้าว',
    RiskLevel: 'Critical',
    Status: 'Active',
    Notes: 'เจ้าของอู่ซ่อมรถหรู ถูกสงสัยว่าเป็นหัวหน้าขบวนการโจรกรรมรถยนต์หรูเพื่อส่งออก มีความเชื่อมโยงกับกลุ่มค้ารถข้ามชาติ',
    PhotoURL: 'https://ui-avatars.com/api/?name=ธนกร+วงศ์&background=7c3aed&color=fff',
    CurrentAddressID: 101
  },
  {
    PersonID: 102,
    FirstName: 'สมชาย',
    LastName: 'คำดี',
    Alias: 'ช่างเปี๊ยก',
    NationalID: '1100300956789',
    DateOfBirth: '1988-12-19',
    Gender: 'M',
    HomeAddress: '213 ซ.รามคำแหง 39 แขวงพลับพลา เขตวังทองหลาง',
    CurrentAddress: '213 ซ.รามคำแหง 39 แขวงพลับพลา เขตวังทองหลาง',
    RiskLevel: 'High',
    Status: 'Suspect',
    Notes: 'ช่างเทคนิคฝีมือดี ผู้เชี่ยวชาญถอดชิ้นส่วนและปลอมหมายเลขเครื่องยนต์ มีหมายเรียกจากตำรวจท้องที่',
    PhotoURL: 'https://ui-avatars.com/api/?name=สมชาย+คำ&background=ea580c&color=fff',
    CurrentAddressID: 102
  },
  {
    PersonID: 103,
    FirstName: 'ปิยะ',
    LastName: 'ศรีวิชัย',
    Alias: 'ไอ้ปิ๊ก',
    NationalID: '1100400678901',
    DateOfBirth: '1993-05-30',
    Gender: 'M',
    HomeAddress: '456/12 ซ.สุขุมวิท 77 แขวงพระโขนงเหนือ เขตวัฒนา',
    CurrentAddress: null,
    RiskLevel: 'Medium',
    Status: 'Active',
    Notes: 'นักขับรถมืออาชีพ เคยรับจ้างย้ายรถจากจุดเกิดเหตุไปยังอู่ซ่อม มีประวัติคดีลักทรัพย์เล็กน้อย',
    PhotoURL: 'https://ui-avatars.com/api/?name=ปิยะ+ศรี&background=0ea5e9&color=fff',
    CurrentAddressID: 103
  },
  {
    PersonID: 104,
    FirstName: 'รัตนา',
    LastName: 'พิทักษ์ธรรม',
    Alias: 'พี่รัตน์',
    NationalID: '1100500789012',
    DateOfBirth: '1980-02-14',
    Gender: 'F',
    HomeAddress: '99/3 ถ.เจริญกรุง แขวงสีลม เขตบางรัก',
    CurrentAddress: '99/3 ถ.เจริญกรุง แขวงสีลม เขตบางรัก',
    RiskLevel: 'High',
    Status: 'Active',
    Notes: 'นายหน้าเอกสารปลอม ผู้ปลอมแปลงเอกสารส่งออกและทะเบียนรถ เชื่อมโยงกับท่าเรือคลองเตย',
    PhotoURL: 'https://ui-avatars.com/api/?name=รัตนา+พิทักษ์&background=db2777&color=fff',
    CurrentAddressID: 104
  },

  // ============================================================
  // OPERATION MEKONG SERPENT — Cross-Provincial Wildlife/Vehicle
  // Smuggling Syndicate (เชียงราย → พิษณุโลก → อยุธยา → ชลบุรี)
  // ============================================================
  {
    PersonID: 201,
    FirstName: 'อาทิตย์',
    LastName: 'แสงจันทร์',
    Alias: 'อ้ายเสือ',
    NationalID: '5700100201345',
    DateOfBirth: '1976-04-12',
    Gender: 'M',
    HomeAddress: '78/2 หมู่ 6 ต.แม่จัน อ.แม่จัน จ.เชียงราย',
    CurrentAddress: '78/2 หมู่ 6 ต.แม่จัน อ.แม่จัน จ.เชียงราย',
    RiskLevel: 'Critical',
    Status: 'Active',
    Notes: 'ผู้บงการเครือข่ายลักลอบขนสัตว์ป่าและรถยนต์หรูข้ามจังหวัด มีความเชื่อมโยงกับนายทุนเมียนมาร์และลาว ใช้เส้นทางขนส่งจากชายแดนเหนือถึงท่าเรือแหลมฉบัง',
    PhotoURL: 'https://ui-avatars.com/api/?name=อาทิตย์+แสง&background=7c3aed&color=fff',
    CurrentAddressID: 201
  },
  {
    PersonID: 202,
    FirstName: 'จิรายุ',
    LastName: 'ปัญญาวุฒิ',
    Alias: 'หนุ่มรถบรรทุก',
    NationalID: '6500200312456',
    DateOfBirth: '1989-09-28',
    Gender: 'M',
    HomeAddress: '123 หมู่ 4 ต.ท่าทอง อ.เมือง จ.พิษณุโลก',
    CurrentAddress: '123 หมู่ 4 ต.ท่าทอง อ.เมือง จ.พิษณุโลก',
    RiskLevel: 'High',
    Status: 'Arrested',
    Notes: 'คนขับรถบรรทุกประจำเส้นทาง รับจ้างขนส่งของผิดกฎหมายจากชายแดนเหนือลงใต้ ถูกจับพร้อมของกลางที่ด่านตรวจพิษณุโลก',
    PhotoURL: 'https://ui-avatars.com/api/?name=จิรายุ+ปัญญา&background=ea580c&color=fff',
    CurrentAddressID: 202
  },
  {
    PersonID: 203,
    FirstName: 'ชาลิสา',
    LastName: 'เจริญรัตน์',
    Alias: 'พี่ลิซ่า',
    NationalID: '1400300423567',
    DateOfBirth: '1984-01-17',
    Gender: 'F',
    HomeAddress: '56/9 ถ.โรจนะ ต.ท่าวาสุกรี อ.พระนครศรีอยุธยา จ.พระนครศรีอยุธยา',
    CurrentAddress: '56/9 ถ.โรจนะ ต.ท่าวาสุกรี อ.พระนครศรีอยุธยา จ.พระนครศรีอยุธยา',
    RiskLevel: 'High',
    Status: 'Active',
    Notes: 'ผู้เชี่ยวชาญปลอมแปลงเอกสารศุลกากรและใบอนุญาตส่งออก ดำเนินการร้านถ่ายเอกสารเป็นฉากบังหน้า มีเครือข่ายติดต่อเจ้าหน้าที่ศุลกากรทุจริต',
    PhotoURL: 'https://ui-avatars.com/api/?name=ชาลิสา+เจริญ&background=db2777&color=fff',
    CurrentAddressID: 203
  },
  {
    PersonID: 204,
    FirstName: 'ภูวดล',
    LastName: 'ทองประดิษฐ์',
    Alias: 'ป๋าดล',
    NationalID: '2000400534678',
    DateOfBirth: '1972-11-03',
    Gender: 'M',
    HomeAddress: '199/88 หมู่บ้านศรีราชาวิลเลจ ต.ศรีราชา อ.ศรีราชา จ.ชลบุรี',
    CurrentAddress: '199/88 หมู่บ้านศรีราชาวิลเลจ ต.ศรีราชา อ.ศรีราชา จ.ชลบุรี',
    RiskLevel: 'Critical',
    Status: 'Active',
    Notes: 'นายหน้าท่าเรือแหลมฉบัง ดำเนินการบริษัทนำเข้าส่งออกเป็นฉากบังหน้า มีความสัมพันธ์กับเจ้าหน้าที่ศุลกากรและตัวแทนขนส่ง รับผิดชอบจัดการตู้คอนเทนเนอร์ส่งออกปลายทางเวียดนามและจีน',
    PhotoURL: 'https://ui-avatars.com/api/?name=ภูวดล+ทอง&background=7c3aed&color=fff',
    CurrentAddressID: 204
  },
  {
    PersonID: 205,
    FirstName: 'กมลชนก',
    LastName: 'สุขสวัสดิ์',
    Alias: 'อ้อม',
    NationalID: '5700500645789',
    DateOfBirth: '1996-06-22',
    Gender: 'F',
    HomeAddress: '34/1 หมู่ 2 ต.เวียงพางคำ อ.แม่สาย จ.เชียงราย',
    CurrentAddress: null,
    RiskLevel: 'Medium',
    Status: 'Suspect',
    Notes: 'ผู้ประสานงานชายแดน รับหน้าที่ติดต่อนายหน้าฝั่งเมียนมาร์และจัดการขนส่งสินค้าข้ามแดนผ่านจุดผ่อนปรนชั่วคราว มีประวัติเดินทางเข้า-ออกท่าขี้เหล็กบ่อยครั้ง',
    PhotoURL: 'https://ui-avatars.com/api/?name=กมลชนก+สุข&background=0ea5e9&color=fff',
    CurrentAddressID: 205
  }
];

// 1.2 CASE (คดี)
export const cases = [
  {
    CaseID: 1,
    CaseNumber: 'NCB-CR-2567-0001',
    CaseType: 'Trafficking',
    ArrestDate: '2024-01-15T14:30:00',
    LocationID: 6,
    Status: 'Adjudicated',
    Description: 'จับกุมเครือข่ายค้ายาบ้ารายใหญ่พื้นที่ภาคเหนือ',
    OfficerInCharge: 'พ.ต.อ. สมศักดิ์ รักษาการณ์',
    CourtCaseNumber: 'อ.1234/2567',
    Verdict: 'จำคุก 25 ปี'
  },
  {
    CaseID: 2,
    CaseNumber: 'NCB-CR-2567-0002',
    CaseType: 'Distribution',
    ArrestDate: '2024-02-20T09:15:00',
    LocationID: 7,
    Status: 'Under Investigation',
    Description: 'ยึดยาไอซ์และยาบ้าจำนวนมากที่กรุงเทพฯ',
    OfficerInCharge: 'พ.ต.ท. วิชัย สืบสวน',
    CourtCaseNumber: null,
    Verdict: null
  },
  {
    CaseID: 3,
    CaseNumber: 'NCB-CR-2567-0003',
    CaseType: 'Manufacturing',
    ArrestDate: '2024-03-10T22:45:00',
    LocationID: 8,
    Status: 'Pending',
    Description: 'ทลายโรงงานผลิตยาเสพติดที่ชายแดน',
    OfficerInCharge: 'พ.ต.อ. ณรงค์ ปราบปราม',
    CourtCaseNumber: 'อ.2567/2567',
    Verdict: null
  },
  {
    CaseID: 4,
    CaseNumber: 'NCB-CR-2567-0004',
    CaseType: 'Possession',
    ArrestDate: '2024-04-05T16:00:00',
    LocationID: 9,
    Status: 'Closed',
    Description: 'จับกุมผู้ครอบครองเพื่อเสพ',
    OfficerInCharge: 'ร.ต.อ. สุชาติ เจ้าหน้าที่',
    CourtCaseNumber: 'อ.3456/2567',
    Verdict: 'รอลงอาญา 2 ปี บำบัดฟื้นฟู'
  },

  // ============================================================
  // OPERATION PHANTOM GARAGE — Cases
  // ============================================================
  {
    CaseID: 101,
    CaseNumber: 'MPD-CR-2568-0101',
    CaseType: 'Vehicle Theft',
    ArrestDate: '2025-11-02T02:15:00',
    LocationID: 101,
    Status: 'Under Investigation',
    Description: 'Porsche Macan S ป้ายแดง สีขาว ถูกโจรกรรมจากลานจอดคอนโด Emporium Suites ย่านปทุมวัน ช่วงเวลา 01:30-02:15 น. กล้อง CCTV บันทึกชายสวมหมวกแก๊ปดำขับออกไป',
    OfficerInCharge: 'พ.ต.ท. อนุชิต บรรเทิง',
    CourtCaseNumber: null,
    Verdict: null
  },
  {
    CaseID: 102,
    CaseNumber: 'MPD-CR-2568-0102',
    CaseType: 'Vehicle Theft',
    ArrestDate: '2025-11-10T23:40:00',
    LocationID: 102,
    Status: 'Under Investigation',
    Description: 'Mercedes-Benz GLE 300d สีดำ ถูกโจรกรรมจากอาคารจอดรถ Ratchaprasong สาย CCTV ถูกตัดก่อนเกิดเหตุ ป้ายทะเบียน กท-8899',
    OfficerInCharge: 'พ.ต.ท. อนุชิต บรรเทิง',
    CourtCaseNumber: null,
    Verdict: null
  },
  {
    CaseID: 103,
    CaseNumber: 'MPD-CR-2568-0103',
    CaseType: 'Vehicle Theft',
    ArrestDate: '2025-11-18T03:20:00',
    LocationID: 103,
    Status: 'Under Investigation',
    Description: 'BMW X5 xDrive สีเทา ถูกโจรกรรมจากบ้านเดี่ยวเศรษฐกิจ ซ.ลาดปลาเค้า เขตจตุจักร มีร่องรอยการใช้เครื่องมือเปิดรถ ECU ล่าสุด',
    OfficerInCharge: 'พ.ต.ท. อนุชิต บรรเทิง',
    CourtCaseNumber: null,
    Verdict: null
  },
  {
    CaseID: 104,
    CaseNumber: 'MPD-CR-2568-0104',
    CaseType: 'Smuggling',
    ArrestDate: '2025-11-22T14:30:00',
    LocationID: 106,
    Status: 'Under Investigation',
    Description: 'เจ้าหน้าที่ศุลกากรตรวจพบตู้คอนเทนเนอร์ต้องสงสัยที่ลานตู้สินค้าท่าเรือคลองเตย ภายในพบชิ้นส่วนรถยนต์หรูที่ถูกถอดชิ้นส่วน ตรงกับหมายเลข VIN ของ Mercedes-Benz ที่ถูกแจ้งโจรกรรม',
    OfficerInCharge: 'พ.ต.อ. สุรศักดิ์ ธรรมรักษ์',
    CourtCaseNumber: null,
    Verdict: null
  },
  {
    CaseID: 105,
    CaseNumber: 'MPD-CR-2568-0105',
    CaseType: 'Forgery',
    ArrestDate: '2025-11-25T10:00:00',
    LocationID: 107,
    Status: 'Under Investigation',
    Description: 'ตรวจพบเอกสารศุลกากรปลอมและใบส่งออกปลอม จำนวน 12 ชุด ที่สำนักงานนายหน้าย่านเจริญกรุง มีรายการส่งออก "อะไหล่รถยนต์มือสอง" ปลายทางเมียนมาร์และลาว',
    OfficerInCharge: 'พ.ต.อ. สุรศักดิ์ ธรรมรักษ์',
    CourtCaseNumber: null,
    Verdict: null
  },

  // ============================================================
  // OPERATION MEKONG SERPENT — Cases
  // ============================================================
  {
    CaseID: 201,
    CaseNumber: 'DSI-CR-2568-0201',
    CaseType: 'Smuggling',
    ArrestDate: '2025-06-08T04:30:00',
    LocationID: 201,
    Status: 'Under Investigation',
    Description: 'เจ้าหน้าที่ด่านศุลกากรแม่สายตรวจพบรถกระบะดัดแปลงพื้นที่ใต้ท้องรถ ซุกซ่อนงาช้างแอฟริกา 12 ชิ้น น้ำหนักรวม 38 กก. และหนังจระเข้ 15 ผืน มูลค่าประมาณ 8 ล้านบาท',
    OfficerInCharge: 'พ.ต.อ. กิตติพงศ์ ชัยวัฒน์',
    CourtCaseNumber: null,
    Verdict: null
  },
  {
    CaseID: 202,
    CaseNumber: 'DSI-CR-2568-0202',
    CaseType: 'Smuggling',
    ArrestDate: '2025-06-15T14:20:00',
    LocationID: 203,
    Status: 'Adjudicated',
    Description: 'จับกุมรถบรรทุกหกล้อพร้อมตู้ทึบที่ด่านตรวจ จ.พิษณุโลก ภายในพบรถยนต์ BMW X3 ถูกโจรกรรมจากเชียงใหม่ ซุกซ่อนมาในตู้บรรทุก ตรงกับทะเบียน ชม-4521 ที่แจ้งหาย',
    OfficerInCharge: 'พ.ต.ท. นิพนธ์ มั่นคง',
    CourtCaseNumber: 'อ.891/2568',
    Verdict: 'จำคุก 8 ปี ปรับ 200,000 บาท'
  },
  {
    CaseID: 203,
    CaseNumber: 'DSI-CR-2568-0203',
    CaseType: 'Trafficking',
    ArrestDate: '2025-07-02T22:10:00',
    LocationID: 204,
    Status: 'Under Investigation',
    Description: 'บุกค้นโกดังกลางเมืองพิษณุโลก พบซากสัตว์ป่าสงวน ได้แก่ ตัวนิ่มแช่แข็ง 23 ตัว เขาสัตว์ 45 ชิ้น และกระดูกเสือ 8 ชุด คาดเป็นจุดพักสินค้าก่อนส่งต่อภาคกลาง',
    OfficerInCharge: 'พ.ต.อ. กิตติพงศ์ ชัยวัฒน์',
    CourtCaseNumber: null,
    Verdict: null
  },
  {
    CaseID: 204,
    CaseNumber: 'DSI-CR-2568-0204',
    CaseType: 'Forgery',
    ArrestDate: '2025-07-18T11:00:00',
    LocationID: 206,
    Status: 'Under Investigation',
    Description: 'เจ้าหน้าที่กรมสอบสวนคดีพิเศษบุกค้นร้านถ่ายเอกสารเขตเมืองอยุธยา พบแม่พิมพ์ปลอมใบอนุญาตส่งออกสัตว์ป่า (CITES) จำนวน 45 ชุด เอกสารศุลกากรปลอม 28 ชุด และทะเบียนรถปลอม 8 คัน',
    OfficerInCharge: 'พ.ต.อ. กิตติพงศ์ ชัยวัฒน์',
    CourtCaseNumber: null,
    Verdict: null
  },
  {
    CaseID: 205,
    CaseNumber: 'DSI-CR-2568-0205',
    CaseType: 'Smuggling',
    ArrestDate: '2025-08-05T06:45:00',
    LocationID: 208,
    Status: 'Under Investigation',
    Description: 'ตรวจพบตู้คอนเทนเนอร์ต้องสงสัย MSHU-228847-1 ที่ท่าเรือแหลมฉบัง ภายในพบรถยนต์หรู 2 คันถูกถอดชิ้นส่วน (Lexus RX และ Mercedes-Benz C-Class) พร้อมงาช้าง 25 กก. ซุกซ่อนในซุ้มล้ออะไหล่ ปลายทางไฮฟอง เวียดนาม',
    OfficerInCharge: 'พ.ต.อ. สุรพงศ์ ศิลปาชีวะ',
    CourtCaseNumber: null,
    Verdict: null
  },
  {
    CaseID: 206,
    CaseNumber: 'DSI-CR-2568-0206',
    CaseType: 'Vehicle Theft',
    ArrestDate: '2025-06-01T03:00:00',
    LocationID: 212,
    Status: 'Under Investigation',
    Description: 'Lexus RX 350h สีดำ ถูกโจรกรรมจากลานจอดโรงแรม Le Méridien เชียงราย กล้อง CCTV จับภาพชาย 2 คนใช้เครื่องมือ relay attack ขโมยรถใน 90 วินาที',
    OfficerInCharge: 'พ.ต.ท. นิพนธ์ มั่นคง',
    CourtCaseNumber: null,
    Verdict: null
  },
  {
    CaseID: 207,
    CaseNumber: 'DSI-CR-2568-0207',
    CaseType: 'Trafficking',
    ArrestDate: '2025-08-12T19:30:00',
    LocationID: 202,
    Status: 'Pending',
    Description: 'หน่วยปฏิบัติการข่าวกรองพบจุดรับ-ส่งสัตว์ป่าสงวนที่ชายแดนแม่สาย-ท่าขี้เหล็ก ตรงกับที่อยู่ผู้ต้องสงสัย กมลชนก สุขสวัสดิ์ พบนกปรอดหัวโขน 40 ตัว และเต่าดาว 15 ตัว เตรียมส่งเข้าไทย',
    OfficerInCharge: 'พ.ต.อ. กิตติพงศ์ ชัยวัฒน์',
    CourtCaseNumber: 'อ.1203/2568',
    Verdict: null
  }
,
  // ============================================================
  // คดียาเสพติดพื้นที่ สภ.สามพราน (ชุดข้อมูลสาธิต 3 โซนความเสี่ยง)
  // Hot: ท่าข้าม/อ้อมใหญ่ · Warm: กระทุ่มล้ม/บ้านใหม่ · Cool: สามพราน/บางกระทึก
  // ============================================================
  { CaseID: 301, CaseNumber: 'NCB-CR-2568-0301', CaseType: 'Trafficking', ArrestDate: '2025-01-12T21:40:00', LocationID: 6, Status: 'Under Investigation', Description: 'จับกุมผู้ค้าพร้อมยาบ้า ริมถนนทางเข้าชุมชนวัดท่าข้าม ขยายผลจากสายข่าว', OfficerInCharge: 'พ.ต.ท. ประเวศ สืบคดี', CourtCaseNumber: null, Verdict: null },
  { CaseID: 302, CaseNumber: 'NCB-CR-2568-0302', CaseType: 'Distribution', ArrestDate: '2025-01-28T19:15:00', LocationID: 7, Status: 'Under Investigation', Description: 'ล่อซื้อยาบ้าบริเวณตลาดนัดชุมชน ต.ท่าข้าม ผู้ต้องหารับว่ารับยามาจากเครือข่ายรายใหญ่', OfficerInCharge: 'พ.ต.ท. ประเวศ สืบคดี', CourtCaseNumber: null, Verdict: null },
  { CaseID: 303, CaseNumber: 'NCB-CR-2568-0303', CaseType: 'Possession', ArrestDate: '2025-02-09T10:30:00', LocationID: 7, Status: 'Filed', Description: 'ตรวจค้นแผงค้าใกล้ตลาดนัด พบยาไอซ์ซุกซ่อนในกล่องสินค้า', OfficerInCharge: 'ร.ต.อ. สุชาติ เจ้าหน้าที่', CourtCaseNumber: 'อ.455/2568', Verdict: null },
  { CaseID: 304, CaseNumber: 'NCB-CR-2568-0304', CaseType: 'Trafficking', ArrestDate: '2025-02-21T23:55:00', LocationID: 8, Status: 'Under Investigation', Description: 'สกัดรถจักรยานยนต์ขนยาบ้าในซอยบ้านเช่าหลังโรงงาน ต.ท่าข้าม', OfficerInCharge: 'พ.ต.ท. ประเวศ สืบคดี', CourtCaseNumber: null, Verdict: null },
  { CaseID: 305, CaseNumber: 'NCB-CR-2568-0305', CaseType: 'Distribution', ArrestDate: '2025-03-05T04:20:00', LocationID: 9, Status: 'Under Investigation', Description: 'จุดตรวจริมทางหลวงชนบท นฐ.3004 พบยาบ้าซุกในถังน้ำมันสำรอง', OfficerInCharge: 'ร.ต.อ. อดิศร ตรวจการณ์', CourtCaseNumber: null, Verdict: null },
  { CaseID: 306, CaseNumber: 'NCB-CR-2568-0306', CaseType: 'Trafficking', ArrestDate: '2025-03-18T13:10:00', LocationID: 101, Status: 'Filed', Description: 'ขยายผลจับผู้ส่งยาไอซ์นัดส่งของที่ลานจอดรถอาคารพาณิชย์ ต.ท่าข้าม', OfficerInCharge: 'พ.ต.ท. ประเวศ สืบคดี', CourtCaseNumber: 'อ.612/2568', Verdict: null },
  { CaseID: 307, CaseNumber: 'NCB-CR-2568-0307', CaseType: 'Trafficking', ArrestDate: '2025-04-02T05:45:00', LocationID: 102, Status: 'Under Investigation', Description: 'บุกค้นบ้านพักหลังตลาดใหม่อ้อมใหญ่ พบยาบ้าพร้อมอาวุธปืนไม่มีทะเบียน', OfficerInCharge: 'พ.ต.ท. ประเวศ สืบคดี', CourtCaseNumber: null, Verdict: null },
  { CaseID: 308, CaseNumber: 'NCB-CR-2568-0308', CaseType: 'Distribution', ArrestDate: '2025-04-16T20:30:00', LocationID: 103, Status: 'Under Investigation', Description: 'ล่อซื้อยาไอซ์ย่านหอพักคนงานโรงงาน ต.อ้อมใหญ่', OfficerInCharge: 'ร.ต.อ. อดิศร ตรวจการณ์', CourtCaseNumber: null, Verdict: null },
  { CaseID: 309, CaseNumber: 'NCB-CR-2568-0309', CaseType: 'Possession', ArrestDate: '2025-05-01T22:05:00', LocationID: 103, Status: 'Closed', Description: 'ตรวจค้นรถยนต์ต้องสงสัยหน้าหอพัก พบยาบ้าเพื่อจำหน่ายรายย่อย', OfficerInCharge: 'ร.ต.อ. สุชาติ เจ้าหน้าที่', CourtCaseNumber: 'อ.789/2568', Verdict: 'จำคุก 2 ปี' },
  { CaseID: 310, CaseNumber: 'NCB-CR-2568-0310', CaseType: 'Trafficking', ArrestDate: '2025-05-19T16:50:00', LocationID: 106, Status: 'Under Investigation', Description: 'จับเครือข่ายส่งยาผ่านบริการรับส่งพัสดุ นัดรับของลานจอดรถห้างริมเพชรเกษม', OfficerInCharge: 'พ.ต.ท. ประเวศ สืบคดี', CourtCaseNumber: null, Verdict: null },
  { CaseID: 311, CaseNumber: 'NCB-CR-2568-0311', CaseType: 'Trafficking', ArrestDate: '2025-06-03T11:25:00', LocationID: 107, Status: 'Under Investigation', Description: 'ตรวจยึดเฮโรอีนซุกซ่อนในกล่องพัสดุที่อาคารพาณิชย์ริมเพชรเกษม ต.อ้อมใหญ่', OfficerInCharge: 'พ.ต.อ. สมศักดิ์ รักษาการณ์', CourtCaseNumber: null, Verdict: null },
  { CaseID: 312, CaseNumber: 'NCB-CR-2568-0312', CaseType: 'Possession', ArrestDate: '2025-06-14T18:40:00', LocationID: 201, Status: 'Filed', Description: 'จับกุมผู้ครอบครองยาบ้าในชุมชนหลังนิคมโรงงาน ต.กระทุ่มล้ม', OfficerInCharge: 'ร.ต.อ. อดิศร ตรวจการณ์', CourtCaseNumber: 'อ.901/2568', Verdict: null }
,
  { CaseID: 313, CaseNumber: 'NCB-CR-2568-0313', CaseType: 'Distribution', ArrestDate: '2025-06-20T20:10:00', LocationID: 6, Status: 'Under Investigation', Description: 'ขยายผลล่อซื้อยาบ้ารอบสอง จุดเดิมริมถนนทางเข้าชุมชนวัดท่าข้าม', OfficerInCharge: 'พ.ต.ท. ประเวศ สืบคดี', CourtCaseNumber: null, Verdict: null },
  { CaseID: 314, CaseNumber: 'NCB-CR-2568-0314', CaseType: 'Trafficking', ArrestDate: '2025-06-27T22:35:00', LocationID: 7, Status: 'Under Investigation', Description: 'จับผู้ค้ารายใหม่เข้ามาแทนรายเดิมบริเวณตลาดนัดชุมชน ต.ท่าข้าม', OfficerInCharge: 'พ.ต.ท. ประเวศ สืบคดี', CourtCaseNumber: null, Verdict: null },
  { CaseID: 315, CaseNumber: 'NCB-CR-2568-0315', CaseType: 'Possession', ArrestDate: '2025-07-04T09:20:00', LocationID: 8, Status: 'Filed', Description: 'ตรวจค้นห้องเช่าเดียวกันซ้ำ พบยาบ้าเตรียมแบ่งจำหน่าย', OfficerInCharge: 'ร.ต.อ. สุชาติ เจ้าหน้าที่', CourtCaseNumber: 'อ.1044/2568', Verdict: null },
  { CaseID: 316, CaseNumber: 'NCB-CR-2568-0316', CaseType: 'Trafficking', ArrestDate: '2025-07-11T23:50:00', LocationID: 9, Status: 'Under Investigation', Description: 'สกัดรถกระบะซุกยาบ้าที่จุดตรวจ นฐ.3004 เชื่อมโยงเครือข่ายเดียวกับคดีก่อนหน้า', OfficerInCharge: 'ร.ต.อ. อดิศร ตรวจการณ์', CourtCaseNumber: null, Verdict: null },
  { CaseID: 317, CaseNumber: 'NCB-CR-2568-0317', CaseType: 'Distribution', ArrestDate: '2025-07-18T18:05:00', LocationID: 105, Status: 'Under Investigation', Description: 'ล่อซื้อยาไอซ์จากบ้านเช่าในซอยชุมชน ต.อ้อมใหญ่', OfficerInCharge: 'พ.ต.ท. ประเวศ สืบคดี', CourtCaseNumber: null, Verdict: null },
  { CaseID: 318, CaseNumber: 'NCB-CR-2568-0318', CaseType: 'Trafficking', ArrestDate: '2025-07-25T02:40:00', LocationID: 105, Status: 'Under Investigation', Description: 'บุกค้นบ้านเช่าหลังเดิมพบยาบ้าล็อตใหม่และบัญชีลูกค้า', OfficerInCharge: 'พ.ต.ท. ประเวศ สืบคดี', CourtCaseNumber: null, Verdict: null },
  { CaseID: 319, CaseNumber: 'NCB-CR-2568-0319', CaseType: 'Trafficking', ArrestDate: '2025-08-01T21:15:00', LocationID: 102, Status: 'Under Investigation', Description: 'จับกุมผู้ค้าเชื่อมโยงบ้านพักหลังตลาดใหม่อ้อมใหญ่เป็นครั้งที่สอง', OfficerInCharge: 'พ.ต.อ. สมศักดิ์ รักษาการณ์', CourtCaseNumber: null, Verdict: null },
  { CaseID: 320, CaseNumber: 'NCB-CR-2568-0320', CaseType: 'Distribution', ArrestDate: '2025-08-08T17:30:00', LocationID: 106, Status: 'Under Investigation', Description: 'ตรวจยึดยาบ้านัดส่งลานจอดรถห้างริมเพชรเกษมจุดเดิม', OfficerInCharge: 'ร.ต.อ. อดิศร ตรวจการณ์', CourtCaseNumber: null, Verdict: null }
];

// 1.3 LOCATION (สถานที่)
export const locations = [
  {
    LocationID: 1,
    AddressDetail: '14/1 หมู่ 2 ต.ไร่ขิง อ.สามพราน จ.นครปฐม',
    Latitude: 13.7364,
    Longitude: 100.2867,
    LocationType: 'Home',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'ไร่ขิง',
    PostalCode: '73210'
  },
  {
    LocationID: 2,
    AddressDetail: '27/2 หมู่ 3 ต.คลองจินดา อ.สามพราน จ.นครปฐม',
    Latitude: 13.6844,
    Longitude: 100.1096,
    LocationType: 'Home',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'คลองจินดา',
    PostalCode: '73110'
  },
  {
    LocationID: 3,
    AddressDetail: '40/3 หมู่ 4 ต.กระทุ่มล้ม อ.สามพราน จ.นครปฐม',
    Latitude: 13.746,
    Longitude: 100.329,
    LocationType: 'Home',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'กระทุ่มล้ม',
    PostalCode: '73220'
  },
  {
    LocationID: 4,
    AddressDetail: 'โกดังเช่า หมู่ 5 ต.คลองใหม่ อ.สามพราน จ.นครปฐม',
    Latitude: 13.7412,
    Longitude: 100.193,
    LocationType: 'DropPoint',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'คลองใหม่',
    PostalCode: '73110'
  },
  {
    LocationID: 5,
    AddressDetail: '88/9 หมู่ 7 ต.ไร่ขิง อ.สามพราน จ.นครปฐม',
    Latitude: 13.73,
    Longitude: 100.28,
    LocationType: 'Home',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'ไร่ขิง',
    PostalCode: '73210'
  },
  {
    LocationID: 6,
    AddressDetail: 'ริมถนนทางเข้าชุมชนวัดท่าข้าม ต.ท่าข้าม อ.สามพราน จ.นครปฐม',
    Latitude: 13.7143,
    Longitude: 100.246,
    LocationType: 'CrimeScene',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'ท่าข้าม',
    PostalCode: '73110'
  },
  {
    LocationID: 7,
    AddressDetail: 'บริเวณตลาดนัดชุมชน ต.ท่าข้าม อ.สามพราน จ.นครปฐม',
    Latitude: 13.7165,
    Longitude: 100.2478,
    LocationType: 'CrimeScene',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'ท่าข้าม',
    PostalCode: '73110'
  },
  {
    LocationID: 8,
    AddressDetail: 'ซอยบ้านเช่าหลังโรงงาน ต.ท่าข้าม อ.สามพราน จ.นครปฐม',
    Latitude: 13.7128,
    Longitude: 100.2495,
    LocationType: 'CrimeScene',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'ท่าข้าม',
    PostalCode: '73110'
  },
  {
    LocationID: 9,
    AddressDetail: 'จุดตรวจริมทางหลวงชนบท นฐ.3004 ต.ท่าข้าม อ.สามพราน จ.นครปฐม',
    Latitude: 13.717,
    Longitude: 100.244,
    LocationType: 'CrimeScene',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'ท่าข้าม',
    PostalCode: '73110'
  },
  {
    LocationID: 101,
    AddressDetail: 'ลานจอดรถอาคารพาณิชย์ ต.ท่าข้าม อ.สามพราน จ.นครปฐม',
    Latitude: 13.7118,
    Longitude: 100.2452,
    LocationType: 'CrimeScene',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'ท่าข้าม',
    PostalCode: '73110'
  },
  {
    LocationID: 102,
    AddressDetail: 'บ้านพักในซอยหลังตลาดใหม่อ้อมใหญ่ ต.อ้อมใหญ่ อ.สามพราน จ.นครปฐม',
    Latitude: 13.6994,
    Longitude: 100.2645,
    LocationType: 'CrimeScene',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'อ้อมใหญ่',
    PostalCode: '73160'
  },
  {
    LocationID: 103,
    AddressDetail: 'ย่านหอพักคนงานโรงงาน ต.อ้อมใหญ่ อ.สามพราน จ.นครปฐม',
    Latitude: 13.7019,
    Longitude: 100.2664,
    LocationType: 'CrimeScene',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'อ้อมใหญ่',
    PostalCode: '73160'
  },
  {
    LocationID: 104,
    AddressDetail: 'อู่ซ่อมรถยนต์ หมู่ 4 ต.อ้อมใหญ่ อ.สามพราน จ.นครปฐม',
    Latitude: 13.704,
    Longitude: 100.268,
    LocationType: 'CrimeScene',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'อ้อมใหญ่',
    PostalCode: '73160'
  },
  {
    LocationID: 105,
    AddressDetail: 'บ้านเช่าในซอยชุมชน ต.อ้อมใหญ่ อ.สามพราน จ.นครปฐม',
    Latitude: 13.703,
    Longitude: 100.2635,
    LocationType: 'CrimeScene',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'อ้อมใหญ่',
    PostalCode: '73160'
  },
  {
    LocationID: 106,
    AddressDetail: 'ลานจอดรถห้างสรรพสินค้า ถ.เพชรเกษม ต.อ้อมใหญ่ อ.สามพราน จ.นครปฐม',
    Latitude: 13.6975,
    Longitude: 100.2621,
    LocationType: 'CrimeScene',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'อ้อมใหญ่',
    PostalCode: '73160'
  },
  {
    LocationID: 107,
    AddressDetail: 'อาคารพาณิชย์ริม ถ.เพชรเกษม ต.อ้อมใหญ่ อ.สามพราน จ.นครปฐม',
    Latitude: 13.7005,
    Longitude: 100.2605,
    LocationType: 'CrimeScene',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'อ้อมใหญ่',
    PostalCode: '73160'
  },
  {
    LocationID: 108,
    AddressDetail: 'บ้านเดี่ยวหมู่บ้านจัดสรร ต.ท่าข้าม อ.สามพราน จ.นครปฐม',
    Latitude: 13.718,
    Longitude: 100.251,
    LocationType: 'Home',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'ท่าข้าม',
    PostalCode: '73110'
  },
  {
    LocationID: 109,
    AddressDetail: 'ห้องเช่าย่านโรงงาน ต.อ้อมใหญ่ อ.สามพราน จ.นครปฐม',
    Latitude: 13.701,
    Longitude: 100.269,
    LocationType: 'Home',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'อ้อมใหญ่',
    PostalCode: '73160'
  },
  {
    LocationID: 110,
    AddressDetail: 'บ้านพัก หมู่ 2 ต.ยายชา อ.สามพราน จ.นครปฐม',
    Latitude: 13.7329,
    Longitude: 100.2357,
    LocationType: 'Home',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'ยายชา',
    PostalCode: '73110'
  },
  {
    LocationID: 111,
    AddressDetail: 'ทาวน์เฮาส์ หมู่ 3 ต.ยายชา อ.สามพราน จ.นครปฐม',
    Latitude: 13.736,
    Longitude: 100.232,
    LocationType: 'Home',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'ยายชา',
    PostalCode: '73110'
  },
  {
    LocationID: 201,
    AddressDetail: 'ชุมชนหลังนิคมโรงงาน ต.กระทุ่มล้ม อ.สามพราน จ.นครปฐม',
    Latitude: 13.742,
    Longitude: 100.3331,
    LocationType: 'CrimeScene',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'กระทุ่มล้ม',
    PostalCode: '73220'
  },
  {
    LocationID: 202,
    AddressDetail: 'จุดรับส่งพัสดุ ต.สามพราน อ.สามพราน จ.นครปฐม',
    Latitude: 13.7189,
    Longitude: 100.2212,
    LocationType: 'DropPoint',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'สามพราน',
    PostalCode: '73110'
  },
  {
    LocationID: 203,
    AddressDetail: 'ด่านตรวจถนนพุทธมณฑลสาย 5 ต.กระทุ่มล้ม อ.สามพราน จ.นครปฐม',
    Latitude: 13.7443,
    Longitude: 100.3346,
    LocationType: 'CrimeScene',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'กระทุ่มล้ม',
    PostalCode: '73220'
  },
  {
    LocationID: 204,
    AddressDetail: 'โกดังให้เช่าริมถนนเลียบคลอง ต.กระทุ่มล้ม อ.สามพราน จ.นครปฐม',
    Latitude: 13.75,
    Longitude: 100.328,
    LocationType: 'CrimeScene',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'กระทุ่มล้ม',
    PostalCode: '73220'
  },
  {
    LocationID: 205,
    AddressDetail: 'บ้านพร้อมร้านถ่ายเอกสาร ต.สามพราน อ.สามพราน จ.นครปฐม',
    Latitude: 13.722,
    Longitude: 100.218,
    LocationType: 'Home',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'สามพราน',
    PostalCode: '73110'
  },
  {
    LocationID: 206,
    AddressDetail: 'ร้านค้าห้องแถวริมถนน ต.บ้านใหม่ อ.สามพราน จ.นครปฐม',
    Latitude: 13.6906,
    Longitude: 100.2461,
    LocationType: 'CrimeScene',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'บ้านใหม่',
    PostalCode: '73110'
  },
  {
    LocationID: 207,
    AddressDetail: 'สำนักงานโลจิสติกส์ ต.หอมเกร็ด อ.สามพราน จ.นครปฐม',
    Latitude: 13.775,
    Longitude: 100.235,
    LocationType: 'CrimeScene',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'หอมเกร็ด',
    PostalCode: '73110'
  },
  {
    LocationID: 208,
    AddressDetail: 'ท่าเรือริมแม่น้ำท่าจีน ใกล้ตลาดน้ำดอนหวาย ต.บางกระทึก อ.สามพราน จ.นครปฐม',
    Latitude: 13.7643,
    Longitude: 100.3067,
    LocationType: 'CrimeScene',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'บางกระทึก',
    PostalCode: '73210'
  },
  {
    LocationID: 209,
    AddressDetail: 'บ้านริมคลอง หมู่ 6 ต.ไร่ขิง อ.สามพราน จ.นครปฐม',
    Latitude: 13.74,
    Longitude: 100.275,
    LocationType: 'Home',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'ไร่ขิง',
    PostalCode: '73210'
  },
  {
    LocationID: 210,
    AddressDetail: 'บ้านเช่า หมู่ 1 ต.บ้านใหม่ อ.สามพราน จ.นครปฐม',
    Latitude: 13.687,
    Longitude: 100.24,
    LocationType: 'Home',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'บ้านใหม่',
    PostalCode: '73110'
  },
  {
    LocationID: 211,
    AddressDetail: 'บ้านเดี่ยว หมู่ 8 ต.ท่าข้าม อ.สามพราน จ.นครปฐม',
    Latitude: 13.71,
    Longitude: 100.242,
    LocationType: 'Home',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'ท่าข้าม',
    PostalCode: '73110'
  },
  {
    LocationID: 212,
    AddressDetail: 'ลานจอดรถตลาดสด ต.บ้านใหม่ อ.สามพราน จ.นครปฐม',
    Latitude: 13.6952,
    Longitude: 100.2508,
    LocationType: 'CrimeScene',
    Province: 'นครปฐม',
    District: 'สามพราน',
    SubDistrict: 'บ้านใหม่',
    PostalCode: '73110'
  }
];

// 1.4 DRUG_SEIZURE (ของกลางยาเสพติด)
export const drugSeizures = [
  {
    SeizureID: 1,
    CaseID: 1,
    DrugType: 'Methamphetamine',
    Quantity: 500000,
    Unit: 'pills',
    EstimatedValue: 50000000,
    StorageLocation: 'คลังเก็บของกลาง ปปส.',
    Notes: 'ยาบ้าอัดตราWY'
  },
  {
    SeizureID: 2,
    CaseID: 2,
    DrugType: 'Crystal Meth',
    Quantity: 50,
    Unit: 'kg',
    EstimatedValue: 25000000,
    StorageLocation: 'คลังเก็บของกลาง ปปส.',
    Notes: 'ยาไอซ์บริสุทธิ์สูง'
  },
  {
    SeizureID: 3,
    CaseID: 2,
    DrugType: 'Methamphetamine',
    Quantity: 200000,
    Unit: 'pills',
    EstimatedValue: 20000000,
    StorageLocation: 'คลังเก็บของกลาง ปปส.',
    Notes: 'ยาบ้าเครื่องหมายปลา'
  },
  {
    SeizureID: 4,
    CaseID: 3,
    DrugType: 'Heroin',
    Quantity: 100,
    Unit: 'kg',
    EstimatedValue: 100000000,
    StorageLocation: 'คลังเก็บของกลาง ปปส.',
    Notes: 'เฮโรอีนหมายเลข 4'
  },
  {
    SeizureID: 5,
    CaseID: 4,
    DrugType: 'Cannabis',
    Quantity: 500,
    Unit: 'g',
    EstimatedValue: 50000,
    StorageLocation: 'สถานีตำรวจท้องที่',
    Notes: 'กัญชาแห้ง'
  },

  // ============================================================
  // OPERATION PHANTOM GARAGE — Seized Evidence / Assets
  // ============================================================
  {
    SeizureID: 101,
    CaseID: 104,
    DrugType: 'Stolen Vehicle Parts',
    Quantity: 1,
    Unit: 'lot',
    EstimatedValue: 4500000,
    StorageLocation: 'คลังของกลาง สน.คลองเตย',
    Notes: 'ชิ้นส่วนรถ Mercedes-Benz GLE 300d ถูกถอดชิ้นส่วนเกือบหมด VIN ตรงกับทะเบียน กท-8899'
  },
  {
    SeizureID: 102,
    CaseID: 105,
    DrugType: 'Forged Documents',
    Quantity: 12,
    Unit: 'sets',
    EstimatedValue: 0,
    StorageLocation: 'ห้องเก็บของกลาง กองบังคับการตำรวจเศรษฐกิจ',
    Notes: 'เอกสารศุลกากรปลอม ใบส่งออกปลอม และทะเบียนรถปลอมแปลง 12 ชุด ปลายทางเมียนมาร์/ลาว'
  },
  {
    SeizureID: 103,
    CaseID: 101,
    DrugType: 'Stolen Vehicle',
    Quantity: 1,
    Unit: 'unit',
    EstimatedValue: 6500000,
    StorageLocation: 'ยังไม่พบรถ',
    Notes: 'Porsche Macan S สีขาว ป้ายแดง ยังอยู่ระหว่างการติดตาม'
  },
  {
    SeizureID: 104,
    CaseID: 103,
    DrugType: 'Stolen Vehicle',
    Quantity: 1,
    Unit: 'unit',
    EstimatedValue: 5200000,
    StorageLocation: 'ยังไม่พบรถ',
    Notes: 'BMW X5 xDrive สีเทา มีร่องรอยใช้เครื่องมือ ECU hack'
  },

  // ============================================================
  // OPERATION MEKONG SERPENT — Seized Evidence / Assets
  // ============================================================
  {
    SeizureID: 201,
    CaseID: 201,
    DrugType: 'Wildlife Contraband',
    Quantity: 38,
    Unit: 'kg',
    EstimatedValue: 5700000,
    StorageLocation: 'คลังของกลาง กรมอุทยานแห่งชาติฯ',
    Notes: 'งาช้างแอฟริกา 12 ชิ้น น้ำหนักรวม 38 กก. ถูกซุกซ่อนในช่องลับใต้ท้องรถกระบะ'
  },
  {
    SeizureID: 202,
    CaseID: 201,
    DrugType: 'Wildlife Contraband',
    Quantity: 15,
    Unit: 'sheets',
    EstimatedValue: 2300000,
    StorageLocation: 'คลังของกลาง กรมอุทยานแห่งชาติฯ',
    Notes: 'หนังจระเข้น้ำเค็มดิบ 15 ผืน ขนาดประมาณ 2×1 เมตร ไม่มีใบรับรอง CITES'
  },
  {
    SeizureID: 203,
    CaseID: 202,
    DrugType: 'Stolen Vehicle',
    Quantity: 1,
    Unit: 'unit',
    EstimatedValue: 3800000,
    StorageLocation: 'ลานพักรถ สภ.เมืองพิษณุโลก',
    Notes: 'BMW X3 xDrive30e สีขาว ทะเบียน ชม-4521 ถูกซุกซ่อนในตู้บรรทุกทึบ VIN ตรงกับแจ้งหาย'
  },
  {
    SeizureID: 204,
    CaseID: 204,
    DrugType: 'Forged Documents',
    Quantity: 81,
    Unit: 'sets',
    EstimatedValue: 0,
    StorageLocation: 'ห้องเก็บของกลาง DSI',
    Notes: 'ใบอนุญาตส่งออก CITES ปลอม 45 ชุด เอกสารศุลกากรปลอม 28 ชุด ทะเบียนรถปลอม 8 คัน พร้อมแม่พิมพ์ตราประทับราชการ'
  },
  {
    SeizureID: 205,
    CaseID: 205,
    DrugType: 'Stolen Vehicle Parts',
    Quantity: 2,
    Unit: 'lots',
    EstimatedValue: 7200000,
    StorageLocation: 'คลังของกลาง ศุลกากรแหลมฉบัง',
    Notes: 'ชิ้นส่วนรถ Lexus RX 350h และ Mercedes-Benz C200 ถูกถอดชิ้นส่วนในตู้คอนเทนเนอร์ MSHU-228847-1 พร้อมงาช้าง 25 กก. ซุกซ่อนในซุ้มล้ออะไหล่'
  }
,
  // ของกลางคดียาเสพติดสามพราน (ชุดข้อมูลสาธิต)
  { SeizureID: 301, CaseID: 301, DrugType: 'Methamphetamine', Quantity: 12000, Unit: 'pills', EstimatedValue: 960000, StorageLocation: 'คลังของกลาง สภ.สามพราน', Notes: 'ยาบ้าตรา WY บรรจุถุงชา 60 มัด' },
  { SeizureID: 302, CaseID: 302, DrugType: 'Methamphetamine', Quantity: 4000, Unit: 'pills', EstimatedValue: 320000, StorageLocation: 'คลังของกลาง สภ.สามพราน', Notes: 'ล่อซื้อ 2 ครั้งต่อเนื่อง' },
  { SeizureID: 303, CaseID: 303, DrugType: 'Crystal Meth', Quantity: 120, Unit: 'g', EstimatedValue: 180000, StorageLocation: 'คลังของกลาง สภ.สามพราน', Notes: 'ซุกในกล่องสินค้าแผงค้า' },
  { SeizureID: 304, CaseID: 304, DrugType: 'Methamphetamine', Quantity: 18000, Unit: 'pills', EstimatedValue: 1440000, StorageLocation: 'คลังของกลาง สภ.สามพราน', Notes: 'ซุกใต้เบาะรถจักรยานยนต์' },
  { SeizureID: 305, CaseID: 305, DrugType: 'Methamphetamine', Quantity: 26000, Unit: 'pills', EstimatedValue: 2080000, StorageLocation: 'คลังของกลาง สภ.สามพราน', Notes: 'ซุกในถังน้ำมันสำรองดัดแปลง' },
  { SeizureID: 306, CaseID: 306, DrugType: 'Crystal Meth', Quantity: 450, Unit: 'g', EstimatedValue: 675000, StorageLocation: 'คลังของกลาง สภ.สามพราน', Notes: 'แบ่งบรรจุ 45 ถุงพร้อมจำหน่าย' },
  { SeizureID: 307, CaseID: 307, DrugType: 'Methamphetamine', Quantity: 30000, Unit: 'pills', EstimatedValue: 2400000, StorageLocation: 'คลังของกลาง ปปส. ภาค 7', Notes: 'พบพร้อมอาวุธปืน 1 กระบอก' },
  { SeizureID: 308, CaseID: 308, DrugType: 'Crystal Meth', Quantity: 200, Unit: 'g', EstimatedValue: 300000, StorageLocation: 'คลังของกลาง สภ.สามพราน', Notes: 'ล่อซื้อจากเครือข่ายหอพักโรงงาน' },
  { SeizureID: 309, CaseID: 309, DrugType: 'Methamphetamine', Quantity: 2000, Unit: 'pills', EstimatedValue: 160000, StorageLocation: 'คลังของกลาง สภ.สามพราน', Notes: 'ซุกช่องแอร์รถยนต์' },
  { SeizureID: 310, CaseID: 310, DrugType: 'Methamphetamine', Quantity: 22000, Unit: 'pills', EstimatedValue: 1760000, StorageLocation: 'คลังของกลาง ปปส. ภาค 7', Notes: 'ส่งผ่านกล่องพัสดุปลอมชื่อผู้รับ' },
  { SeizureID: 311, CaseID: 311, DrugType: 'Heroin', Quantity: 1.2, Unit: 'kg', EstimatedValue: 1200000, StorageLocation: 'คลังของกลาง ปปส. ภาค 7', Notes: 'เฮโรอีนอัดแท่งซุกกล่องพัสดุ' },
  { SeizureID: 312, CaseID: 312, DrugType: 'Methamphetamine', Quantity: 600, Unit: 'pills', EstimatedValue: 48000, StorageLocation: 'คลังของกลาง สภ.สามพราน', Notes: 'ครอบครองเพื่อจำหน่ายรายย่อย' }
,
  { SeizureID: 313, CaseID: 313, DrugType: 'Methamphetamine', Quantity: 8000, Unit: 'pills', EstimatedValue: 640000, StorageLocation: 'คลังของกลาง สภ.สามพราน', Notes: 'ล่อซื้อรอบสอง' },
  { SeizureID: 314, CaseID: 314, DrugType: 'Methamphetamine', Quantity: 15000, Unit: 'pills', EstimatedValue: 1200000, StorageLocation: 'คลังของกลาง สภ.สามพราน', Notes: 'ผู้ค้ารายใหม่เครือข่ายเดิม' },
  { SeizureID: 315, CaseID: 315, DrugType: 'Methamphetamine', Quantity: 3500, Unit: 'pills', EstimatedValue: 280000, StorageLocation: 'คลังของกลาง สภ.สามพราน', Notes: 'เตรียมแบ่งบรรจุ' },
  { SeizureID: 316, CaseID: 316, DrugType: 'Methamphetamine', Quantity: 40000, Unit: 'pills', EstimatedValue: 3200000, StorageLocation: 'คลังของกลาง ปปส. ภาค 7', Notes: 'ซุกใต้กระบะพื้นสองชั้น' },
  { SeizureID: 317, CaseID: 317, DrugType: 'Crystal Meth', Quantity: 90, Unit: 'g', EstimatedValue: 135000, StorageLocation: 'คลังของกลาง สภ.สามพราน', Notes: 'ล่อซื้อครั้งแรก' },
  { SeizureID: 318, CaseID: 318, DrugType: 'Methamphetamine', Quantity: 9500, Unit: 'pills', EstimatedValue: 760000, StorageLocation: 'คลังของกลาง สภ.สามพราน', Notes: 'พบพร้อมบัญชีลูกค้า' },
  { SeizureID: 319, CaseID: 319, DrugType: 'Methamphetamine', Quantity: 11000, Unit: 'pills', EstimatedValue: 880000, StorageLocation: 'คลังของกลาง สภ.สามพราน', Notes: 'ล็อตใหม่จากเครือข่ายเดิม' },
  { SeizureID: 320, CaseID: 320, DrugType: 'Methamphetamine', Quantity: 7000, Unit: 'pills', EstimatedValue: 560000, StorageLocation: 'คลังของกลาง สภ.สามพราน', Notes: 'นัดส่งจุดเดิม' }
];

// 2.1 CASE_PERSON (บุคคลที่เกี่ยวข้องในคดี)
export const casePersons = [
  { CasePersonID: 1, CaseID: 1, PersonID: 1, Role: 'Main Suspect', InvolvementDetails: 'หัวหน้าเครือข่าย' },
  { CasePersonID: 2, CaseID: 1, PersonID: 2, Role: 'Accomplice', InvolvementDetails: 'ผู้ประสานงาน' },
  { CasePersonID: 3, CaseID: 2, PersonID: 3, Role: 'Main Suspect', InvolvementDetails: 'ผู้จัดการคลังสินค้า' },
  { CasePersonID: 4, CaseID: 2, PersonID: 4, Role: 'Accomplice', InvolvementDetails: 'ผู้ขนส่ง' },
  { CasePersonID: 5, CaseID: 3, PersonID: 4, Role: 'Main Suspect', InvolvementDetails: 'เจ้าของโรงงาน' },
  { CasePersonID: 6, CaseID: 4, PersonID: 5, Role: 'Main Suspect', InvolvementDetails: 'ผู้ครอบครอง' },

  // OPERATION PHANTOM GARAGE — Case-Person Links
  { CasePersonID: 101, CaseID: 101, PersonID: 103, Role: 'Main Suspect', InvolvementDetails: 'ผู้ต้องสงสัยหลัก — จาก CCTV จับภาพได้ขณะขับรถออกจากจุดเกิดเหตุ ตรงกับลักษณะรูปพรรณ' },
  { CasePersonID: 102, CaseID: 102, PersonID: 103, Role: 'Main Suspect', InvolvementDetails: 'ผู้ต้องสงสัยหลัก — ถูกระบุตัวจากภาพวงจรปิดบริเวณใกล้เคียง ก่อนสาย CCTV ของอาคารถูกตัด' },
  { CasePersonID: 103, CaseID: 103, PersonID: 103, Role: 'Accomplice', InvolvementDetails: 'ขับรถ BMW ออกจากจุดเกิดเหตุ — พยานเห็นชายตรงลักษณะเดียวกัน' },
  { CasePersonID: 104, CaseID: 101, PersonID: 101, Role: 'Mastermind', InvolvementDetails: 'เจ้าของอู่ซ่อมรถที่ถูกส่งรถไปซ่อนและถอดชิ้นส่วน' },
  { CasePersonID: 105, CaseID: 102, PersonID: 101, Role: 'Mastermind', InvolvementDetails: 'สั่งการโจรกรรมรถเป้าหมาย — หลักฐานจากบันทึกการโทร' },
  { CasePersonID: 106, CaseID: 103, PersonID: 101, Role: 'Mastermind', InvolvementDetails: 'ผู้สั่งการ — มีรายการคำสั่งรถที่ต้องการจากลูกค้าต่างประเทศ' },
  { CasePersonID: 107, CaseID: 104, PersonID: 102, Role: 'Main Suspect', InvolvementDetails: 'ช่างถอดชิ้นส่วนรถยนต์ — พบเครื่องมือปลอมหมายเลขตัวถังในอู่' },
  { CasePersonID: 108, CaseID: 104, PersonID: 101, Role: 'Accomplice', InvolvementDetails: 'เจ้าของอู่ที่ชิ้นส่วนถูกส่งไปยังตู้คอนเทนเนอร์' },
  { CasePersonID: 109, CaseID: 105, PersonID: 104, Role: 'Main Suspect', InvolvementDetails: 'ผู้ปลอมแปลงเอกสารส่งออก — ลายมือและลายเซ็นในเอกสารตรงกัน' },
  { CasePersonID: 110, CaseID: 105, PersonID: 101, Role: 'Accomplice', InvolvementDetails: 'ผู้ว่าจ้างทำเอกสาร — มีหลักฐานการโอนเงินค่าจ้างจากบัญชี' },

  // ============================================================
  // OPERATION MEKONG SERPENT — Case-Person Links
  // ============================================================
  // Border intercept — courier caught, boss linked
  { CasePersonID: 201, CaseID: 201, PersonID: 202, Role: 'Main Suspect', InvolvementDetails: 'คนขับรถบรรทุกที่ถูกจับพร้อมงาช้างและหนังจระเข้ที่ด่านศุลกากรแม่สาย' },
  { CasePersonID: 202, CaseID: 201, PersonID: 201, Role: 'Mastermind', InvolvementDetails: 'หลักฐานจากโทรศัพท์ผู้ต้องหาเชื่อมโยงไปถึงอ้ายเสือ ผู้สั่งการจากแม่จัน' },
  { CasePersonID: 203, CaseID: 201, PersonID: 205, Role: 'Accomplice', InvolvementDetails: 'ผู้ประสานงานชายแดน จัดหาสินค้าจากเมียนมาร์ผ่านจุดผ่อนปรน' },
  // Phitsanulok checkpoint — courier caught with stolen car
  { CasePersonID: 204, CaseID: 202, PersonID: 202, Role: 'Main Suspect', InvolvementDetails: 'คนขับรถบรรทุก ถูกจับที่ด่านตรวจพิษณุโลกพร้อม BMW X3 ที่ถูกโจรกรรม' },
  { CasePersonID: 205, CaseID: 202, PersonID: 201, Role: 'Mastermind', InvolvementDetails: 'บันทึกการโทร 22 ครั้งกับผู้ต้องหาในช่วง 48 ชม. ก่อนเกิดเหตุ' },
  // Phitsanulok warehouse raid
  { CasePersonID: 206, CaseID: 203, PersonID: 201, Role: 'Mastermind', InvolvementDetails: 'สัญญาเช่าโกดังเป็นชื่อนอมินี แต่หลักฐานชำระเงินเชื่อมโยง อ้ายเสือ' },
  { CasePersonID: 207, CaseID: 203, PersonID: 202, Role: 'Accomplice', InvolvementDetails: 'กุญแจโกดังพบในรถของผู้ต้องหา ลายนิ้วมือตรงกันภายในโกดัง' },
  // Ayutthaya forgery bust
  { CasePersonID: 208, CaseID: 204, PersonID: 203, Role: 'Main Suspect', InvolvementDetails: 'เจ้าของร้านถ่ายเอกสาร เป็นผู้ผลิตเอกสารปลอมทั้ง CITES ศุลกากร และทะเบียนรถ' },
  { CasePersonID: 209, CaseID: 204, PersonID: 204, Role: 'Accomplice', InvolvementDetails: 'ผู้สั่งทำเอกสาร — หลักฐานโอนเงินค่าจ้าง 18 ครั้งรวม 1.2 ล้านบาท' },
  { CasePersonID: 210, CaseID: 204, PersonID: 201, Role: 'Mastermind', InvolvementDetails: 'กลุ่ม LINE "งานด่วน" พบข้อความสั่งทำเอกสารจากบัญชี อ้ายเสือ' },
  // Laem Chabang container bust
  { CasePersonID: 211, CaseID: 205, PersonID: 204, Role: 'Main Suspect', InvolvementDetails: 'ตู้คอนเทนเนอร์จองผ่านบริษัท ภูวดล โลจิสติกส์ ผู้จัดการรับผิดชอบตรง' },
  { CasePersonID: 212, CaseID: 205, PersonID: 203, Role: 'Accomplice', InvolvementDetails: 'เอกสารส่งออกปลอมในตู้คอนเทนเนอร์ตรงกับลายมือและแม่พิมพ์ของ พี่ลิซ่า' },
  { CasePersonID: 213, CaseID: 205, PersonID: 201, Role: 'Mastermind', InvolvementDetails: 'ผู้รับผลประโยชน์ — บัญชีธนาคารต่างประเทศ (เวียดนาม) ตรงกับบัญชีที่รับเงินจากลูกค้าปลายทาง' },
  // Chiang Rai vehicle theft
  { CasePersonID: 214, CaseID: 206, PersonID: 205, Role: 'Accomplice', InvolvementDetails: 'CCTV จับภาพหญิงตรงลักษณะ กมลชนก เป็นผู้สังเกตการณ์ขณะขโมยรถ' },
  { CasePersonID: 215, CaseID: 206, PersonID: 201, Role: 'Mastermind', InvolvementDetails: 'หลักฐานจากกลุ่ม LINE พบรายการ "คำสั่งซื้อ" รถ Lexus RX สีดำ ตรงกับรถที่ถูกขโมย' },
  // Border wildlife seizure
  { CasePersonID: 216, CaseID: 207, PersonID: 205, Role: 'Main Suspect', InvolvementDetails: 'จับกุมที่จุดรับ-ส่งสินค้าชายแดน พบนกปรอดหัวโขนและเต่าดาว' },
  { CasePersonID: 217, CaseID: 207, PersonID: 201, Role: 'Mastermind', InvolvementDetails: 'ผู้ว่าจ้างโดยตรง — มีหลักฐานการโอนเงินค่าจ้างรายครั้ง' }
,
  // ผู้เกี่ยวข้องคดียาเสพติดสามพราน (ชุดข้อมูลสาธิต)
  { CasePersonID: 301, CaseID: 301, PersonID: 1, Role: 'Mastermind', InvolvementDetails: 'สั่งการเครือข่ายค้ายาในพื้นที่ท่าข้ามจากในเรือนจำ' },
  { CasePersonID: 302, CaseID: 301, PersonID: 4, Role: 'Main Suspect', InvolvementDetails: 'ผู้ค้าที่ถูกจับพร้อมของกลางริมถนนทางเข้าชุมชน' },
  { CasePersonID: 303, CaseID: 302, PersonID: 2, Role: 'Main Suspect', InvolvementDetails: 'ผู้จำหน่ายรายย่อยประจำตลาดนัด รับยาจากเครือข่ายหลัก' },
  { CasePersonID: 304, CaseID: 303, PersonID: 2, Role: 'Accomplice', InvolvementDetails: 'เจ้าของแผงค้าที่ใช้ซุกซ่อนยาไอซ์' },
  { CasePersonID: 305, CaseID: 304, PersonID: 4, Role: 'Main Suspect', InvolvementDetails: 'ผู้ขนส่งยาบ้าด้วยรถจักรยานยนต์ตามสั่งการ' },
  { CasePersonID: 306, CaseID: 305, PersonID: 4, Role: 'Main Suspect', InvolvementDetails: 'คนขับรถที่ถูกสกัดที่จุดตรวจ นฐ.3004' },
  { CasePersonID: 307, CaseID: 306, PersonID: 3, Role: 'Mastermind', InvolvementDetails: 'ผู้จัดหาเงินทุนหมุนเวียนและนัดหมายการส่งยาไอซ์' },
  { CasePersonID: 308, CaseID: 307, PersonID: 1, Role: 'Mastermind', InvolvementDetails: 'เจ้าของบ้านพักที่ใช้เป็นจุดพักยาบ้าและอาวุธ' },
  { CasePersonID: 309, CaseID: 307, PersonID: 5, Role: 'Accomplice', InvolvementDetails: 'ผู้ดูแลบ้านพักและเฝ้าระวังเจ้าหน้าที่' },
  { CasePersonID: 310, CaseID: 308, PersonID: 2, Role: 'Main Suspect', InvolvementDetails: 'ผู้จำหน่ายยาไอซ์ให้กลุ่มคนงานโรงงาน' },
  { CasePersonID: 311, CaseID: 309, PersonID: 5, Role: 'Main Suspect', InvolvementDetails: 'ผู้ครอบครองยาบ้าในรถยนต์เพื่อจำหน่ายรายย่อย' },
  { CasePersonID: 312, CaseID: 310, PersonID: 3, Role: 'Mastermind', InvolvementDetails: 'ผู้ว่าจ้างส่งยาผ่านบริการรับส่งพัสดุ หลักฐานเส้นทางการเงิน' },
  { CasePersonID: 313, CaseID: 311, PersonID: 3, Role: 'Mastermind', InvolvementDetails: 'ผู้สั่งนำเข้าเฮโรอีนจากเครือข่ายภาคเหนือ' },
  { CasePersonID: 314, CaseID: 311, PersonID: 4, Role: 'Courier', InvolvementDetails: 'ผู้รับ-ส่งกล่องพัสดุซุกเฮโรอีน' }
,
  { CasePersonID: 315, CaseID: 314, PersonID: 1, Role: 'Mastermind', InvolvementDetails: 'เครือข่ายเดิมส่งผู้ค้ารายใหม่ลงพื้นที่ตลาดนัด' },
  { CasePersonID: 316, CaseID: 316, PersonID: 4, Role: 'Courier', InvolvementDetails: 'คนขับรถกระบะพื้นสองชั้น' },
  { CasePersonID: 317, CaseID: 317, PersonID: 2, Role: 'Main Suspect', InvolvementDetails: 'ผู้จำหน่ายประจำบ้านเช่าซอยชุมชนอ้อมใหญ่' },
  { CasePersonID: 318, CaseID: 318, PersonID: 3, Role: 'Mastermind', InvolvementDetails: 'บัญชีลูกค้าเชื่อมโยงเส้นทางการเงิน' },
  { CasePersonID: 319, CaseID: 319, PersonID: 1, Role: 'Mastermind', InvolvementDetails: 'สั่งการต่อเนื่องจากคดี 307' },
  { CasePersonID: 320, CaseID: 320, PersonID: 5, Role: 'Courier', InvolvementDetails: 'ผู้รับจ้างส่งของไม่ทราบเนื้อหาพัสดุ' }
];

// 2.3 PERSON_CONTACT (ช่องทางการติดต่อ)
export const personContacts = [
  { ContactID: 1, PersonID: 1, ContactType: 'Mobile', ContactValue: '081-234-5678', IsActive: false, Notes: 'เบอร์เก่าถูกยกเลิก' },
  { ContactID: 2, PersonID: 1, ContactType: 'Line ID', ContactValue: 'tiger_boss', IsActive: true, Notes: null },
  { ContactID: 3, PersonID: 2, ContactType: 'Mobile', ContactValue: '089-876-5432', IsActive: true, Notes: null },
  { ContactID: 4, PersonID: 2, ContactType: 'Facebook', ContactValue: 'vichai.sang', IsActive: true, Notes: 'บัญชีปลอม' },
  { ContactID: 5, PersonID: 3, ContactType: 'Mobile', ContactValue: '092-111-2222', IsActive: true, Notes: null },
  { ContactID: 6, PersonID: 3, ContactType: 'Line ID', ContactValue: 'malee_finance', IsActive: true, Notes: null },
  { ContactID: 7, PersonID: 4, ContactType: 'Mobile', ContactValue: '086-333-4444', IsActive: true, Notes: 'เบอร์หลัก' },
  { ContactID: 8, PersonID: 5, ContactType: 'Mobile', ContactValue: '095-555-6666', IsActive: true, Notes: null },

  // OPERATION PHANTOM GARAGE — Contacts
  { ContactID: 101, PersonID: 101, ContactType: 'Mobile', ContactValue: '091-888-1234', IsActive: true, Notes: 'เบอร์หลักที่ใช้ติดต่อธุรกิจ' },
  { ContactID: 102, PersonID: 101, ContactType: 'Line ID', ContactValue: 'thanakorn_vip', IsActive: true, Notes: 'ใช้สั่งงานลูกน้อง' },
  { ContactID: 103, PersonID: 101, ContactType: 'Mobile', ContactValue: '062-999-5678', IsActive: true, Notes: 'เบอร์ลับ — ใช้ติดต่อลูกค้าต่างประเทศ' },
  { ContactID: 104, PersonID: 102, ContactType: 'Mobile', ContactValue: '084-222-3456', IsActive: true, Notes: null },
  { ContactID: 105, PersonID: 102, ContactType: 'Line ID', ContactValue: 'piak_autofix', IsActive: true, Notes: 'ใช้สำหรับรับงานอู่' },
  { ContactID: 106, PersonID: 103, ContactType: 'Mobile', ContactValue: '098-111-7890', IsActive: true, Notes: 'เบอร์เติมเงิน — เปลี่ยนบ่อย' },
  { ContactID: 107, PersonID: 104, ContactType: 'Mobile', ContactValue: '089-444-5678', IsActive: true, Notes: null },
  { ContactID: 108, PersonID: 104, ContactType: 'Line ID', ContactValue: 'ratana_docs', IsActive: true, Notes: 'ใช้รับงานเอกสาร' },

  // OPERATION MEKONG SERPENT — Contacts
  { ContactID: 201, PersonID: 201, ContactType: 'Mobile', ContactValue: '093-717-2001', IsActive: true, Notes: 'เบอร์เติมเงิน เปลี่ยนทุก 2 สัปดาห์' },
  { ContactID: 202, PersonID: 201, ContactType: 'Line ID', ContactValue: 'serpent_north', IsActive: true, Notes: 'ใช้สั่งงานในกลุ่ม LINE "งานด่วน"' },
  { ContactID: 203, PersonID: 201, ContactType: 'Mobile', ContactValue: '065-281-9034', IsActive: true, Notes: 'เบอร์ลับติดต่อนายทุนเมียนมาร์' },
  { ContactID: 204, PersonID: 202, ContactType: 'Mobile', ContactValue: '088-543-6712', IsActive: false, Notes: 'ถูกยึดเป็นของกลางขณะจับกุม' },
  { ContactID: 205, PersonID: 202, ContactType: 'Line ID', ContactValue: 'jay_trucker65', IsActive: true, Notes: null },
  { ContactID: 206, PersonID: 203, ContactType: 'Mobile', ContactValue: '081-992-4488', IsActive: true, Notes: 'เบอร์หลักร้านถ่ายเอกสาร' },
  { ContactID: 207, PersonID: 203, ContactType: 'Line ID', ContactValue: 'lisa_copy_ay', IsActive: true, Notes: 'ใช้รับออเดอร์เอกสาร' },
  { ContactID: 208, PersonID: 203, ContactType: 'Facebook', ContactValue: 'lisacopy.ayutthaya', IsActive: true, Notes: 'เพจร้านถ่ายเอกสาร — ใช้เป็นฉากบังหน้า' },
  { ContactID: 209, PersonID: 204, ContactType: 'Mobile', ContactValue: '091-332-8877', IsActive: true, Notes: 'เบอร์บริษัท ภูวดล โลจิสติกส์' },
  { ContactID: 210, PersonID: 204, ContactType: 'Line ID', ContactValue: 'phuwadon_log', IsActive: true, Notes: 'ใช้ประสานงานตู้คอนเทนเนอร์' },
  { ContactID: 211, PersonID: 204, ContactType: 'Mobile', ContactValue: '062-880-1199', IsActive: true, Notes: 'เบอร์ส่วนตัว ใช้ติดต่อลูกค้าเวียดนามและจีน' },
  { ContactID: 212, PersonID: 205, ContactType: 'Mobile', ContactValue: '097-215-3340', IsActive: true, Notes: 'เบอร์เติมเงิน' },
  { ContactID: 213, PersonID: 205, ContactType: 'Line ID', ContactValue: 'oom_border', IsActive: true, Notes: 'ใช้ประสานงานข้ามแดน' }
];

// 2.4 PERSON_RELATIONSHIP (ความสัมพันธ์ระหว่างบุคคล) - For Network Graph
export const relationships = [
  { RelationshipID: 1, Person1ID: 1, Person2ID: 2, RelationshipType: 'Boss-Subordinate', Strength: 'Strong', Evidence: 'การติดต่อทางโทรศัพท์' },
  { RelationshipID: 2, Person1ID: 1, Person2ID: 3, RelationshipType: 'Business Partner', Strength: 'Strong', Evidence: 'ธุรกรรมทางการเงิน' },
  { RelationshipID: 3, Person1ID: 2, Person2ID: 4, RelationshipType: 'Boss-Subordinate', Strength: 'Medium', Evidence: 'พยานบุคคล' },
  { RelationshipID: 4, Person1ID: 3, Person2ID: 4, RelationshipType: 'Financial', Strength: 'Medium', Evidence: 'บันทึกการโอนเงิน' },
  { RelationshipID: 5, Person1ID: 4, Person2ID: 5, RelationshipType: 'Courier-Handler', Strength: 'Weak', Evidence: 'คำให้การ' },

  // OPERATION PHANTOM GARAGE — Relationships
  // Boss → Subordinates
  { RelationshipID: 101, Person1ID: 101, Person2ID: 102, RelationshipType: 'Boss-Subordinate', Strength: 'Strong', Evidence: 'บันทึกการโทร 47 ครั้ง ช่วง พ.ย. 2568 และหลักฐานการโอนเงินค่าจ้างรายเดือน' },
  { RelationshipID: 102, Person1ID: 101, Person2ID: 103, RelationshipType: 'Boss-Subordinate', Strength: 'Strong', Evidence: 'CCTV จับภาพทั้งคู่ที่อู่ซ่อมรถ 3 ครั้ง ก่อนเกิดเหตุโจรกรรมแต่ละครั้ง' },
  // Boss → Document Forger
  { RelationshipID: 103, Person1ID: 101, Person2ID: 104, RelationshipType: 'Business Partner', Strength: 'Medium', Evidence: 'การโอนเงินจากบัญชี บอส ธน ไปยังบัญชี พี่รัตน์ รวม 3 ครั้ง มูลค่า 450,000 บาท' },
  // Mechanic → Forger (indirect link, makes the network richer)
  { RelationshipID: 104, Person1ID: 102, Person2ID: 104, RelationshipType: 'Financial', Strength: 'Weak', Evidence: 'บันทึก LINE chat ส่งหมายเลข VIN ที่ต้องปลอมเอกสารให้ตรงกัน' },

  // ============================================================
  // OPERATION MEKONG SERPENT — Relationships
  // ============================================================
  // Boss → Border Coordinator (direct control)
  { RelationshipID: 201, Person1ID: 201, Person2ID: 205, RelationshipType: 'Boss-Subordinate', Strength: 'Strong', Evidence: 'บันทึกการโทร 68 ครั้งใน 3 เดือน และหลักฐานโอนเงินค่าจ้างรายสัปดาห์ผ่านบัญชีนอมินี' },
  // Boss → Transport Driver (direct control)
  { RelationshipID: 202, Person1ID: 201, Person2ID: 202, RelationshipType: 'Courier-Handler', Strength: 'Strong', Evidence: 'กลุ่ม LINE "งานด่วน" มีบันทึกส่งพิกัด GPS จุดรับ-ส่งสินค้า และตารางเวลาขนส่ง 14 ครั้ง' },
  // Boss → Port Fixer (business alliance)
  { RelationshipID: 203, Person1ID: 201, Person2ID: 204, RelationshipType: 'Business Partner', Strength: 'Strong', Evidence: 'สัญญาว่าจ้างขนส่งปลอมระหว่างบริษัท ภูวดล โลจิสติกส์ กับบริษัทนอมินีเชียงราย มูลค่ารวม 12 ล้านบาท' },
  // Port Fixer → Document Forger (financial link for services)
  { RelationshipID: 204, Person1ID: 204, Person2ID: 203, RelationshipType: 'Financial', Strength: 'Medium', Evidence: 'หลักฐานโอนเงินค่าจ้างทำเอกสาร 18 ครั้ง รวม 1.2 ล้านบาท ผ่านบัญชี PromptPay ชื่อนอมินี' },
  // Transport Driver → Document Forger (operational link)
  { RelationshipID: 205, Person1ID: 202, Person2ID: 203, RelationshipType: 'Courier-Handler', Strength: 'Medium', Evidence: 'LINE chat รับส่งเอกสารปลอมก่อนการขนส่งแต่ละเที่ยว — ตรงกับวันที่ของคดี 202 และ 205' },
  // Border Coordinator → Transport Driver (handoff partner)
  { RelationshipID: 206, Person1ID: 205, Person2ID: 202, RelationshipType: 'Business Partner', Strength: 'Medium', Evidence: 'CCTV ด่านแม่สาย จับภาพทั้งคู่พบกันที่ปั๊มน้ำมันเชียงราย 3 ครั้ง ก่อนการขนส่ง' }
];

// 2.2 PERSON_LOCATION (ที่อยู่ของบุคคล)
export const personLocations = [
  { PersonLocationID: 1, PersonID: 1, LocationID: 1, LocationRole: 'Home', IsPrimary: true, StartDate: '2020-01-01', EndDate: null },
  { PersonLocationID: 2, PersonID: 2, LocationID: 2, LocationRole: 'Home', IsPrimary: true, StartDate: '2018-06-15', EndDate: null },
  { PersonLocationID: 3, PersonID: 3, LocationID: 3, LocationRole: 'Home', IsPrimary: true, StartDate: '2019-03-20', EndDate: null },
  { PersonLocationID: 4, PersonID: 4, LocationID: 4, LocationRole: 'Workplace', IsPrimary: false, StartDate: '2022-01-01', EndDate: null },
  { PersonLocationID: 5, PersonID: 5, LocationID: 5, LocationRole: 'Home', IsPrimary: true, StartDate: '2023-02-14', EndDate: null },

  // OPERATION PHANTOM GARAGE — Person-Location Links
  // Boss — home + chop shop (workplace)
  { PersonLocationID: 101, PersonID: 101, LocationID: 108, LocationRole: 'Home', IsPrimary: true, StartDate: '2020-03-01', EndDate: null },
  { PersonLocationID: 102, PersonID: 101, LocationID: 104, LocationRole: 'Workplace', IsPrimary: false, StartDate: '2021-06-01', EndDate: null },
  // Mechanic — home + chop shop (workplace)
  { PersonLocationID: 103, PersonID: 102, LocationID: 109, LocationRole: 'Home', IsPrimary: true, StartDate: '2019-05-15', EndDate: null },
  { PersonLocationID: 104, PersonID: 102, LocationID: 104, LocationRole: 'Workplace', IsPrimary: false, StartDate: '2021-06-01', EndDate: null },
  // Getaway driver — home
  { PersonLocationID: 105, PersonID: 103, LocationID: 110, LocationRole: 'Home', IsPrimary: true, StartDate: '2022-08-01', EndDate: null },
  // Document forger — home/office
  { PersonLocationID: 106, PersonID: 104, LocationID: 111, LocationRole: 'Home', IsPrimary: true, StartDate: '2018-01-01', EndDate: null },
  { PersonLocationID: 107, PersonID: 104, LocationID: 107, LocationRole: 'Workplace', IsPrimary: false, StartDate: '2019-03-01', EndDate: null },

  // ============================================================
  // OPERATION MEKONG SERPENT — Person-Location Links
  // ============================================================
  // Boss อ้ายเสือ — home in Mae Chan + border drop point
  { PersonLocationID: 201, PersonID: 201, LocationID: 209, LocationRole: 'Home', IsPrimary: true, StartDate: '2015-01-01', EndDate: null },
  { PersonLocationID: 202, PersonID: 201, LocationID: 202, LocationRole: 'Workplace', IsPrimary: false, StartDate: '2022-06-01', EndDate: null },
  // Transport Driver — home in Phitsanulok + warehouse
  { PersonLocationID: 203, PersonID: 202, LocationID: 210, LocationRole: 'Home', IsPrimary: true, StartDate: '2017-03-15', EndDate: null },
  { PersonLocationID: 204, PersonID: 202, LocationID: 204, LocationRole: 'Workplace', IsPrimary: false, StartDate: '2023-01-01', EndDate: null },
  // Document Forger — home/shop in Ayutthaya
  { PersonLocationID: 205, PersonID: 203, LocationID: 205, LocationRole: 'Home', IsPrimary: true, StartDate: '2016-08-01', EndDate: null },
  { PersonLocationID: 206, PersonID: 203, LocationID: 206, LocationRole: 'Workplace', IsPrimary: false, StartDate: '2018-05-01', EndDate: null },
  // Port Fixer — home in Sri Racha + logistics office
  { PersonLocationID: 207, PersonID: 204, LocationID: 211, LocationRole: 'Home', IsPrimary: true, StartDate: '2014-06-01', EndDate: null },
  { PersonLocationID: 208, PersonID: 204, LocationID: 207, LocationRole: 'Workplace', IsPrimary: false, StartDate: '2019-01-01', EndDate: null },
  // Border Coordinator — lives in Mae Sai border area
  { PersonLocationID: 209, PersonID: 205, LocationID: 202, LocationRole: 'Home', IsPrimary: true, StartDate: '2020-03-01', EndDate: null }
];

// Helper functions
export const getPersonById = (id) => persons.find(p => p.PersonID === id);
export const getCaseById = (id) => cases.find(c => c.CaseID === id);
export const getLocationById = (id) => locations.find(l => l.LocationID === id);
export const getSeizuresForCase = (caseId) => drugSeizures.filter(s => s.CaseID === caseId);
export const getContactsForPerson = (personId) => personContacts.filter(c => c.PersonID === personId);
export const getPersonsForCase = (caseId) => {
  const personIds = casePersons.filter(cp => cp.CaseID === caseId);
  return personIds.map(cp => ({
    ...getPersonById(cp.PersonID),
    Role: cp.Role,
    InvolvementDetails: cp.InvolvementDetails
  }));
};
