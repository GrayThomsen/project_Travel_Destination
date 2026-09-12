const destinations = [
    { id: 1, title: 'Amalfi Coast', country: 'Italy', date: '12.06.2024 — 19.06.2024', description: 'Citronduft, små veje og havet lige under fødderne.', theme: 'amalfi' },
    { id: 2, title: 'Kyoto', country: 'Japan', date: '04.04.2023 — 15.04.2023', description: 'Templer, stille haver og den bedste ramen på rejsen.', theme: 'kyoto' },
    { id: 3, title: 'Lisbon', country: 'Portugal', date: '21.08.2022 — 28.08.2022', description: 'Gule sporvogne, varme aftener og fliser overalt.', theme: 'lisbon' }
];

const list = document.querySelector('#destination-list');
const count = document.querySelector('#destination-count');
const searchInput = document.querySelector('#search-input');
const form = document.querySelector('#destination-form');
const status = document.querySelector('#form-status');
const loginForm = document.querySelector('#login-form');
let isAuthenticated = false;

document.querySelectorAll('a[href="#new-destination"]').forEach((link) => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        const destinationSection = document.querySelector('#new-destination');
        window.history.pushState({}, '', '#new-destination');
        destinationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        requestAnimationFrame(() => destinationSection.querySelector('input').focus({ preventScroll: true }));
    });
});

function renderDestinations(items = destinations) {
    list.innerHTML = items.length ? items.map((destination) => `
        <article class="destination-card">
            <div class="card-image ${destination.theme}" aria-hidden="true"></div>
            <span class="card-location">${destination.country}</span>
            <h3>${destination.title}</h3>
            <p>${destination.description}</p>
            <small class="card-date">${destination.date}</small>
            <div class="card-actions"><button type="button" data-action="edit" data-id="${destination.id}">Rediger</button>${isAuthenticated ? '<button type="button" data-action="delete" data-id="' + destination.id + '">Slet</button>' : ''}</div>
        </article>`).join('') : '<p>Ingen destinationer matcher din søgning.</p>';
    count.textContent = String(destinations.length).padStart(2, '0');
}

searchInput.addEventListener('input', (event) => {
    const query = event.target.value.toLowerCase();
    renderDestinations(destinations.filter(({ title, country }) => `${title} ${country}`.toLowerCase().includes(query)));
});

list.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const id = Number(button.dataset.id);
    if (button.dataset.action === 'delete' && confirm('Vil du slette denne destination?')) {
        const index = destinations.findIndex((destination) => destination.id === id);
        destinations.splice(index, 1);
        renderDestinations();
    }
    if (button.dataset.action === 'edit') {
        document.querySelector('#form-heading').textContent = 'Rediger destination';
        document.querySelector('#new-destination').scrollIntoView({ behavior: 'smooth' });
        status.textContent = 'Redigering er klar til backend-tilslutning.';
    }
});

form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const from = new Date(data.get('from'));
    const to = new Date(data.get('to'));
    if (to < from) { status.textContent = 'Slutdatoen skal ligge efter startdatoen.'; return; }
    destinations.unshift({ id: Date.now(), title: data.get('title'), country: data.get('country'), date: `${data.get('from')} — ${data.get('to')}`, description: data.get('description'), theme: '' });
    renderDestinations();
    form.reset();
    status.textContent = 'Destinationen er tilføjet til din samling.';
});

form.addEventListener('invalid', (event) => {
    event.target.setAttribute('aria-invalid', 'true');
    status.textContent = 'Tjek de fremhævede felter, før destinationen gemmes.';
}, true);

form.addEventListener('input', (event) => {
    if (event.target.validity.valid) event.target.removeAttribute('aria-invalid');
    if (!form.querySelector('[aria-invalid="true"]')) status.textContent = '';
});

loginForm.addEventListener('submit', () => {
    isAuthenticated = true;
    renderDestinations();
});

renderDestinations();