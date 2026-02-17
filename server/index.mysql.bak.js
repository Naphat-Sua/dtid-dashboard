// Backend API Server for DTID Dashboard
// Run this with: node server/index.js

import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dtid_dashboard',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ============================================================
// PERSON API Routes
// ============================================================

// Get all persons
app.get('/api/persons', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM Person ORDER BY CreatedAt DESC');
  res.json(rows);
}));

// Get person by ID
app.get('/api/persons/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM Person WHERE PersonID = ?', [req.params.id]);
  if (rows.length === 0) {
    return res.status(404).json({ message: 'Person not found' });
  }
  res.json(rows[0]);
}));

// Create person
app.post('/api/persons', asyncHandler(async (req, res) => {
  const {
    FirstName, LastName, Alias, NationalID, DateOfBirth,
    Gender, HomeAddress, CurrentAddress, RiskLevel, Status, Notes
  } = req.body;

  const [result] = await pool.execute(
    `INSERT INTO Person (FirstName, LastName, Alias, NationalID, DateOfBirth, 
      Gender, HomeAddress, CurrentAddress, RiskLevel, Status, Notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [FirstName, LastName, Alias, NationalID, DateOfBirth,
      Gender, HomeAddress, CurrentAddress, RiskLevel || 'Low', Status || 'Active', Notes]
  );

  const [newPerson] = await pool.execute('SELECT * FROM Person WHERE PersonID = ?', [result.insertId]);
  res.status(201).json(newPerson[0]);
}));

// Create person with contacts (complete)
app.post('/api/persons/complete', asyncHandler(async (req, res) => {
  const { person, contacts, location } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Create location if provided
    let locationId = null;
    if (location && location.Latitude && location.Longitude) {
      const [locResult] = await connection.execute(
        `INSERT INTO Location (AddressDetail, Latitude, Longitude, LocationType, 
          Province, District, SubDistrict, PostalCode)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [location.AddressDetail, location.Latitude, location.Longitude,
          location.LocationType, location.Province, location.District,
          location.SubDistrict, location.PostalCode]
      );
      locationId = locResult.insertId;
    }

    // Create person
    const [personResult] = await connection.execute(
      `INSERT INTO Person (FirstName, LastName, Alias, NationalID, DateOfBirth, 
        Gender, HomeAddress, CurrentAddress, RiskLevel, Status, Notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [person.FirstName, person.LastName, person.Alias, person.NationalID,
        person.DateOfBirth, person.Gender, person.HomeAddress, person.CurrentAddress,
        person.RiskLevel || 'Low', person.Status || 'Active', person.Notes]
    );
    const personId = personResult.insertId;

    // Link person to location
    if (locationId) {
      await connection.execute(
        `INSERT INTO PersonLocation (PersonID, LocationID, LocationRole, IsPrimary)
         VALUES (?, ?, 'Home', TRUE)`,
        [personId, locationId]
      );
    }

    // Create contacts
    if (contacts && contacts.length > 0) {
      for (const contact of contacts) {
        await connection.execute(
          `INSERT INTO PersonContact (PersonID, ContactType, ContactValue, IsActive, Notes)
           VALUES (?, ?, ?, ?, ?)`,
          [personId, contact.ContactType, contact.ContactValue,
            contact.IsActive ?? true, contact.Notes]
        );
      }
    }

    await connection.commit();

    const [newPerson] = await connection.execute(
      'SELECT * FROM Person WHERE PersonID = ?', [personId]
    );
    res.status(201).json(newPerson[0]);

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

// Update person
app.put('/api/persons/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(updates), id];

  await pool.execute(`UPDATE Person SET ${fields} WHERE PersonID = ?`, values);
  
  const [updated] = await pool.execute('SELECT * FROM Person WHERE PersonID = ?', [id]);
  res.json(updated[0]);
}));

// Delete person
app.delete('/api/persons/:id', asyncHandler(async (req, res) => {
  await pool.execute('DELETE FROM Person WHERE PersonID = ?', [req.params.id]);
  res.json({ message: 'Person deleted successfully' });
}));

// Get contacts for person
app.get('/api/persons/:id/contacts', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT * FROM PersonContact WHERE PersonID = ?', [req.params.id]
  );
  res.json(rows);
}));

// Add contact to person
app.post('/api/persons/:id/contacts', asyncHandler(async (req, res) => {
  const { ContactType, ContactValue, IsActive, Notes } = req.body;
  
  const [result] = await pool.execute(
    `INSERT INTO PersonContact (PersonID, ContactType, ContactValue, IsActive, Notes)
     VALUES (?, ?, ?, ?, ?)`,
    [req.params.id, ContactType, ContactValue, IsActive ?? true, Notes]
  );

  const [newContact] = await pool.execute(
    'SELECT * FROM PersonContact WHERE ContactID = ?', [result.insertId]
  );
  res.status(201).json(newContact[0]);
}));

// ============================================================
// LOCATION API Routes
// ============================================================

// Get all locations
app.get('/api/locations', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM Location ORDER BY CreatedAt DESC');
  res.json(rows);
}));

// Get location by ID
app.get('/api/locations/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM Location WHERE LocationID = ?', [req.params.id]);
  if (rows.length === 0) {
    return res.status(404).json({ message: 'Location not found' });
  }
  res.json(rows[0]);
}));

// Create location
app.post('/api/locations', asyncHandler(async (req, res) => {
  const {
    AddressDetail, Latitude, Longitude, LocationType,
    Province, District, SubDistrict, PostalCode
  } = req.body;

  const [result] = await pool.execute(
    `INSERT INTO Location (AddressDetail, Latitude, Longitude, LocationType, 
      Province, District, SubDistrict, PostalCode)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [AddressDetail, Latitude, Longitude, LocationType,
      Province, District, SubDistrict, PostalCode]
  );

  const [newLocation] = await pool.execute(
    'SELECT * FROM Location WHERE LocationID = ?', [result.insertId]
  );
  res.status(201).json(newLocation[0]);
}));

