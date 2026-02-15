window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const filterFromUrl = urlParams.get('filter');

    if (filterFromUrl) {
        // Wir warten kurz, bis setupLayout() in der global.js fertig ist
        setTimeout(() => {
            if (typeof filterGames === 'function') {
                filterGames(filterFromUrl);
            }
        }, 150); 
    }
});