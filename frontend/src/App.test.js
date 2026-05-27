import fs from "fs";
import path from "path";

test("dashboard includes mission completion flow", () => {
  const dashboardSource = fs.readFileSync(path.join(__dirname, "pages", "Dashboard.js"), "utf8");
  const appSource = fs.readFileSync(path.join(__dirname, "App.js"), "utf8");
  const profileSource = fs.readFileSync(path.join(__dirname, "pages", "Profile.js"), "utf8");
  const rankingsSource = fs.readFileSync(path.join(__dirname, "pages", "Rankings.js"), "utf8");
  const journalSource = fs.readFileSync(path.join(__dirname, "pages", "Journal.js"), "utf8");
  const teamMissionsSource = fs.readFileSync(path.join(__dirname, "pages", "TeamMissions.js"), "utf8");
  const shockMomentSource = fs.readFileSync(path.join(__dirname, "pages", "ShockMoment.js"), "utf8");

  expect(dashboardSource).toContain("COMPLETE MISSION");
  expect(dashboardSource).toContain("/api/missions/complete");
  expect(dashboardSource).toContain("+10 points added to Warriorship Score");
  expect(appSource).toContain('path="/profile"');
  expect(profileSource).toContain("/api/users/profile");
  expect(profileSource).toContain("WARRIORSHIP SCORE");
  expect(appSource).toContain('path="/rankings"');
  expect(rankingsSource).toContain("/api/rankings");
  expect(rankingsSource).toContain("Top Warriors");
  expect(appSource).toContain('path="/journal"');
  expect(journalSource).toContain("/api/journal");
  expect(journalSource).toContain("What did I do for Earth today?");
  expect(appSource).toContain('path="/team-missions"');
  expect(teamMissionsSource).toContain("/api/team-missions");
  expect(teamMissionsSource).toContain("ACTIVE TEAM MISSIONS");
  expect(shockMomentSource).toContain("api.open-meteo.com/v1/forecast");
  expect(shockMomentSource).toContain("navigator.geolocation");
  expect(shockMomentSource).toContain('navigate("/dashboard")');
  expect(appSource).toContain("equilibra_visited");
  expect(dashboardSource).toContain("/api/notifications");
  expect(dashboardSource).toContain("FiBell");
});
