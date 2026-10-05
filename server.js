const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// -----------------------------------------------------------------------------
// Midlertidigt data-lag
// -----------------------------------------------------------------------------
// Serveren bruger arrays, indtil PostgreSQL bliver koblet på. API-ruterne er
// holdt adskilt fra dette data-lag, så arrays senere kan erstattes af SQL-querys.
// Se db/schema.sql for den planlagte database-struktur.
const users = [
  {
    id: 1,
    name: "Temporary User",
    email: "user@user.dk",
    password: "password",
  },
];
const locations = [
  {
    id: 1,
    userId: null,
    title: "Amalfi Coast",
    country: "Italy",
    from: "2024-06-12",
    to: "2024-06-19",
    description: "Citronduft, små veje og havet lige under fødderne.",
    theme: "amalfi",
  },
  {
    id: 2,
    userId: null,
    title: "Kyoto",
    country: "Japan",
    from: "2023-04-04",
    to: "2023-04-15",
    description: "Templer, stille haver og den bedste ramen på rejsen.",
    theme: "kyoto",
  },
  {
    id: 3,
    userId: null,
    title: "Lisbon",
    country: "Portugal",
    from: "2022-08-21",
    to: "2022-08-28",
    description: "Gule sporvogne, varme aftener og fliser overalt.",
    theme: "lisbon",
  },
];

let nextUserId = 2;
let nextLocationId = 4;

// -----------------------------------------------------------------------------
// Hjælpefunktioner
// -----------------------------------------------------------------------------
function publicUser(user) {
  if (!user) return null;

  // Password må ikke sendes med tilbage til browseren. Det skal senere være en
  // password_hash fra PostgreSQL og ikke en password-værdi i klartekst.
  const { password, ...safeUser } = user;
  return safeUser;
}

function findUserById(userId) {
  return users.find((user) => user.id === Number(userId));
}

// -----------------------------------------------------------------------------
// Basisruter
// -----------------------------------------------------------------------------
app.get("/api/health", (request, response) => {
  response.json({ status: "ok", database: "not connected" });
});

// -----------------------------------------------------------------------------
// Brugere og login
// -----------------------------------------------------------------------------
// Der er med vilje ingen input-validering i denne første prototype. Når
// PostgreSQL kobles på, skal denne route have validering, password hashing og
// unikke constraints på email.
app.post("/api/users", (request, response) => {
  const { name, email, password } = request.body;
  const user = { id: nextUserId++, name, email, password };

  users.push(user);
  response.status(201).json({ user: publicUser(user) });
});

app.post("/api/login", (request, response) => {
  const { email, password } = request.body;
  const user = users.find(
    (candidate) => candidate.email === email && candidate.password === password,
  );

  if (!user) {
    return response.status(401).json({ error: "Ugyldig email eller adgangskode." });
  }

  // Senere skal dette erstattes af en session eller JWT-token.
  response.json({ user: publicUser(user) });
});

// -----------------------------------------------------------------------------
// Locations
// -----------------------------------------------------------------------------
app.get("/api/users/:userId/locations", (request, response) => {
  const user = findUserById(request.params.userId);
  if (!user) return response.status(404).json({ error: "Brugeren findes ikke." });

  const userLocations = locations.filter(
    (location) => location.userId === user.id,
  );
  response.json({ locations: userLocations });
});

app.post("/api/users/:userId/locations", (request, response) => {
  const user = findUserById(request.params.userId);
  if (!user) return response.status(404).json({ error: "Brugeren findes ikke." });

  const { title, country, from, to, description, theme = "" } = request.body;
  const location = {
    id: nextLocationId++,
    userId: user.id,
    title,
    country,
    from,
    to,
    description,
    theme,
  };

  locations.push(location);
  response.status(201).json({ location });
});

// Frontend fallback: gør det muligt at åbne forsiden via http://localhost:3000.
app.get("*", (request, response) => {
  response.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`Kodefolkets rejsebureaus server kører på http://localhost:${port}`);
  console.log("PostgreSQL er ikke tilsluttet endnu. Se db/schema.sql.");
});
