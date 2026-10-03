(() => {
  const travelForm = document.querySelector("#travel-form");
  const travelMessage = document.querySelector("#travel-message");
  const travelList = document.querySelector("#travel-list");
  const submitButton = travelForm.querySelector('button[type="submit"]');
  const cancelEditButton = document.querySelector("#cancel-edit-button");

  // Vi gemmer den aktuelle rejse-ID i formen, så vi kan skelne mellem "opret" og "rediger".
  // Det gør det nemt at bruge samme form til begge flows uden at have flere separate sider.
  function clearEditMode() {
    delete travelForm.dataset.editingId;
    submitButton.textContent = "Gem";
    cancelEditButton.hidden = true;
  }

  // Når vi går i redigering, ændrer vi teksten på submitknappen og viser "Annuller".
  // Det er et godt UX-mønster, fordi brugeren tydeligt kan se, at den samme form nu bruges til at opdatere en eksisterende rejse.
  function setEditMode(destinationId) {
    travelForm.dataset.editingId = String(destinationId);
    submitButton.textContent = "Gem ændringer";
    cancelEditButton.hidden = false;
  }

  // Her fyldes felterne i formularen med den valgte rejse, så brugeren kan rette informationen direkte.
  // Vi bruger data-attributter fra kortet, fordi de allerede indeholder den værdifulde info vi har hentet fra serveren.
  function populateFormForEdit(destination) {
    travelForm.elements.location.value = destination.location;
    travelForm.elements.travel_time_from.value = destination.travel_time_from;
    travelForm.elements.travel_time_to.value = destination.travel_time_to;
    travelForm.elements.description.value = destination.description;
    setEditMode(destination.id);
  }

  // Klik på "Rediger" sker inde i listen over rejser, så vi lytter på selve rejsekortet.
  // Vi bruger closest() for at finde den nærmeste .rejse-knap og derefter hente den tilhørende data.
  travelList.addEventListener("click", (event) => {
    const editButton = event.target.closest(".rejse-rediger");
    if (!editButton) return;

    const travelCard = editButton.closest(".rejse");
    if (!travelCard) return;

    populateFormForEdit({
      id: travelCard.dataset.destinationId,
      location:
        travelCard.dataset.location ||
        travelCard.querySelector(".rejse-destination").textContent,
      travel_time_from: travelCard.dataset.travelFrom || "",
      travel_time_to: travelCard.dataset.travelTo || "",
      description:
        travelCard.dataset.description ||
        travelCard.querySelector(".rejse-beskrivelse").textContent,
    });

    travelMessage.textContent = "Redigerer rejsen...";
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Hvis brugeren vælger at annullere, nulstiller vi formularen og går tilbage til "opret-mode".
  cancelEditButton.addEventListener("click", () => {
    travelForm.reset();
    clearEditMode();
    travelMessage.textContent = "Redigering annulleret.";
  });

  // Denne handler håndterer både ny rejse og redigering af eksisterende rejse.
  // Vi bruger samme form, men ændrer HTTP-metode og URL afhængigt af om vi er i edit-mode.
  travelForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const isEditing = Boolean(travelForm.dataset.editingId);
    submitButton.disabled = true;
    //* Bemærk "?" i koden nedenfor. Det er en såkaldt optional chaining operator, som betyder at hvis travelForm.dataset.editingId ikke findes, så vil det ikke give en fejl, men blot returnere undefined. Det er en sikker måde at tilgå dybtliggende properties på uden at risikere runtime errors.
    travelMessage.textContent = isEditing
      ? "Gemmer ændringer..."
      : "Gemmer rejsen...";

    //* Som foroven, vi bruger optional chaining operatoren for at sikre os, at vi ikke får en fejl, hvis travelForm.dataset.editingId ikke findes. Det er en god praksis at bruge optional chaining, når man arbejder med data, der kan være undefined eller null.
    const payload = Object.fromEntries(new FormData(travelForm));
    const method = isEditing ? "PUT" : "POST";
    const url = isEditing
      ? `/api/travel-destinations/${encodeURIComponent(travelForm.dataset.editingId)}`
      : "/api/travel-destinations";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const { destination } = await response.json();

      // Vi sender et egendefineret event, så andre dele af appen kan opdatere UI'et, uden at reload siden.
      // Det er en simpel måde at få frontenden til at blive synkroniseret med serveren.
      if (isEditing) {
        window.dispatchEvent(
          new CustomEvent("rejsedestination-opdateret", {
            detail: destination,
          }),
        );
        travelMessage.textContent = "Rejsen er opdateret.";
      } else {
        window.dispatchEvent(
          new CustomEvent("rejsedestination-oprettet", { detail: destination }),
        );
        travelMessage.textContent = "Rejsen er gemt.";
      }

      travelForm.reset();
      clearEditMode();
    } catch (error) {
      travelMessage.textContent = error.message || "Rejsen kunne ikke gemmes.";
    } finally {
      submitButton.disabled = false;
    }
  });
})();
