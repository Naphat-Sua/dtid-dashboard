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
  }
];

// 1.3 LOCATION (สถานที่)
export const locations = [
  {
    LocationID: 1,
    AddressDetail: '123/45 ซ.ลาดพร้าว 71 แขวงลาดพร้าว เขตลาดพร้าว กทม.',
    Latitude: 13.8188,
    Longitude: 100.5859,
    LocationType: 'Home',
    Province: 'กรุงเทพมหานคร',
    District: 'ลาดพร้าว',
    SubDistrict: 'ลาดพร้าว',
    PostalCode: '10230'
  },
  {
    LocationID: 2,
    AddressDetail: '456 หมู่ 3 ต.แม่สาย อ.แม่สาย จ.เชียงราย',
    Latitude: 20.4285,
    Longitude: 99.8826,
    LocationType: 'Home',
    Province: 'เชียงราย',
    District: 'แม่สาย',
    SubDistrict: 'แม่สาย',
    PostalCode: '57130'
  },
  {
    LocationID: 3,
    AddressDetail: '789/1 ถ.สุขุมวิท แขวงคลองตัน เขตคลองเตย กทม.',
    Latitude: 13.7300,
    Longitude: 100.5700,
    LocationType: 'Home',
    Province: 'กรุงเทพมหานคร',
    District: 'คลองเตย',
    SubDistrict: 'คลองตัน',
    PostalCode: '10110'
  },
  {
    LocationID: 4,
    AddressDetail: '321 หมู่ 5 ต.ท่าขี้เหล็ก อ.แม่สาย จ.เชียงราย',
    Latitude: 20.4456,
    Longitude: 99.9100,
    LocationType: 'DropPoint',
    Province: 'เชียงราย',
    District: 'แม่สาย',
    SubDistrict: 'ท่าขี้เหล็ก',
    PostalCode: '57130'
  },
  {
    LocationID: 5,
    AddressDetail: '555/99 คอนโดวิวทะเล ซ.สุขุมวิท 21 กทม.',
    Latitude: 13.7420,
    Longitude: 100.5620,
    LocationType: 'Home',
    Province: 'กรุงเทพมหานคร',
    District: 'วัฒนา',
    SubDistrict: 'คลองเตยเหนือ',
    PostalCode: '10110'
  },
  {
    LocationID: 6,
    AddressDetail: 'จุดตรวจ ด่านแม่สาย จ.เชียงราย',
    Latitude: 20.4320,
    Longitude: 99.8850,
    LocationType: 'CrimeScene',
    Province: 'เชียงราย',
    District: 'แม่สาย',
    SubDistrict: 'แม่สาย',
    PostalCode: '57130'
  },
  {
    LocationID: 7,
    AddressDetail: 'คลังสินค้าลาดกระบัง กทม.',
    Latitude: 13.7280,
    Longitude: 100.7520,
    LocationType: 'CrimeScene',
    Province: 'กรุงเทพมหานคร',
    District: 'ลาดกระบัง',
    SubDistrict: 'ลาดกระบัง',
    PostalCode: '10520'
  },
  {
    LocationID: 8,
    AddressDetail: 'พื้นที่ป่าชายแดน อ.เชียงแสน จ.เชียงราย',
    Latitude: 20.2740,
    Longitude: 100.0850,
    LocationType: 'CrimeScene',
    Province: 'เชียงราย',
    District: 'เชียงแสน',
    SubDistrict: 'เวียง',
    PostalCode: '57150'
  },
  {
    LocationID: 9,
    AddressDetail: 'ซ.รามคำแหง 24 แขวงหัวหมาก เขตบางกะปิ กทม.',
    Latitude: 13.7560,
    Longitude: 100.6240,
    LocationType: 'CrimeScene',
    Province: 'กรุงเทพมหานคร',
    District: 'บางกะปิ',
    SubDistrict: 'หัวหมาก',
    PostalCode: '10240'
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
  }
];

// 2.1 CASE_PERSON (บุคคลที่เกี่ยวข้องในคดี)
export const casePersons = [
  { CasePersonID: 1, CaseID: 1, PersonID: 1, Role: 'Main Suspect', InvolvementDetails: 'หัวหน้าเครือข่าย' },
  { CasePersonID: 2, CaseID: 1, PersonID: 2, Role: 'Accomplice', InvolvementDetails: 'ผู้ประสานงาน' },
  { CasePersonID: 3, CaseID: 2, PersonID: 3, Role: 'Main Suspect', InvolvementDetails: 'ผู้จัดการคลังสินค้า' },
  { CasePersonID: 4, CaseID: 2, PersonID: 4, Role: 'Accomplice', InvolvementDetails: 'ผู้ขนส่ง' },
  { CasePersonID: 5, CaseID: 3, PersonID: 4, Role: 'Main Suspect', InvolvementDetails: 'เจ้าของโรงงาน' },
  { CasePersonID: 6, CaseID: 4, PersonID: 5, Role: 'Main Suspect', InvolvementDetails: 'ผู้ครอบครอง' }
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
  { ContactID: 8, PersonID: 5, ContactType: 'Mobile', ContactValue: '095-555-6666', IsActive: true, Notes: null }
];

// 2.4 PERSON_RELATIONSHIP (ความสัมพันธ์ระหว่างบุคคล) - For Network Graph
export const relationships = [
  { RelationshipID: 1, Person1ID: 1, Person2ID: 2, RelationshipType: 'Boss-Subordinate', Strength: 'Strong', Evidence: 'การติดต่อทางโทรศัพท์' },
  { RelationshipID: 2, Person1ID: 1, Person2ID: 3, RelationshipType: 'Business Partner', Strength: 'Strong', Evidence: 'ธุรกรรมทางการเงิน' },
  { RelationshipID: 3, Person1ID: 2, Person2ID: 4, RelationshipType: 'Boss-Subordinate', Strength: 'Medium', Evidence: 'พยานบุคคล' },
  { RelationshipID: 4, Person1ID: 3, Person2ID: 4, RelationshipType: 'Financial', Strength: 'Medium', Evidence: 'บันทึกการโอนเงิน' },
  { RelationshipID: 5, Person1ID: 4, Person2ID: 5, RelationshipType: 'Courier-Handler', Strength: 'Weak', Evidence: 'คำให้การ' }
];

// 2.2 PERSON_LOCATION (ที่อยู่ของบุคคล)
export const personLocations = [
  { PersonLocationID: 1, PersonID: 1, LocationID: 1, LocationRole: 'Home', IsPrimary: true, StartDate: '2020-01-01', EndDate: null },
  { PersonLocationID: 2, PersonID: 2, LocationID: 2, LocationRole: 'Home', IsPrimary: true, StartDate: '2018-06-15', EndDate: null },
  { PersonLocationID: 3, PersonID: 3, LocationID: 3, LocationRole: 'Home', IsPrimary: true, StartDate: '2019-03-20', EndDate: null },
  { PersonLocationID: 4, PersonID: 4, LocationID: 4, LocationRole: 'Workplace', IsPrimary: false, StartDate: '2022-01-01', EndDate: null },
  { PersonLocationID: 5, PersonID: 5, LocationID: 5, LocationRole: 'Home', IsPrimary: true, StartDate: '2023-02-14', EndDate: null }
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
