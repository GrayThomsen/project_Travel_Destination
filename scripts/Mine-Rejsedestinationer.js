(() => {
const travelMessage = document.querySelector("#travel-message");
const travelList = document.querySelector("#travel-list");
const travelTemplate = document.querySelector("#rejse-template");
const emptyTravelMessage = document.querySelector("#empty-travel-message");

//Funktionen addTravelCard opretter et nyt rejsekort baseret på destinationen og tilføjer det til listen over rejser.
function addTravelCard(destination) {
  const travelCard = travelTemplate.content.firstElementChild.cloneNode(true);
  travelCard.dataset.destinationId = destination.id;
  travelCard.querySelector(".rejse-destination").textContent =
    destination.location;
  travelCard.querySelector(".rejse-periode").textContent =
    `${destination.travel_time_from} til ${destination.travel_time_to}`;
  travelCard.querySelector(".rejse-beskrivelse").textContent =
    destination.description;
  //append tilføjer det nye rejsekort til listen over rejser, baggerst i rækken.
  travelList.append(travelCard);
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
})();
