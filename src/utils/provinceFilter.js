// ============================================================
// Province filtering helpers.
// Locations join on the THAI province name (mockData `Province` / DB
// `province`), while the map polygon carries both English (ADM1_EN) and Thai
// (ADM1_TH) names. selectedProvince is therefore an { en, th } pair and we
// match location data on `.th`. null = no filter (everything passes).
// ============================================================

export const getLocationProvince = (location) =>
  location?.Province ?? location?.province ?? null;

export const locationMatchesProvince = (location, selectedProvince) => {
  if (!selectedProvince) return true;
  return getLocationProvince(location) === selectedProvince.th;
};

/** Cases whose location falls in the selected province (all cases if none). */
export const filterCasesByProvince = (cases, locations, selectedProvince) => {
  if (!selectedProvince) return cases;
  const byId = new Map(locations.map((l) => [l.LocationID, l]));
  return cases.filter((c) => locationMatchesProvince(byId.get(c.LocationID), selectedProvince));
};

/** Set of PersonIDs linked to any of the given case IDs. */
export const getPersonIdsForCases = (personCases, caseIds) => {
  const idSet = caseIds instanceof Set ? caseIds : new Set(caseIds);
  return new Set(
    personCases.filter((pc) => idSet.has(pc.CaseID)).map((pc) => pc.PersonID)
  );
};
