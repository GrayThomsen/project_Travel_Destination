//Overblik over HTTP status koder der er brugt i dette projekt:
// 200 OK: Anmodningen lykkedes, og serveren returnerede de ønskede data.
// 201 Created: Anmodningen lykkedes, og en ny ressource blev oprettet.
// 204 No Content: Anmodningen lykkedes, men der er ingen data at returnere.
// 400 Bad Request: Anmodningen var ugyldig, f.eks. på grund af manglende eller forkert formaterede data.
// 401 Unauthorized: Anmodningen kræver autentificering, og brugeren er ikke logget ind.
// 403 Forbidden: Anmodningen blev forstået, men serveren nægter at udføre den.
// 404 Not Found: Den ønskede ressource blev ikke fundet på serveren.
// 409 Conflict: Der opstod en konflikt, f.eks. når man forsøger at oprette en bruger med et allerede eksisterende brugernavn.
// 500 Internal Server Error: Der opstod en fejl på serveren, som forhindrede anmodningen i at lykkes.

require("dotenv").config();

const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");
const { randomBytes } = require("node:crypto");

// Nøglen bruges kun på serveren, da den har privilegeret adgang til databasen.
const { SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY } =
  process.env;
const supabaseSecretKey = SUPABASE_SECRET_KEY || SUPABASE_SERVICE_ROLE_KEY;

//! Se her hvis du ikke har sat miljøvariablerne i .env filen
if (!SUPABASE_URL || !supabaseSecretKey) {
  throw new Error(
    "SUPABASE_URL og SUPABASE_SECRET_KEY skal sættes i .env filen",
  );
}

// Supabase secret key bruges kun fra serveren til databaseadgang.
const supabase = createClient(SUPABASE_URL, supabaseSecretKey);
const app = express();

// Express middleware til at parse JSON og formdata fra frontend.
// Uden dette ville req.body være undefined, når vi sender data fra browseren som JSON eller URL-encoded form.
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(
  session({
    // sessionen bruges til at huske, hvilken bruger der er logget ind, uden at gemme password i browseren.
    secret: process.env.SESSION_SECRET || randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);
app.use(express.static(__dirname));

// Det her endpoint bruges, når frontend skal verificere, om brugeren faktisk er logget ind.
// Hvis der ikke findes en session, returnerer vi { user: null }, så login-siden kan vise korrekt state.
app.get("/api/session", (req, res) => {
  if (!req.session.userId) {
    return res.json({ user: null });
  }

  return res.json({
    user: { id: req.session.userId, username: req.session.username },
  });
});
// Endpoint til at logge brugeren ud
app.post("/api/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).send("Kunne ikke logge ud lige nu.");
    }

    res.clearCookie("connect.sid", { httpOnly: true, sameSite: "lax" });
    return res.sendStatus(204);
  });
});

// Endpoint til at kontrollere loginoplysninger
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).send("Brugernavn og adgangskode er påkrævet.");
  }

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, password_hash")
      .eq("username", username.trim())
      .maybeSingle();

    if (error) throw error;

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).send("Forkert brugernavn eller adgangskode.");
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    return res.json({ user: { id: user.id, username: user.username } });
  } catch (error) {
    console.error("Kunne ikke logge bruger ind:", error.message);
    return res.status(500).send("Login kunne ikke gennemføres lige nu.");
  }
});

app.get("/api/travel-destinations", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send("Du skal logge ind for at se dine rejser.");
  }

  try {
    const { data, error } = await supabase
      .from("travel_destinations")
      .select(
        "id, location, travel_time_from, travel_time_to, description, created_at",
      )
      .eq("user_id", req.session.userId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return res.json({ destinations: data });
  } catch (error) {
    console.error("Kunne ikke hente rejser:", error.message);
    return res.status(500).send("Rejserne kunne ikke hentes lige nu.");
  }
});
// Endpoint til at slette en rejse
app.delete("/api/travel-destinations/:id", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send("Du skal logge ind for at slette en rejse.");
  }

  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("travel_destinations")
      .delete()
      .eq("id", id)
      .eq("user_id", req.session.userId)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).send("Rejsen blev ikke fundet.");
    return res.sendStatus(204);
  } catch (error) {
    if (error.code === "22P02") {
      return res.status(400).send("Rejsens ID er ugyldigt.");
    }

    console.error("Kunne ikke slette rejse:", error.message);
    return res.status(500).send("Rejsen kunne ikke slettes lige nu.");
  }
});

