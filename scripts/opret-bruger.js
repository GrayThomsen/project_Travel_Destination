const form = document.querySelector("#opret-bruger-form");
const statusMessage = document.querySelector("#form-status");
const submitButton = form.querySelector('button[type="submit"]');

// Event listener for form submission
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  statusMessage.textContent = "Opretter bruger...";

  // Send a POST request to the server with the form data
  try {
    const response = await fetch(form.action, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(new FormData(form)),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    statusMessage.textContent = "Brugeren er oprettet. Du kan nu logge ind.";
    form.reset();
  } catch (error) {
    statusMessage.textContent =
      error.message || "Brugeren kunne ikke oprettes lige nu.";
  } finally {
    submitButton.disabled = false;
  }
});