// Update location
app.put('/api/locations/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(updates), id];

  await pool.execute(`UPDATE Location SET ${fields} WHERE LocationID = ?`, values);
  
  const [updated] = await pool.execute('SELECT * FROM Location WHERE LocationID = ?', [id]);
  res.json(updated[0]);
}));

// Delete location
app.delete('/api/locations/:id', asyncHandler(async (req, res) => {
  await pool.execute('DELETE FROM Location WHERE LocationID = ?', [req.params.id]);
  res.json({ message: 'Location deleted successfully' });
}));

// ============================================================
// CASE API Routes
// ============================================================

// Get all cases
app.get('/api/cases', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(`
    SELECT c.*, l.AddressDetail, l.Latitude, l.Longitude, l.Province
    FROM \`Case\` c
    LEFT JOIN Location l ON c.LocationID = l.LocationID
    ORDER BY c.CreatedAt DESC
  `);
  res.json(rows);
}));

// Get case by ID
app.get('/api/cases/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(`
    SELECT c.*, l.AddressDetail, l.Latitude, l.Longitude, l.Province
    FROM \`Case\` c
    LEFT JOIN Location l ON c.LocationID = l.LocationID
    WHERE c.CaseID = ?
  `, [req.params.id]);
  
  if (rows.length === 0) {
    return res.status(404).json({ message: 'Case not found' });
  }
  res.json(rows[0]);
}));

// Create case
app.post('/api/cases', asyncHandler(async (req, res) => {
  const {
    CaseNumber, CaseType, ArrestDate, LocationID, Status,
    Description, OfficerInCharge, CourtCaseNumber, Verdict
  } = req.body;

  const [result] = await pool.execute(
    `INSERT INTO \`Case\` (CaseNumber, CaseType, ArrestDate, LocationID, Status,
      Description, OfficerInCharge, CourtCaseNumber, Verdict)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [CaseNumber, CaseType, ArrestDate, LocationID, Status,
      Description, OfficerInCharge, CourtCaseNumber, Verdict]
  );

  const [newCase] = await pool.execute('SELECT * FROM `Case` WHERE CaseID = ?', [result.insertId]);
  res.status(201).json(newCase[0]);
}));

// Create complete case with location, persons, and seizures
app.post('/api/cases/complete', asyncHandler(async (req, res) => {
  const { case: caseData, location, involvedPersons, seizures } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Create location if provided
    let locationId = caseData.LocationID;
    if (location && location.Latitude && location.Longitude) {
      const [locResult] = await connection.execute(
        `INSERT INTO Location (AddressDetail, Latitude, Longitude, LocationType, 
          Province, District, SubDistrict, PostalCode)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [location.AddressDetail, location.Latitude, location.Longitude,
          location.LocationType || 'CrimeScene', location.Province, location.District,
          location.SubDistrict, location.PostalCode]
      );
      locationId = locResult.insertId;
    }

    // Create case
    const [caseResult] = await connection.execute(
      `INSERT INTO \`Case\` (CaseNumber, CaseType, ArrestDate, LocationID, Status,
        Description, OfficerInCharge, CourtCaseNumber, Verdict)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [caseData.CaseNumber, caseData.CaseType, caseData.ArrestDate, locationId,
        caseData.Status || 'Under Investigation', caseData.Description,
        caseData.OfficerInCharge, caseData.CourtCaseNumber, caseData.Verdict]
    );
    const caseId = caseResult.insertId;

    // Link persons to case
    if (involvedPersons && involvedPersons.length > 0) {
      for (const person of involvedPersons) {
        await connection.execute(
          `INSERT INTO CasePerson (CaseID, PersonID, Role, InvolvementDetails)
           VALUES (?, ?, ?, ?)`,
          [caseId, person.personId, person.role, person.details || null]
        );
      }
    }

    // Create seizures
    if (seizures && seizures.length > 0) {
      for (const seizure of seizures) {
        await connection.execute(
          `INSERT INTO DrugSeizure (CaseID, DrugType, Quantity, Unit, 
            EstimatedValue, StorageLocation, Notes)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [caseId, seizure.DrugType, seizure.Quantity, seizure.Unit,
            seizure.EstimatedValue, seizure.StorageLocation, seizure.Notes]
        );
      }
    }

    await connection.commit();

    const [newCase] = await connection.execute(
      'SELECT * FROM `Case` WHERE CaseID = ?', [caseId]
    );
    res.status(201).json(newCase[0]);

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

