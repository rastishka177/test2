const toggleBtn = document.getElementById('menuToggle');
const menuList = document.getElementById('menuList');

toggleBtn.addEventListener('click', () => {
  menuList.classList.toggle('show');
});

// Конфигурация
const sheetID = "1kUUJ51TDZ5MCqBcGw-Dwr2I3MsaMCjIlNrinSMmYR_Y";
const sheetName = "Лист1";
const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;

// URL твоего Google Apps Script
const scriptURL = "https://script.google.com/macros/s/AKfycbxSCo0V1t8Ev-v2k0Dox8fftYhFwUyj06kavn29kkf8quMGuEiOznJ1xG-HPF6EGgBZ/exec";

let products = [];
let cart = [];



// Загрузка товаров
fetch(url)
  .then(res => res.text())
  .then(data => {
    const json = JSON.parse(data.substr(47).slice(0, -2));
    const rows = json.table.rows;

    products = rows.map(row => ({
      name: row.c[0]?.v || "Без названия",
      price: parseFloat(row.c[1]?.v) || 0,
      img: row.c[2]?.v || "https://via.placeholder.com/300"
    }));

    renderProducts(products);
  })
  .catch(err => console.error("Ошибка загрузки Google Sheets:", err));

// Отображение товаров
function renderProducts(list) {
  const productGrid = document.querySelector(".product-grid");
  productGrid.innerHTML = "";
  list.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-image">
        <img src="${product.img}" alt="${product.name}">
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <div class="product-price">${product.price} ₽</div>
        <a class="btn add-to-cart">В корзину</a>
      </div>
    `;
    card.querySelector(".add-to-cart").addEventListener("click", () => addToCart(product));
    productGrid.appendChild(card);
  });
}

// Поиск по товарам
document.getElementById("product-search").addEventListener("input", function() {
  const query = this.value.toLowerCase();
  const filtered = products.filter(p => p.name.toLowerCase().includes(query));
  renderProducts(filtered);
});


// Модальное окно для картинок
const modal = document.createElement('div');
modal.classList.add('modal');
modal.innerHTML = `
    <span class="close-modal">&times;</span>
    <img class="modal-content" id="modal-img">
`;
document.body.appendChild(modal);

const modalImg = document.getElementById("modal-img");
const closeModal = modal.querySelector(".close-modal");

function openModal(img) {
    modal.style.display = "block";
    modalImg.src = img.src;
}

closeModal.addEventListener("click", () => modal.style.display = "none");
modal.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

document.querySelectorAll(".gallery-item img, .contact-photos img").forEach(img => {
    img.style.cursor = "pointer";
    img.addEventListener("click", () => openModal(img));
});

// Корзина
const cartBtn = document.querySelector(".cart-btn");
const cartPopup = document.getElementById("cart-popup");

cartBtn.addEventListener("click", () => {
  cartPopup.style.display = cartPopup.style.display === "block" ? "none" : "block";
});

// Добавление товара в корзину
function addToCart(product) {
  const existingIndex = cart.findIndex(p => p.name === product.name);
  if (existingIndex > -1) {
    cart[existingIndex].quantity += 1;
  } else {
    cart.push({...product, quantity: 1});
  }
  updateCartUI();
}

// Обновление корзины
function updateCartUI() {
  const cartItems = document.getElementById("cart-items");
  const cartCount = document.getElementById("cart-count");
  const cartTotal = document.getElementById("cart-total");

  cartItems.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    total += item.price * item.quantity;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      ${item.name} - ${item.price} ₽
      <input type="number" min="1" value="${item.quantity}" class="cart-qty" style="width:50px; margin:0 5px;">
      <button class="remove-btn" style="font-size:12px; padding:2px 6px;">✖</button>
    `;

    // Изменение количества
    div.querySelector(".cart-qty").addEventListener("input", (e) => {
      let qty = parseInt(e.target.value);
      if (isNaN(qty) || qty < 1) qty = 1;
      cart[index].quantity = qty;
      updateCartUI();
    });

    // Удаление товара
    div.querySelector(".remove-btn").addEventListener("click", () => {
      cart.splice(index, 1); // Удаляем элемент из массива
      updateCartUI();
    });

    cartItems.appendChild(div);
  });

  cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartTotal.textContent = total;
}

// Привязка кнопок "В корзину" после загрузки товаров
function renderProducts(list) {
  const productGrid = document.querySelector(".product-grid");
  productGrid.innerHTML = "";
  list.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-image">
        <img src="${product.img}" alt="${product.name}">
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <div class="product-price">${product.price} ₽</div>
        <a class="btn add-to-cart">В корзину</a>
      </div>
    `;
    card.querySelector(".add-to-cart").addEventListener("click", () => addToCart(product));
    productGrid.appendChild(card);
  });
}


// Оформление заказа
document.getElementById("checkout-btn").addEventListener("click", () => {
  const name = document.getElementById("customer-name").value;
  const phone = document.getElementById("customer-phone").value;

  if (!name || !phone || cart.length === 0) {
    alert("Пожалуйста, заполните имя, телефон и добавьте товары в корзину.");
    return;
  }

  // Формируем список товаров с количеством
  const productsList = cart.map(item => `${item.name} - ${item.price} ₽ x ${item.quantity}`).join(", ");

  const orderData = {
    name,
    phone,
    products: productsList,
    total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    date: new Date().toLocaleString('ru-RU')
  };

  fetch(scriptURL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData)
  })
  .then(() => {
    alert("Заказ успешно отправлен! Скоро с вами свяжется наш продавец");
    cart = [];
    updateCartUI();
    document.getElementById("customer-name").value = "";
    document.getElementById("customer-phone").value = "";
    cartPopup.style.display = "none";
  })
  .catch(err => {
    console.error(err);
    alert("Ошибка при отправке заказа");
  });
});