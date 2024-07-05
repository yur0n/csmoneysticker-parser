const openModalButtons = document.querySelectorAll('.open-modal');
const closeModalButtons = document.querySelectorAll('.close-modal');
const toggleActiveEl = document.querySelectorAll('.toggle-active');
const startButton = document.querySelector('.table-top__start');
const clearButton = document.querySelector('.table-top__clear');
const modals = document.querySelectorAll('.modal');
const table = document.querySelector('.table-content__info');
const logsTable = document.querySelector('.logs-content__info');

let timeout;
const histrory = [];

openModalButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        modals.forEach(modal => {
            if (modal.classList.contains(btn.getAttribute('data-modal-open'))) {
                modal.classList.toggle('active');
            }
        })
    })
});

closeModalButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        modals.forEach(modal => {
            if (modal.classList.contains(btn.getAttribute('data-modal-close'))) {
                modal.classList.remove('active');
            }
        })
    })
});

toggleActiveEl.forEach(el => {
    el.addEventListener('click', () => {
        el.classList.toggle('active');
    })
});

startButton.addEventListener('click', () => {
    if (startButton.classList.contains('active')) {
        start();
    } else {
        clearTimeout(timeout);
    }
});

clearButton.addEventListener('click', () => {
    table.innerHTML = '';
    if (clearButton.classList.contains('active')) {
        setTimeout(() => {
            clearButton.classList.remove('active');
        }, 300)
    }
});


async function start() {
    const minProfitCoef = 1 + parseFloat(localStorage.getItem('min-profit')) / 100;
    const defaultOverpay = (1 + parseFloat(localStorage.getItem('overpay')) / 100) || 0;
    const items = [];
    let overpay = { defaultOverpay };

    await storage.iterate((value, key) => {
        items.push(value);
    }).catch(console.error);
    await fileStorage.iterate((value, key) => {
        items.push(value);
    }).catch(console.error);

    await storage2.iterate((value, key) => {
        overpay = {...overpay, [value.name]: (1 + parseFloat(value.overpay) / 100)};
    }).catch(console.error);
    
    const data = {
        items,
        overpay,
        minProfit: minProfitCoef || 1.01,
    }

    window.postMessage({ parseSticker: true, data }, "*");
    timeout = setTimeout(() => {
        start();
    }, 15_000);
}

window.addEventListener("message", (e) => {
    if (e.data.parsedSkinsSticker) {
        const skins = e.data.parsedSkinsSticker
        console.log(skins)
        if (skins.error) {

            const row = document.createElement('div');
            row.classList.add('table-content__info-row');
            row.innerHTML = `<h4>${formatDate()} - ${skins.error}</h4><p>Status: ${skins?.status}</p>`;
            logsTable.appendChild(row);
            if (skins.status === 409) {
                startButton.classList.toggle('active');
                clearTimeout(timeout);
            }
            return;
        }
        const toBot = [];
        skins.forEach(skin => {
            if (histrory.includes(skin.id)) return;
            histrory.push(skin.id);
            toBot.push(skin);
            const row = document.createElement('div');
            row.classList.add('table-content__info-row');
            let message = `
                <h3>${skin.name}</h3>
                <div class="info-main">
                    <div class="info-left">
                        <h4>Price: $${skin.price}</h4>
                        <h4>Def Price: $${skin.defprice || ' '}</h4>
                        <h4>Profit: ${skin.profit}%</h4>
                        <h4>Stickers Price: $${skin.totalStickersPrice.toFixed(2)}</h4>
                        <h4><a href="${skin.link}" target="_blank">СS.Money Link</a></h4>
                    </div>
                    <div class="info-right">
                    <h4>Stickers:</h3>
            `;
            for (const sticker of skin.stickers) {
				if (sticker.wear === 0) message += `<h5> - ${sticker.name}: $${sticker.price}</h5>`
				else message += `<h5> - ${sticker.name}: (Wear: ${sticker.wear.toFixed(2)})</h5>`
			}
            message += `</div>`
            row.innerHTML = message
            table.appendChild(row);
        });
        const chatId = localStorage.getItem('telegram-id');
        if (toBot.length && chatId) {
            fetch('/telegram', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ chatId, data: toBot })
            })
            .then(res => res.json())
            .then(console.log)
            .catch(console.error);
        }
    }
});

function formatDate() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
  
    return `${hours}:${minutes}:${seconds}`;
}