// Endpoint til at opdatere en eksisterende rejse.
// Vi bruger PUT, fordi vi erstatter hele posten med de nye værdier, men kun for den aktuelle bruger.
// Det er vigtigt at sikre, at en bruger ikke kan redigere nogen andres rejser, så vi bruger både id og user_id i queryen.
app.put("/api/travel-destinations/:id", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send("Du skal logge ind for at redigere en rejse.");
  }

  const { id } = req.params;
  const { location, travel_time_from, travel_time_to, description } = req.body;

  if (
    typeof location !== "string" ||
    typeof travel_time_from !== "string" ||
    typeof travel_time_to !== "string" ||
    typeof description !== "string"
  ) {
    return res.status(400).send("Udfyld destination, datoer og beskrivelse.");
  }

  const normalizedLocation = location.trim();
  if (!normalizedLocation || travel_time_to < travel_time_from) {
    return res.status(400).send("Kontrollér destination og rejsedatoer.");
  }

  try {
    const { data, error } = await supabase
      .from("travel_destinations")
      .update({
        location: normalizedLocation,
        travel_time_from,
        travel_time_to,
        description: description.trim(),
      })
      .eq("id", id)
      .eq("user_id", req.session.userId)
      .select(
        "id, location, travel_time_from, travel_time_to, description, created_at",
      )
      .single();

    if (error) {
      // PGRST116 betyder, at der ikke blev fundet nogen række, som matcher både id og bruger.
      if (error.code === "PGRST116") {
        return res.status(404).send("Rejsen blev ikke fundet.");
      }
      throw error;
    }

    return res.json({ destination: data });
  } catch (error) {
    if (error.code === "22P02") {
      return res.status(400).send("Rejsens ID er ugyldigt.");
    }

    console.error("Kunne ikke opdatere rejse:", error.message);
    return res.status(500).send("Rejsen kunne ikke opdateres lige nu.");
  }
});

// Endpoint til at oprette en ny rejse.
// Her validerer vi input, før vi sender det videre til databasen, så vi undgår ugyldige eller tomme rejser.
app.post("/api/travel-destinations", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send("Du skal logge ind for at oprette en rejse.");
  }

  const { location, travel_time_from, travel_time_to, description } = req.body;
  if (
    typeof location !== "string" ||
    typeof travel_time_from !== "string" ||
    typeof travel_time_to !== "string" ||
    typeof description !== "string"
  ) {
    return res.status(400).send("Udfyld destination, datoer og beskrivelse.");
  }

  const normalizedLocation = location.trim();
  if (!normalizedLocation || travel_time_to < travel_time_from) {
    return res.status(400).send("Kontrollér destination og rejsedatoer.");
  }

  try {
    const { data, error } = await supabase
      .from("travel_destinations")
      .insert({
        user_id: req.session.userId,
        location: normalizedLocation,
        travel_time_from,
        travel_time_to,
        description: description.trim(),
      })
      .select(
        "id, location, travel_time_from, travel_time_to, description, created_at",
      )
      .single();

    if (error) throw error;
    return res.status(201).json({ destination: data });
  } catch (error) {
    console.error("Kunne ikke oprette rejse:", error.message);
    return res.status(500).send("Rejsen kunne ikke gemmes lige nu.");
  }
});

// Endpoint til at oprette en ny bruger
app.post("/api/users", async (req, res) => {
  const { username, password } = req.body;

  // Validering af brugernavn og adgangskode, sikre at der er skrevet noget i begge felter.
  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).send("Brugernavn og adgangskode er påkrævet.");
  }
  // Trim whitespace og tjek længde på brugernavn.
  const normalizedUsername = username.trim();
  if (normalizedUsername.length < 3 || normalizedUsername.length > 50) {
    return res.status(400).send("Brugernavn skal være mellem 3 og 50 tegn.");
  }

  // Tjek længde på adgangskode, både minimum og maksimum bytes. Grunden til bytes er, at bcrypt kun kan håndtere adgangskoder op til 72 bytes. Hvis adgangskoden er længere, vil bcrypt ignorere de ekstra bytes, hvilket kan føre til sikkerhedsproblemer.
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    return res
      .status(400)
      .send("Adgangskoden skal være mindst 8 tegn og højst 72 bytes.");
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const { error } = await supabase.from("users").insert({
      username: normalizedUsername,
      password_hash: passwordHash,
    });

    //Error code 23505 er en PostgreSQL fejl, der indikerer, at der er et unikt nøglekonflikt. I dette tilfælde betyder det, at brugernavnet allerede findes i databasen. Dette er noget vi håndterer, så brugeren får en venlig besked i stedet for en generisk serverfejl. Det er afhænigt at den service man bruger, hvilken kode man får tilbage, men for Supabase/PostgreSQL er det 23505. Hvis man bruger en anden database, kan det være en anden kode, og man skal derfor tjekke dokumentationen for den pågældende database.
    if (error?.code === "23505") {
      return res.status(409).send("Brugernavnet er allerede i brug.");
    }
    if (error) throw error;

    return (
      res
        .status(201)
        //Her sender vi en HTML besked tilbage til klienten, som viser at brugeren er oprettet, og giver et link til forsiden. Dette er en simpel måde at give feedback til brugeren på, men i en rigtig applikation vil man typisk redirecte brugeren til login siden eller forsiden efter oprettelse.
        .send(
          'Brugeren er oprettet. <a href="/index.html">Gå til forsiden</a>.',
        )
    );
  } catch (error) {
    console.error("Kunne ikke oprette bruger:", error.message);
    return res.status(500).send("Brugeren kunne ikke oprettes lige nu.");
  }
});

// Start serveren på den port, der er angivet i miljøvariablerne, eller standardporten 3000
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`Serveren kører på http://localhost:${port}`);
  console.log("PostgreSQL er ikke tilsluttet endnu. Se db/schema.sql.");
});
