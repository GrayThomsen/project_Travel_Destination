require("dotenv").config();

const express = require("express");
const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");

// Nødvendigt ved brug af Supabase med service role key, da vi ikke bruger Supabase auth her
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

//! Se her hvis du ikke har sat miljøvariablerne i .env filen
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_URL og SUPABASE_SERVICE_ROLE_KEY skal sættes i .env filen",
  );
}

// Standard opsætning af Supabase klienten med service role key, som giver os mulighed for at indsætte brugere i databasen uden at bruge Supabase auth
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const app = express();

//Express middleware til at parse JSON og URL-encoded data fra POST requests, samt til at servere statiske filer fra projektmappen
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(express.static(__dirname));

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
});
