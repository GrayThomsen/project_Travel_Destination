(() => {
const travelList = document.querySelector("#travel-list");
const travelMessage = document.querySelector("#travel-message");
const emptyTravelMessage = document.querySelector("#empty-travel-message");

// Event listener for deleting a travel destination
travelList.addEventListener("click", async (event) => {
	const deleteButton = event.target.closest(".rejse-slet");
	if (!deleteButton) return;

	//closest betyder at den finder den nærmeste forælder med klassen "rejse-slet" og returnerer den. Hvis der ikke findes en sådan forælder, returneres null.
	const travelCard = deleteButton.closest(".rejse");
	if (!travelCard || !window.confirm("Vil du slette denne rejse?")) return;

    // Disable the delete button and show a message while the deletion is in progress
	deleteButton.disabled = true;
	// Det er altid godt at have en besked til brugeren om hvad der sker, så de ikke tror at siden er gået i stå. Bemærk at vi ikke behøver at sige await eller .then, fordi vi ikke venter på at sletningen er færdig, før vi viser beskeden. Vi viser beskeden med det samme, og så opdaterer vi den senere, når sletningen er færdig.
	travelMessage.textContent = "Sletter rejsen...";

	try {
		const response = await fetch(
			`/api/travel-destinations/${encodeURIComponent(travelCard.dataset.destinationId)}`,
			{ method: "DELETE" },
		);

		if (!response.ok) {
			throw new Error(await response.text());
		}
//Fjerner rejsen fra listen og viser en besked om at rejsen er slettet.
		travelCard.remove();
		emptyTravelMessage.hidden = travelList.querySelectorAll(".rejse").length > 0;
		travelMessage.textContent = "Rejsen er slettet.";
	} catch (error) {
		travelMessage.textContent = error.message || "Rejsen kunne ikke slettes.";
		deleteButton.disabled = false;
	}
});
})();
