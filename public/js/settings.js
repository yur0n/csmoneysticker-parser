
const uploadBtn = document.querySelector('.logs__button__upload');
const inputs = document.querySelectorAll('input');
// const logsTable = document.querySelector('.logs-content__info');

const fileStorage = localforage.createInstance({ name: 'fileStorage' });

uploadBtn.addEventListener('click', function() {
  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'file';
  hiddenInput.accept = '.txt';
  hiddenInput.style.display = 'none';

  hiddenInput.addEventListener('change', function() {
    const file = this.files[0];

    if (file) {
      const reader = new FileReader();
      reader.readAsText(file);

      reader.onload = function(e) {
				fileStorage.clear()
        const text = e.target.result
				const lines = text.split('\n')
				lines.forEach(line => {
					const [name, defPrice, maxPrice] = line.split(';').map(part => part.trim());
					fileStorage.setItem(genKey(), { name, defPrice, maxPrice })
				});
      };

      reader.onerror = function(e) {
        console.error("Error reading file:", e);
      };
    }
  });

  hiddenInput.click();
});

inputs.forEach(input => {
	if (input.className == 'input input-sticker' || input.className == 'logs__button') return;
	
	let value = localStorage.getItem(input.id);
	const profit = input.id === 'min-profit' || input.id === 'overpay';
	input.value = value ? profit ? value + '%' : value : '';

	input.addEventListener('change', () => {
		let value = input.value;
		if (profit) {
			value = value.replace(/\D/g, '');
			input.value = value + '%';
		}
		localStorage.setItem(input.id, value);
	});
});


////////////////////////////////////////////////////////////////////

const addBtn = document.querySelector('.logs__button__check');
const deleteBtn = document.querySelector('.logs__button__trash');

const itemNameInput = document.querySelector('.logs-buttons input');
let selectableDivs = document.querySelectorAll('.item-name');

const storage = localforage.createInstance({ name: 'storage' });

function genKey() {
	return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

// load items from storage
storage.iterate((value, key) => {
	loadItems(key, value);
}).catch(console.error);

selectableDivs.forEach(div => {
	div.addEventListener('click', function () {
		this.classList.toggle('selected');
	});
});

deleteBtn.addEventListener('click', async function (e) {
	e.preventDefault();
	const selectedDivs = document.querySelectorAll('.item-name.selected');
	if (selectedDivs) {
		for (const div of selectedDivs) {
			const key = div.dataset.key;
			div.parentElement.remove();
			await storage.removeItem(key).catch(console.error);
		}
	}
});

addBtn.addEventListener('click', async (e) => {
	e.preventDefault();
	const itemNameText = itemNameInput.value;

	if (itemNameInput.value.length < 5) return;

	itemNameInput.value = '';
	const key = genKey();

	loadItems(key, {
		name: itemNameText, defPrice: '', maxPrice: ''
	});
});

function loadItems(key, item) {
	logsTable.insertAdjacentHTML('beforeend', `
		<div class="logs-content__info-row">
			<h4 class="item-name" data-key="${key ? key : ''}">${item.name ? item.name : ''}</h4>
			<ul>
				<li>
					<input type="number" name="defPrice" value="${item.defPrice ? item.defPrice : ''}">
				</li>
				<li>
					<input type="number" name="maxPrice" value="${item.maxPrice ? item.maxPrice : ''}">
				</li>
			</ul>
		</div>
	`)

	const itemName = logsTable.querySelector(`.item-name[data-key="${key}"]`)

	itemName.addEventListener('click', function () {
		this.classList.toggle('selected');
	});

	storage.setItem(key, item);

	// if (!item.name) await storage.setItem(itemNameText, { name: itemNameText, ...item });

	logsTable.querySelectorAll('input').forEach(input => {
		input.addEventListener('change', e => {
			storage.getItem(key)
				.then(item => {
					item[e.target.name] = +(e.target.value);
					storage.setItem(key, item);
				})
				.catch(console.error);
		});
	});
}

// ============================================================================ >
const sticker = document.querySelector('.sticker')
const inputSticker = document.querySelector('.input-sticker')
const stickerContent = document.querySelector('.sticker-content')

const storage2 = localforage.createInstance({ name: 'storage2' });

if (sticker) {
	sticker.addEventListener('click', e => {
		if (e.target.closest('.btn-sticker-add')) {
			addStickerItem()
		}
		if (e.target.closest('.btn-sticker-remove')) {
			removeStickerItem()
		}
	})

	storage2.iterate((value, key) => {
		loadItemsSticker(key, value);
	}).catch(console.error);

	function removeStickerItem() {
		const stickerContent = document.querySelectorAll('.item-name-sticker.selected');
		if (stickerContent) {
			for (const div of stickerContent) {
				const key = div.dataset.key;
				div.parentElement.remove();
				storage2.removeItem(key).catch(console.error);
			}
		}
	}


	function addStickerItem() {
		if (inputSticker.value.length < 5) return
		const itemNameText = inputSticker.value

		inputSticker.value = ''
		const key = genKey()

		loadItemsSticker(key, { name: itemNameText, overpay: '' })
	}

	function loadItemsSticker(key, item) {
		stickerContent.insertAdjacentHTML('beforeend', `
			<div class="sticker__item">
				<div class="sticker__item_content item-name-sticker" data-key="${key ? key : ''}">
					<p>${item.name ? item.name : ''}</p>
				</div>
				<ul>
					<li>
						<input type="text" name="overpay" class="input" value="${item.overpay ? item.overpay + '%' : ''}">
					</li>
				</ul>
			</div>
		`)

		const itemName = stickerContent.querySelector(`.item-name-sticker[data-key="${key}"]`)

		itemName.addEventListener('click', function () {
			this.classList.toggle('selected');
		});

		storage2.setItem(key, item);

		stickerContent.querySelectorAll('input').forEach(input => {
			input.addEventListener('change', e => {
				let value = e.target.value.replace(/\D/g, '');
				input.value = value + '%';
				storage2.getItem(key)
					.then(item => {
						item.overpay = value
						storage2.setItem(key, item);
					})
					.catch(console.error);
			});
		});
	}
}