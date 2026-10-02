(() => {
const travelList = document.querySelector("#travel-list");
const travelMessage = document.querySelector("#travel-message");
const emptyTravelMessage = document.querySelector("#empty-travel-message");

travelList.addEventListener("click", async (event) => {
	const deleteButton = event.target.closest(".rejse-slet");
	if (!deleteButton) return;

	const travelCard = deleteButton.closest(".rejse");
	if (!travelCard || !window.confirm("Vil du slette denne rejse?")) return;

	deleteButton.disabled = true;
	travelMessage.textContent = "Sletter rejsen...";

	try {
		const response = await fetch(
			`/api/travel-destinations/${encodeURIComponent(travelCard.dataset.destinationId)}`,
			{ method: "DELETE" },
		);

		if (!response.ok) {
			throw new Error(await response.text());
		}

		travelCard.remove();
		emptyTravelMessage.hidden = travelList.querySelectorAll(".rejse").length > 0;
		travelMessage.textContent = "Rejsen er slettet.";
	} catch (error) {
		travelMessage.textContent = error.message || "Rejsen kunne ikke slettes.";
		deleteButton.disabled = false;
	}
});
})();