// Update case
app.put('/api/cases/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(updates), id];

  await pool.execute(`UPDATE \`Case\` SET ${fields} WHERE CaseID = ?`, values);
  
  const [updated] = await pool.execute('SELECT * FROM `Case` WHERE CaseID = ?', [id]);
  res.json(updated[0]);
}));

// Delete case
app.delete('/api/cases/:id', asyncHandler(async (req, res) => {
  await pool.execute('DELETE FROM `Case` WHERE CaseID = ?', [req.params.id]);
  res.json({ message: 'Case deleted successfully' });
}));

// Get persons for case
app.get('/api/cases/:id/persons', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(`
    SELECT p.*, cp.Role, cp.InvolvementDetails
    FROM Person p
    JOIN CasePerson cp ON p.PersonID = cp.PersonID
    WHERE cp.CaseID = ?
  `, [req.params.id]);
  res.json(rows);
}));

// Add person to case
app.post('/api/cases/:id/persons', asyncHandler(async (req, res) => {
  const { personId, role, involvementDetails } = req.body;
  
  await pool.execute(
    `INSERT INTO CasePerson (CaseID, PersonID, Role, InvolvementDetails)
     VALUES (?, ?, ?, ?)`,
    [req.params.id, personId, role, involvementDetails]
  );

  res.status(201).json({ message: 'Person added to case' });
}));

// Remove person from case
app.delete('/api/cases/:id/persons/:personId', asyncHandler(async (req, res) => {
  await pool.execute(
    'DELETE FROM CasePerson WHERE CaseID = ? AND PersonID = ?',
    [req.params.id, req.params.personId]
  );
  res.json({ message: 'Person removed from case' });
}));

// Get seizures for case
app.get('/api/cases/:id/seizures', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT * FROM DrugSeizure WHERE CaseID = ?', [req.params.id]
  );
  res.json(rows);
}));

// Add seizure to case
app.post('/api/cases/:id/seizures', asyncHandler(async (req, res) => {
  const { DrugType, Quantity, Unit, EstimatedValue, StorageLocation, Notes } = req.body;
  
  const [result] = await pool.execute(
    `INSERT INTO DrugSeizure (CaseID, DrugType, Quantity, Unit, 
      EstimatedValue, StorageLocation, Notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.params.id, DrugType, Quantity, Unit, EstimatedValue, StorageLocation, Notes]
  );

  const [newSeizure] = await pool.execute(
    'SELECT * FROM DrugSeizure WHERE SeizureID = ?', [result.insertId]
  );
  res.status(201).json(newSeizure[0]);
}));

// ============================================================
// RELATIONSHIPS API Routes
// ============================================================

// Get all relationships
app.get('/api/relationships', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(`
    SELECT pr.*, 
      p1.FirstName as Person1FirstName, p1.LastName as Person1LastName,
      p2.FirstName as Person2FirstName, p2.LastName as Person2LastName
    FROM PersonRelationship pr
    JOIN Person p1 ON pr.Person1ID = p1.PersonID
    JOIN Person p2 ON pr.Person2ID = p2.PersonID
  `);
  res.json(rows);
}));

// Create relationship
app.post('/api/relationships', asyncHandler(async (req, res) => {
  const { Person1ID, Person2ID, RelationshipType, Strength, Evidence, StartDate, EndDate } = req.body;
  
  const [result] = await pool.execute(
    `INSERT INTO PersonRelationship (Person1ID, Person2ID, RelationshipType, 
      Strength, Evidence, StartDate, EndDate)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [Person1ID, Person2ID, RelationshipType, Strength || 'Medium', Evidence, StartDate, EndDate]
  );

  const [newRelationship] = await pool.execute(
    'SELECT * FROM PersonRelationship WHERE RelationshipID = ?', [result.insertId]
  );
  res.status(201).json(newRelationship[0]);
}));

