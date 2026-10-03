(() => {
const travelMessage = document.querySelector("#travel-message");
const travelList = document.querySelector("#travel-list");
const travelTemplate = document.querySelector("#rejse-template");
const emptyTravelMessage = document.querySelector("#empty-travel-message");

function formatTravelDate(dateValue) {
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("da-DK", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Opretter et kort og placerer det øverst over de eksisterende rejser.
function addTravelCard(destination) {
  const travelCard = travelTemplate.content.firstElementChild.cloneNode(true);
  travelCard.dataset.destinationId = destination.id;
  travelCard.dataset.location = destination.location;
  travelCard.dataset.travelFrom = destination.travel_time_from;
  travelCard.dataset.travelTo = destination.travel_time_to;
  travelCard.dataset.description = destination.description;
  travelCard.querySelector(".rejse-destination").textContent =
    destination.location;
  travelCard.querySelector(".rejse-periode").textContent =
    `${formatTravelDate(destination.travel_time_from)} til ${formatTravelDate(destination.travel_time_to)}`;
  travelCard.querySelector(".rejse-beskrivelse").textContent =
    destination.description;
  const firstTravelCard = travelList.querySelector(".rejse");
  travelList.insertBefore(travelCard, firstTravelCard || emptyTravelMessage);
}

//Funktionen loadTravels henter rejserne fra serveren og opdaterer listen over rejser på siden. Hvis der ikke er nogen rejser, vises en besked om, at der ikke er nogen rejser.
async function loadTravels() {
  const response = await fetch("/api/travel-destinations");
  if (!response.ok) {
    if (response.status !== 401) {
      throw new Error(await response.text());
    }
    return;
  }

  const { destinations } = await response.json();
  travelList.querySelectorAll(".rejse").forEach((card) => card.remove());
  destinations.forEach(addTravelCard);
  emptyTravelMessage.hidden = destinations.length > 0;
}

function refreshTravels() {
  loadTravels().catch((error) => {
  travelMessage.textContent = error.message || "Rejserne kunne ikke hentes.";
});
}

window.addEventListener("bruger-logget-ind", refreshTravels);

window.addEventListener("rejsedestination-oprettet", (event) => {
  addTravelCard(event.detail);
  emptyTravelMessage.hidden = true;
});

window.addEventListener("rejsedestination-opdateret", (event) => {
  const updatedDestination = event.detail;
  const existingCards = travelList.querySelectorAll(".rejse");
  let foundCard = null;

  existingCards.forEach((card) => {
    if (card.dataset.destinationId === String(updatedDestination.id)) {
      foundCard = card;
    }
  });

  if (foundCard) {
    foundCard.dataset.location = updatedDestination.location;
    foundCard.dataset.travelFrom = updatedDestination.travel_time_from;
    foundCard.dataset.travelTo = updatedDestination.travel_time_to;
    foundCard.dataset.description = updatedDestination.description;
    foundCard.querySelector(".rejse-destination").textContent = updatedDestination.location;
    foundCard.querySelector(".rejse-periode").textContent =
      `${formatTravelDate(updatedDestination.travel_time_from)} til ${formatTravelDate(updatedDestination.travel_time_to)}`;
    foundCard.querySelector(".rejse-beskrivelse").textContent = updatedDestination.description;
    return;
  }

  addTravelCard(updatedDestination);
  emptyTravelMessage.hidden = true;
});
})();
