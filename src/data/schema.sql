-- ============================================================
-- Drug Trafficker Investigation Dashboard (DTID)
-- Database Schema for MySQL/MariaDB
-- Version 1.0
-- ============================================================

-- ============================================================
-- 1. ตารางหลัก (Core Tables)
-- ============================================================

-- 1.1 PERSON (บุคคล)
-- ตารางหลักสำหรับเก็บข้อมูลประวัตินักค้ายาเสพติด/ผู้ต้องสงสัย
CREATE TABLE IF NOT EXISTS Person (
    PersonID INT AUTO_INCREMENT PRIMARY KEY,
    FirstName VARCHAR(100) NOT NULL COMMENT 'ชื่อจริง',
    LastName VARCHAR(100) NOT NULL COMMENT 'นามสกุล',
    Alias VARCHAR(255) NULL COMMENT 'ชื่อเล่น/ฉายา ที่ใช้ในการ',
    NationalID VARCHAR(13) UNIQUE COMMENT 'เลขประจำตัวประชาชน',
    DateOfBirth DATE NULL COMMENT 'วันเกิด',
    Gender CHAR(1) NULL COMMENT 'เพศ (M/F/O)',
    HomeAddress VARCHAR(255) NULL COMMENT 'ที่อยู่ตามทะเบียนบ้าน',
    CurrentAddress VARCHAR(255) NULL COMMENT 'ที่อยู่ปัจจุบัน',
    Photo LONGBLOB NULL COMMENT 'รูปถ่าย',
    RiskLevel ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Low' COMMENT 'ระดับความเสี่ยง',
    Status ENUM('Active', 'Arrested', 'Released', 'Deceased', 'Unknown') DEFAULT 'Active' COMMENT 'สถานะ',
    Notes TEXT NULL COMMENT 'หมายเหตุเพิ่มเติม',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_person_name (FirstName, LastName),
    INDEX idx_person_risk (RiskLevel),
    INDEX idx_person_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.2 LOCATION (สถานที่)
-- ตารางสำหรับเก็บข้อมูลเชิงพื้นที่ (สำคัญมากในการวิเคราะห์ GIS)
CREATE TABLE IF NOT EXISTS Location (
    LocationID INT AUTO_INCREMENT PRIMARY KEY,
    AddressDetail VARCHAR(255) NOT NULL COMMENT 'ที่อยู่โดยละเอียด',
    Latitude DECIMAL(10, 7) NOT NULL COMMENT 'ค่าละติจูด (พิกัด)',
    Longitude DECIMAL(10, 7) NOT NULL COMMENT 'ค่าลองจิจูด (พิกัด)',
    LocationType VARCHAR(50) NULL COMMENT 'ประเภทสถานที่ (เช่น ที่เกิดเหตุ, บ้านพัก, จุดส่ง)',
    Province VARCHAR(100) NULL COMMENT 'จังหวัด',
    District VARCHAR(100) NULL COMMENT 'อำเภอ/เขต',
    SubDistrict VARCHAR(100) NULL COMMENT 'ตำบล/แขวง',
    PostalCode VARCHAR(10) NULL COMMENT 'รหัสไปรษณีย์',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_location_coords (Latitude, Longitude),
    INDEX idx_location_type (LocationType),
    INDEX idx_location_province (Province)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.3 CASE (คดี)
-- ตารางสำหรับบันทึกข้อมูลคดีอาชญากรรมที่เกี่ยวข้องกับยาเสพติด
CREATE TABLE IF NOT EXISTS `Case` (
    CaseID INT AUTO_INCREMENT PRIMARY KEY,
    CaseNumber VARCHAR(50) UNIQUE COMMENT 'เลขที่คดี (เช่น ของสถานี)',
    CaseType VARCHAR(100) NOT NULL COMMENT 'ประเภทความผิด (เช่น ครอบครอง, จำหน่าย, ผลิต)',
    ArrestDate DATETIME NULL COMMENT 'วันที่จับกุม',
    LocationID INT COMMENT 'สถานที่เกิดเหตุ/จับกุม',
    Status VARCHAR(50) NOT NULL COMMENT 'สถานะคดี (เช่น อยู่ระหว่างสืบสวน, ศาลตัดสิน)',
    Description TEXT NULL COMMENT 'รายละเอียดคดี',
    OfficerInCharge VARCHAR(100) NULL COMMENT 'พนักงานสอบสวนผู้รับผิดชอบ',
    CourtCaseNumber VARCHAR(50) NULL COMMENT 'เลขคดีศาล',
    Verdict TEXT NULL COMMENT 'คำพิพากษา',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (LocationID) REFERENCES Location(LocationID) ON DELETE SET NULL,
    INDEX idx_case_number (CaseNumber),
    INDEX idx_case_type (CaseType),
    INDEX idx_case_status (Status),
    INDEX idx_case_date (ArrestDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.4 DRUG_SEIZURE (ของกลางยาเสพติด)
-- ตารางสำหรับบันทึกข้อมูลยาเสพติดที่ยึดได้
CREATE TABLE IF NOT EXISTS DrugSeizure (
    SeizureID INT AUTO_INCREMENT PRIMARY KEY,
    CaseID INT NOT NULL COMMENT 'รหัสคดีที่เกี่ยวข้อง',
    DrugType VARCHAR(100) NOT NULL COMMENT 'ประเภทยาเสพติด',
    Quantity DECIMAL(15, 4) NOT NULL COMMENT 'ปริมาณ',
    Unit VARCHAR(50) NOT NULL COMMENT 'หน่วย (กรัม, กิโลกรัม, เม็ด)',
    EstimatedValue DECIMAL(15, 2) NULL COMMENT 'มูลค่าประมาณการ (บาท)',
    StorageLocation VARCHAR(255) NULL COMMENT 'สถานที่เก็บของกลาง',
    Notes TEXT NULL COMMENT 'หมายเหตุ',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CaseID) REFERENCES `Case`(CaseID) ON DELETE CASCADE,
    INDEX idx_seizure_case (CaseID),
    INDEX idx_seizure_drug (DrugType)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. ตารางความสัมพันธ์ (Relationship Tables)
-- ============================================================

-- 2.1 CASE_PERSON (บุคคลที่เกี่ยวข้องในคดี)
-- ความสัมพันธ์ M:N ระหว่าง Case และ Person
CREATE TABLE IF NOT EXISTS CasePerson (
    CasePersonID INT AUTO_INCREMENT PRIMARY KEY,
    CaseID INT NOT NULL,
    PersonID INT NOT NULL,
    Role VARCHAR(50) NOT NULL COMMENT 'บทบาท (ผู้ต้องหา, พยาน, ผู้เสียหาย)',
    InvolvementDetails TEXT NULL COMMENT 'รายละเอียดการเกี่ยวข้อง',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CaseID) REFERENCES `Case`(CaseID) ON DELETE CASCADE,
    FOREIGN KEY (PersonID) REFERENCES Person(PersonID) ON DELETE CASCADE,
    UNIQUE KEY unique_case_person_role (CaseID, PersonID, Role),
    INDEX idx_case_person (CaseID, PersonID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.2 PERSON_LOCATION (ที่อยู่ของบุคคล)
-- ความสัมพันธ์ M:N ระหว่าง Person และ Location
CREATE TABLE IF NOT EXISTS PersonLocation (
    PersonLocationID INT AUTO_INCREMENT PRIMARY KEY,
    PersonID INT NOT NULL,
    LocationID INT NOT NULL,
    LocationRole VARCHAR(50) NOT NULL COMMENT 'ประเภท (บ้าน, ที่ทำงาน, จุดนัดพบ)',
    IsPrimary BOOLEAN DEFAULT FALSE COMMENT 'ที่อยู่หลัก',
    StartDate DATE NULL COMMENT 'วันที่เริ่มใช้ที่อยู่',
    EndDate DATE NULL COMMENT 'วันที่สิ้นสุด (ถ้ายังใช้อยู่ = NULL)',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (PersonID) REFERENCES Person(PersonID) ON DELETE CASCADE,
    FOREIGN KEY (LocationID) REFERENCES Location(LocationID) ON DELETE CASCADE,
    INDEX idx_person_location (PersonID, LocationID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.3 PERSON_CONTACT (ช่องทางการติดต่อ)
-- บันทึกเบอร์โทรศัพท์, อีเมล, หรือบัญชีโซเชียลมีเดีย
CREATE TABLE IF NOT EXISTS PersonContact (
    ContactID INT AUTO_INCREMENT PRIMARY KEY,
    PersonID INT NOT NULL COMMENT 'รหัสบุคคลที่เกี่ยวข้อง',
    ContactType VARCHAR(50) NOT NULL COMMENT 'ประเภท (เช่น Mobile, Line ID, Facebook)',
    ContactValue VARCHAR(100) UNIQUE COMMENT 'ข้อมูลติดต่อจริง',
    IsActive BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'ยังใช้งานอยู่หรือไม่',
    Notes VARCHAR(255) NULL COMMENT 'หมายเหตุ',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (PersonID) REFERENCES Person(PersonID) ON DELETE CASCADE,
    INDEX idx_contact_person (PersonID),
    INDEX idx_contact_type (ContactType)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.4 PERSON_RELATIONSHIP (ความสัมพันธ์ระหว่างบุคคล)
-- สำหรับสร้าง Network Graph
CREATE TABLE IF NOT EXISTS PersonRelationship (
    RelationshipID INT AUTO_INCREMENT PRIMARY KEY,
    Person1ID INT NOT NULL COMMENT 'บุคคลที่ 1',
    Person2ID INT NOT NULL COMMENT 'บุคคลที่ 2',
    RelationshipType VARCHAR(100) NOT NULL COMMENT 'ประเภทความสัมพันธ์ (หัวหน้า-ลูกน้อง, ผู้ค้า-ลูกค้า, ครอบครัว)',
    Strength ENUM('Weak', 'Medium', 'Strong') DEFAULT 'Medium' COMMENT 'ความเข้มแข็งของความสัมพันธ์',
    Evidence TEXT NULL COMMENT 'หลักฐานที่ยืนยัน',
    StartDate DATE NULL COMMENT 'วันที่เริ่มความสัมพันธ์',
    EndDate DATE NULL COMMENT 'วันสิ้นสุด (ถ้ายังมีอยู่ = NULL)',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Person1ID) REFERENCES Person(PersonID) ON DELETE CASCADE,
    FOREIGN KEY (Person2ID) REFERENCES Person(PersonID) ON DELETE CASCADE,
    INDEX idx_relationship_persons (Person1ID, Person2ID),
    INDEX idx_relationship_type (RelationshipType)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. ตารางเสริม (Supplementary Tables)
-- ============================================================

-- 3.1 DRUG_TYPE (ประเภทยาเสพติด - Lookup Table)
CREATE TABLE IF NOT EXISTS DrugType (
    DrugTypeID INT AUTO_INCREMENT PRIMARY KEY,
    DrugName VARCHAR(100) NOT NULL UNIQUE COMMENT 'ชื่อยาเสพติด',
    DrugNameThai VARCHAR(100) NULL COMMENT 'ชื่อภาษาไทย',
    Category VARCHAR(50) NULL COMMENT 'หมวดหมู่ (ประเภท 1-5)',
    Description TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert common drug types
INSERT INTO DrugType (DrugName, DrugNameThai, Category) VALUES
('Methamphetamine', 'ยาบ้า/ยาไอซ์', 'ประเภท 1'),
('Heroin', 'เฮโรอีน', 'ประเภท 1'),
('Cannabis', 'กัญชา', 'ประเภท 5'),
('Cocaine', 'โคเคน', 'ประเภท 2'),
('Ecstasy', 'ยาอี/เอ็กซ์ตาซี', 'ประเภท 1'),
('Ketamine', 'เคตามีน', 'ประเภท 2'),
('Kratom', 'กระท่อม', 'ประเภท 5')
ON DUPLICATE KEY UPDATE DrugName = DrugName;

-- 3.2 CASE_STATUS (สถานะคดี - Lookup Table)
CREATE TABLE IF NOT EXISTS CaseStatus (
    StatusID INT AUTO_INCREMENT PRIMARY KEY,
    StatusName VARCHAR(50) NOT NULL UNIQUE,
    StatusNameThai VARCHAR(100) NULL,
    Description TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO CaseStatus (StatusName, StatusNameThai) VALUES
('Under Investigation', 'อยู่ระหว่างสืบสวน'),
('Pending', 'รอดำเนินการ'),
('Filed', 'ส่งฟ้อง'),
('Court', 'อยู่ระหว่างพิจารณาคดี'),
('Adjudicated', 'ศาลตัดสินแล้ว'),
('Closed', 'ปิดคดี'),
('Appealed', 'อุทธรณ์')
ON DUPLICATE KEY UPDATE StatusName = StatusName;

-- ============================================================
-- 4. Views สำหรับการวิเคราะห์
-- ============================================================

-- View: รวมข้อมูลคดีพร้อมสถานที่
CREATE OR REPLACE VIEW vw_CaseWithLocation AS
SELECT 
    c.CaseID,
    c.CaseNumber,
    c.CaseType,
    c.ArrestDate,
    c.Status,
    l.LocationID,
    l.AddressDetail,
    l.Latitude,
    l.Longitude,
    l.LocationType,
    l.Province,
    l.District
FROM `Case` c
LEFT JOIN Location l ON c.LocationID = l.LocationID;

-- View: รวมข้อมูลบุคคลพร้อมจำนวนคดี
CREATE OR REPLACE VIEW vw_PersonWithCaseCount AS
SELECT 
    p.PersonID,
    p.FirstName,
    p.LastName,
    p.Alias,
    p.NationalID,
    p.RiskLevel,
    p.Status,
    COUNT(cp.CaseID) as TotalCases
FROM Person p
LEFT JOIN CasePerson cp ON p.PersonID = cp.PersonID
GROUP BY p.PersonID;

-- View: ยาเสพติดที่ยึดได้แยกตามประเภท
CREATE OR REPLACE VIEW vw_DrugSeizureSummary AS
SELECT 
    DrugType,
    COUNT(*) as SeizureCount,
    SUM(Quantity) as TotalQuantity,
    Unit,
    SUM(EstimatedValue) as TotalValue
FROM DrugSeizure
GROUP BY DrugType, Unit;

-- ============================================================
-- 5. Stored Procedures
-- ============================================================

DELIMITER //

-- SP: ค้นหาบุคคลในเครือข่าย (หาคนที่เกี่ยวข้อง)
CREATE PROCEDURE sp_GetPersonNetwork(IN p_PersonID INT, IN p_Depth INT)
BEGIN
    WITH RECURSIVE NetworkCTE AS (
        -- Base: คนที่เลือก
        SELECT PersonID, FirstName, LastName, 0 as Depth
        FROM Person WHERE PersonID = p_PersonID
        
        UNION ALL
        
        -- Recursive: คนที่เกี่ยวข้อง
        SELECT p.PersonID, p.FirstName, p.LastName, n.Depth + 1
        FROM Person p
        INNER JOIN PersonRelationship pr ON (p.PersonID = pr.Person2ID OR p.PersonID = pr.Person1ID)
        INNER JOIN NetworkCTE n ON (
            (pr.Person1ID = n.PersonID AND p.PersonID = pr.Person2ID) OR
            (pr.Person2ID = n.PersonID AND p.PersonID = pr.Person1ID)
        )
        WHERE n.Depth < p_Depth AND p.PersonID != p_PersonID
    )
    SELECT DISTINCT * FROM NetworkCTE ORDER BY Depth;
END //

-- SP: สถิติคดีตามพื้นที่ (สำหรับ Hotspot Analysis)
CREATE PROCEDURE sp_GetCrimeHotspots(IN p_Province VARCHAR(100))
BEGIN
    SELECT 
        l.LocationID,
        l.Latitude,
        l.Longitude,
        l.Province,
        l.District,
        COUNT(c.CaseID) as CaseCount,
        SUM(CASE WHEN ds.DrugType = 'Methamphetamine' THEN ds.Quantity ELSE 0 END) as MethQuantity,
        SUM(ds.EstimatedValue) as TotalDrugValue
    FROM Location l
    LEFT JOIN `Case` c ON l.LocationID = c.LocationID
    LEFT JOIN DrugSeizure ds ON c.CaseID = ds.CaseID
    WHERE (p_Province IS NULL OR l.Province = p_Province)
    GROUP BY l.LocationID, l.Latitude, l.Longitude, l.Province, l.District
    HAVING CaseCount > 0
    ORDER BY CaseCount DESC;
END //

DELIMITER ;

-- ============================================================
-- 6. Indexes for Performance
-- ============================================================

-- Spatial index (if using MySQL 8.0+ with spatial features)
-- ALTER TABLE Location ADD SPATIAL INDEX idx_location_spatial (POINT(Longitude, Latitude));

-- Full-text search on addresses
ALTER TABLE Location ADD FULLTEXT INDEX idx_location_address_ft (AddressDetail);
ALTER TABLE Person ADD FULLTEXT INDEX idx_person_name_ft (FirstName, LastName, Alias);