// Delete relationship
app.delete('/api/relationships/:id', asyncHandler(async (req, res) => {
  await pool.execute('DELETE FROM PersonRelationship WHERE RelationshipID = ?', [req.params.id]);
  res.json({ message: 'Relationship deleted successfully' });
}));

// ============================================================
// ANALYTICS / STATS API Routes
// ============================================================

// Get dashboard stats
app.get('/api/stats', asyncHandler(async (req, res) => {
  const [totalPersons] = await pool.execute('SELECT COUNT(*) as count FROM Person');
  const [arrestedPersons] = await pool.execute(
    "SELECT COUNT(*) as count FROM Person WHERE Status = 'Arrested'"
  );
  const [activeCases] = await pool.execute(
    "SELECT COUNT(*) as count FROM `Case` WHERE Status = 'Under Investigation'"
  );
  const [drugStats] = await pool.execute(`
    SELECT DrugType, SUM(Quantity) as TotalQuantity, Unit, COUNT(*) as Count,
      SUM(EstimatedValue) as TotalValue
    FROM DrugSeizure
    GROUP BY DrugType, Unit
  `);

  res.json({
    totalPersons: totalPersons[0].count,
    totalArrests: arrestedPersons[0].count,
    activeCases: activeCases[0].count,
    drugStats
  });
}));

// Get crime hotspots
app.get('/api/analytics/hotspots', asyncHandler(async (req, res) => {
  const province = req.query.province;
  
  let query = `
    SELECT 
      l.LocationID, l.Latitude, l.Longitude, l.Province, l.District,
      COUNT(c.CaseID) as CaseCount,
      SUM(CASE WHEN ds.DrugType = 'Methamphetamine' THEN ds.Quantity ELSE 0 END) as MethQuantity,
      SUM(ds.EstimatedValue) as TotalDrugValue
    FROM Location l
    LEFT JOIN \`Case\` c ON l.LocationID = c.LocationID
    LEFT JOIN DrugSeizure ds ON c.CaseID = ds.CaseID
  `;
  
  const params = [];
  if (province) {
    query += ' WHERE l.Province = ?';
    params.push(province);
  }
  
  query += `
    GROUP BY l.LocationID, l.Latitude, l.Longitude, l.Province, l.District
    HAVING CaseCount > 0
    ORDER BY CaseCount DESC
  `;

  const [rows] = await pool.execute(query, params);
  res.json(rows);
}));

// Get network graph for person
app.get('/api/analytics/network/:personId', asyncHandler(async (req, res) => {
  const depth = parseInt(req.query.depth) || 2;
  
  // Simple network query (for more complex depth, use recursive CTE if supported)
  const [rows] = await pool.execute(`
    SELECT pr.*, 
      p1.FirstName as Person1FirstName, p1.LastName as Person1LastName, p1.RiskLevel as Person1Risk,
      p2.FirstName as Person2FirstName, p2.LastName as Person2LastName, p2.RiskLevel as Person2Risk
    FROM PersonRelationship pr
    JOIN Person p1 ON pr.Person1ID = p1.PersonID
    JOIN Person p2 ON pr.Person2ID = p2.PersonID
    WHERE pr.Person1ID = ? OR pr.Person2ID = ?
  `, [req.params.personId, req.params.personId]);

  res.json(rows);
}));

// ============================================================
// CONTACT & SEIZURE API Routes
// ============================================================

// Update contact
app.put('/api/contacts/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(updates), id];

  await pool.execute(`UPDATE PersonContact SET ${fields} WHERE ContactID = ?`, values);
  
  const [updated] = await pool.execute('SELECT * FROM PersonContact WHERE ContactID = ?', [id]);
  res.json(updated[0]);
}));

// Delete contact
app.delete('/api/contacts/:id', asyncHandler(async (req, res) => {
  await pool.execute('DELETE FROM PersonContact WHERE ContactID = ?', [req.params.id]);
  res.json({ message: 'Contact deleted successfully' });
}));

// Update seizure
app.put('/api/seizures/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(updates), id];

  await pool.execute(`UPDATE DrugSeizure SET ${fields} WHERE SeizureID = ?`, values);
  
  const [updated] = await pool.execute('SELECT * FROM DrugSeizure WHERE SeizureID = ?', [id]);
  res.json(updated[0]);
}));

// Delete seizure
app.delete('/api/seizures/:id', asyncHandler(async (req, res) => {
  await pool.execute('DELETE FROM DrugSeizure WHERE SeizureID = ?', [req.params.id]);
  res.json({ message: 'Seizure deleted successfully' });
}));

// ============================================================
// Error Handler
// ============================================================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`DTID Dashboard API Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

export default app;
