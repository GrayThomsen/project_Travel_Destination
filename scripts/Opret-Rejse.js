(() => {
const travelForm = document.querySelector("#travel-form");
const travelMessage = document.querySelector("#travel-message");

// Event listener for form submission
travelForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = travelForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  travelMessage.textContent = "Gemmer rejsen...";

  // Send a POST request to the server with the form data
  try {
    const response = await fetch("/api/travel-destinations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(travelForm))),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }
//Giver besked om at rejsen er gemt og sender en event med destinationen som detail.
    const { destination } = await response.json();
    window.dispatchEvent(
        //* CustomEvent bruges til at oprette en brugerdefineret event, der kan lyttes til af andre dele af applikationen. I dette tilfælde bruges den til at signalere, at en ny rejsedestination er blevet oprettet. */
      new CustomEvent("rejsedestination-oprettet", { detail: destination }),
    );
    travelForm.reset();
    travelMessage.textContent = "Rejsen er gemt.";
  } catch (error) {
    travelMessage.textContent = error.message || "Rejsen kunne ikke gemmes.";
  } finally {
    submitButton.disabled = false;
  }
});
})();
