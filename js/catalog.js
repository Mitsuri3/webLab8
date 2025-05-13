// URL для JSON Server
const API_URL = 'http://localhost:3000/products';

// Элементы DOM
const productsContainer = document.getElementById('productsContainer');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const categoryFilter = document.getElementById('categoryFilter');
const minPrice = document.getElementById('minPrice');
const maxPrice = document.getElementById('maxPrice');
const minRating = document.getElementById('minRating');
const maxRating = document.getElementById('maxRating');
const applyFiltersBtn = document.getElementById('applyFilters');
const resetFiltersBtn = document.getElementById('resetFilters');
const cartButton = document.getElementById('cartButton');
const cartModal = document.getElementById('cartModal');
const cartItemsContainer = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const cartCount = document.getElementById('cartCount');
const closeCart = document.querySelector('.close-cart');
const checkoutBtn = document.getElementById('checkoutBtn');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notificationMessage');
const favoritesButton = document.getElementById('favoritesButton');
const favoritesModal = document.getElementById('favoritesModal');
const favoritesItemsContainer = document.getElementById('favoritesItems');
const favoritesCount = document.getElementById('favoritesCount');
const closeFavorites = document.querySelector('.close-favorites');
const clearFavoritesBtn = document.getElementById('clearFavoritesBtn');
const paginationContainer = document.getElementById('pagination');

// Состояние приложения
let cart = [];
let favorites = [];
let currentProducts = [];
let allProducts = [];
let currentPage = 1;
const itemsPerPage = 4;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
    // Загрузка и валидация корзины
    try {
        const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
        cart = storedCart.filter(item => 
            item && 
            Number.isInteger(Number(item.id)) && 
            item.id > 0 && 
            item.name && 
            typeof item.price === 'number' && 
            Number.isInteger(item.quantity) && 
            item.quantity > 0
        );
        console.log('Loaded cart from localStorage:', JSON.stringify(cart));
        localStorage.setItem('cart', JSON.stringify(cart));
    } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    // Загрузка и валидация избранного
    try {
        const storedFavorites = JSON.parse(localStorage.getItem('favorites')) || [];
        favorites = storedFavorites.filter(item => 
            item && 
            Number.isInteger(Number(item.id)) && 
            item.id > 0 && 
            item.name && 
            typeof item.price === 'number'
        );
        console.log('Loaded favorites from localStorage:', JSON.stringify(favorites));
        localStorage.setItem('favorites', JSON.stringify(favorites));
    } catch (error) {
        console.error('Error parsing favorites from localStorage:', error);
        favorites = [];
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }

    await fetchAllProducts();
    renderCategories();
    updateCart();
    updateFavorites();
    setupEventListeners();
    fetchProducts();
});

// Установка слушателей событий
function setupEventListeners() {
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    sortSelect.addEventListener('change', handleSort);
    categoryFilter.addEventListener('click', handleCategoryFilter);
    applyFiltersBtn.addEventListener('click', handleAdvancedFilter);
    resetFiltersBtn.addEventListener('click', resetFilters);
    cartButton.addEventListener('click', showCart);
    closeCart.addEventListener('click', hideCart);
    checkoutBtn.addEventListener('click', handleCheckout);
    favoritesButton.addEventListener('click', showFavorites);
    closeFavorites.addEventListener('click', hideFavorites);
    clearFavoritesBtn.addEventListener('click', handleClearFavorites);
    setupCartEventListeners();
}

// Делегация событий для корзины
function setupCartEventListeners() {
    cartItemsContainer.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const productId = Number(button.dataset.id);
        if (isNaN(productId) || productId <= 0) {
            console.error('Invalid product ID:', button.dataset.id, 'Button HTML:', button.outerHTML);
            showNotification('Ошибка: неверный ID товара');
            return;
        }

        console.log('Cart button clicked, ID:', productId, 'Classes:', button.classList.toString());

        if (button.classList.contains('quantity-btn')) {
            handleQuantityChange(button, productId);
        } else if (button.classList.contains('cart-item-remove')) {
            handleRemoveFromCart(productId);
        }
    });
}

// Debounce для поиска
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Загрузка всех продуктов
async function fetchAllProducts() {
    try {
        const response = await fetch(`${API_URL}?_limit=1000`, {
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        if (!response.ok) throw new Error('Ошибка загрузки всех продуктов');
        allProducts = await response.json();
        console.log('All products loaded:', allProducts);
        console.log('Total products:', allProducts.length);
    } catch (error) {
        console.error('Error fetching all products:', error);
        showNotification('Ошибка загрузки продуктов. Попробуйте позже.');
    }
}

// Применение фильтров и пагинации
function fetchProducts(params = {}) {
    try {
        let filteredProducts = [...allProducts];

        if (params.q) {
            const searchTerm = params.q.toLowerCase();
            filteredProducts = filteredProducts.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm)
            );
        }

        if (params.category) {
            filteredProducts = filteredProducts.filter(product => product.category === params.category);
        }

        if (params.price_gte) {
            filteredProducts = filteredProducts.filter(product => product.price >= parseFloat(params.price_gte));
        }
        if (params.price_lte) {
            filteredProducts = filteredProducts.filter(product => product.price <= parseFloat(params.price_lte));
        }

        if (params.rating_gte) {
            filteredProducts = filteredProducts.filter(product => product.rating >= parseFloat(params.rating_gte));
        }
        if (params.rating_lte) {
            filteredProducts = filteredProducts.filter(product => product.rating <= parseFloat(params.rating_lte));
        }

        if (params._sort && params._order) {
            filteredProducts.sort((a, b) => {
                const field = params._sort;
                const order = params._order === 'asc' ? 1 : -1;
                return (a[field] - b[field]) * order;
            });
        }

        const totalItems = filteredProducts.length;
        console.log('Filtered products:', filteredProducts);
        console.log('Total items after filtering:', totalItems);

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        currentProducts = filteredProducts.slice(startIndex, endIndex);

        console.log(`Products on page ${currentPage}:`, currentProducts);
        console.log(`Product IDs on page ${currentPage}:`, currentProducts.map(p => p.id));

        renderProducts(currentProducts);
        renderPagination(totalItems);
    } catch (error) {
        console.error('Error in fetchProducts:', error);
        showNotification('Ошибка обработки продуктов.');
        productsContainer.innerHTML = '<p>Ошибка обработки продуктов.</p>';
    }
    setupProductEventListeners();
}

// Отрисовка категорий
function renderCategories() {
    const categories = new Set(allProducts.map(p => p.category));
    categoryFilter.innerHTML = '<button class="category-btn active" data-category="all">All</button>';
    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.dataset.category = category;
        btn.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        categoryFilter.appendChild(btn);
    });
}

// Отрисовка продуктов
function renderProducts(productsToRender) {
    if (!productsContainer) {
        console.error('Контейнер productsContainer не найден');
        return;
    }
    if (!Array.isArray(productsToRender) || productsToRender.length === 0) {
        productsContainer.innerHTML = '<p>Товары не найдены.</p>';
        return;
    }

    productsContainer.innerHTML = '';
    productsToRender.forEach(product => {
        const isFavorited = favorites.some(fav => fav.id === Number(product.id));
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.img}" alt="${product.name}">
            ${product.isNew ? '<span class="product-badge">New</span>' : ''}
            ${product.discount > 0 ? `<span class="product-badge">${product.discount}% Off</span>` : ''}
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <p class="product-price">$${product.price}</p>
                <p class="product-rating">★ ${product.rating}</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button class="button add-to-cart" data-id="${product.id}">Добавить в корзину</button>
                    <button class="button toggle-favorite" data-id="${product.id}">
                        ${isFavorited ? 'Удалить из избранного' : 'Добавить в избранное'}
                        <i class="fas fa-heart" style="color: ${isFavorited ? '#ff4444' : '#aaa'}; margin-left: 5px;"></i>
                    </button>
                </div>
            </div>
        `;
        productsContainer.appendChild(productCard);
    });
}

// Пагинация
function renderPagination(totalItems) {
    console.log('Rendering pagination with total items:', totalItems);
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    console.log('Total pages:', totalPages);
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.textContent = 'Предыдущая';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchProducts(getCurrentFilters());
        }
    });
    paginationContainer.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
        btn.textContent = i;
        btn.addEventListener('click', () => {
            currentPage = i;
            fetchProducts(getCurrentFilters());
        });
        paginationContainer.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.textContent = 'Следующая';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchProducts(getCurrentFilters());
        }
    });
    paginationContainer.appendChild(nextBtn);
}

// Получение текущих фильтров
function getCurrentFilters() {
    const filters = {};
    if (searchInput.value.trim()) filters.q = searchInput.value.trim();
    if (sortSelect.value !== 'default') {
        const [field, order] = sortSelect.value.split('-');
        filters._sort = field;
        filters._order = order;
    }
    const activeCategory = document.querySelector('.category-btn.active')?.dataset.category;
    if (activeCategory && activeCategory !== 'all') filters.category = activeCategory;
    if (minPrice.value) filters.price_gte = minPrice.value;
    if (maxPrice.value) filters.price_lte = maxPrice.value;
    if (minRating.value) filters.rating_gte = minRating.value;
    if (maxRating.value) filters.rating_lte = maxRating.value;
    return filters;
}

// Обработчик поиска
function handleSearch() {
    currentPage = 1;
    fetchProducts({ q: searchInput.value.trim() });
}

// Обработчик сортировки
function handleSort() {
    currentPage = 1;
    const [field, order] = sortSelect.value.split('-');
    fetchProducts({ _sort: field, _order: order });
}

// Обработчик фильтрации по категориям
function handleCategoryFilter(e) {
    if (e.target.classList.contains('category-btn')) {
        document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        currentPage = 1;
        const category = e.target.dataset.category;
        fetchProducts(category === 'all' ? {} : { category });
    }
}

// Обработчик расширенной фильтрации
function handleAdvancedFilter() {
    currentPage = 1;
    const filters = {};
    if (minPrice.value) filters.price_gte = minPrice.value;
    if (maxPrice.value) filters.price_lte = maxPrice.value;
    if (minRating.value) filters.rating_gte = minRating.value;
    if (maxRating.value) filters.rating_lte = maxRating.value;
    fetchProducts(filters);
}

// Сброс фильтров
function resetFilters() {
    searchInput.value = '';
    sortSelect.value = 'default';
    minPrice.value = '';
    maxPrice.value = '';
    minRating.value = '';
    maxRating.value = '';
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.category-btn[data-category="all"]').classList.add('active');
    currentPage = 1;
    fetchProducts();
}

// Делегация событий для карточек продуктов
function setupProductEventListeners() {
    productsContainer.removeEventListener('click', handleProductClick);
    productsContainer.addEventListener('click', handleProductClick);
}

async function handleProductClick(e) {
    const button = e.target.closest('button');
    if (!button) return;
    const id = Number(button.dataset.id);
    console.log('Button clicked, product ID:', id);
    let product;

    product = currentProducts.find(p => p.id === id) || allProducts.find(p => p.id === id);
    if (!product) {
        try {
            const response = await fetch(`${API_URL}/${id}`);
            if (!response.ok) throw new Error('Продукт не найден');
            product = await response.json();
        } catch (error) {
            console.error('Error fetching product:', error);
            showNotification('Ошибка: продукт не найден');
            return;
        }
    }

    if (button.classList.contains('add-to-cart')) {
        handleAddToCart(product);
    } else if (button.classList.contains('toggle-favorite')) {
        handleToggleFavorite(product);
    }
}

// Обработчик добавления в корзину
function handleAddToCart(product) {
    console.log('Adding to cart:', product);
    if (!product || !product.id || !product.name || !product.price) {
        console.error('Invalid product data:', product);
        showNotification('Ошибка: данные продукта некорректны');
        return;
    }
    const productId = Number(product.id);
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        cart = cart.map(item =>
            item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
    } else {
        cart.push({ ...product, id: productId, quantity: 1 });
    }
    console.log('Cart after adding:', JSON.stringify(cart));
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
    showNotification(`${product.name} добавлен в корзину!`);
}

// Обновление корзины
function updateCart() {
    console.log('Updating cart:', JSON.stringify(cart));
    localStorage.setItem('cart', JSON.stringify(cart));
    cartCount.textContent = cart.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    cartItemsContainer.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        if (!item.id || !item.name || !item.price || !item.img || !item.quantity) {
            console.error('Invalid cart item skipped:', item);
            return;
        }
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.img}" alt="${item.name}">
            <div class="cart-item-info">
                <h4 class="cart-item-title">${item.name}</h4>
                <p class="cart-item-price">$${item.price}</p>
                <div class="cart-item-quantity">
                    <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                    <input type="text" class="quantity-value" value="${item.quantity}" readonly>
                    <button class="quantity-btn increase" data-id="${item.id}">+</button>
                </div>
            </div>
            <button class="cart-item-remove" data-id="${item.id}">×</button>
        `;
        cartItemsContainer.appendChild(cartItem);
    });

    cartTotal.textContent = total ? `$${total.toFixed(2)}` : '$0.00';
    console.log('Cart updated, total:', total);
}

// Изменение количества товара
function handleQuantityChange(button, productId) {
    console.log('Handling quantity change, ID:', productId, 'Cart:', JSON.stringify(cart));
    const cartItem = cart.find(item => item.id === Number(productId));
    if (!cartItem) {
        console.error('Cart item not found for ID:', productId, 'Current cart:', JSON.stringify(cart));
        showNotification('Ошибка: товар не найден в корзине');
        return;
    }

    const isIncrease = button.classList.contains('increase');
    console.log('Is increase:', isIncrease, 'Current quantity:', cartItem.quantity);

    if (isIncrease) {
        cart = cart.map(item =>
            item.id === Number(productId) ? { ...item, quantity: item.quantity + 1 } : item
        );
    } else if (cartItem.quantity > 1) {
        cart = cart.map(item =>
            item.id === Number(productId) ? { ...item, quantity: item.quantity - 1 } : item
        );
    } else {
        cart = cart.filter(item => item.id !== Number(productId));
    }

    console.log('Cart after quantity change:', JSON.stringify(cart));
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
    showNotification(`Количество обновлено для ${cartItem.name}`);
}

// Удаление товара из корзины
function handleRemoveFromCart(productId) {
    console.log('Handling remove from cart, ID:', productId, 'Cart:', JSON.stringify(cart));
    const cartItem = cart.find(item => item.id === Number(productId));
    if (!cartItem) {
        console.error('Cart item not found for ID:', productId, 'Current cart:', JSON.stringify(cart));
        showNotification('Ошибка: товар не найден в корзине');
        return;
    }

    cart = cart.filter(item => item.id !== Number(productId));
    console.log('Cart after removal:', JSON.stringify(cart));
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
    showNotification(`${cartItem.name} удален из корзины`);
}

// Показать корзину
function showCart() {
    cartModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Скрыть корзину
function hideCart() {
    cartModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Оформление заказа
function handleCheckout() {
    if (cart.length === 0) {
        showNotification('Ваша корзина пуста!');
        return;
    }
    showNotification('Оформление заказа успешно!');
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
    hideCart();
}

// Обработчик добавления/удаления в избранное
function handleToggleFavorite(product) {
    console.log('Toggling favorite, product:', product);
    if (!product || !product.id || !product.name || !product.price) {
        console.error('Invalid product data:', product);
        showNotification('Ошибка: данные продукта некорректны');
        return;
    }
    const productId = Number(product.id);
    const isFavorited = favorites.some(fav => fav.id === productId);
    if (isFavorited) {
        favorites = favorites.filter(fav => fav.id !== productId);
        console.log('Favorites after removal:', JSON.stringify(favorites));
        showNotification(`${product.name} удален из избранного!`);
    } else {
        favorites.push({ ...product, id: productId });
        console.log('Favorites after adding:', JSON.stringify(favorites));
        showNotification(`${product.name} добавлен в избранное!`);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavorites();
    renderProducts(currentProducts);
    setupProductEventListeners();
}

// Обновление избранного
function updateFavorites() {
    console.log('Updating favorites:', JSON.stringify(favorites));
    localStorage.setItem('favorites', JSON.stringify(favorites));
    favoritesCount.textContent = favorites.length;
    favoritesItemsContainer.innerHTML = '';

    favorites.forEach(item => {
        if (!item.id || !item.name || !item.price || !item.img) {
            console.error('Invalid favorite item skipped:', item);
            return;
        }
        const favoriteItem = document.createElement('div');
        favoriteItem.className = 'favorites-item';
        favoriteItem.innerHTML = `
            <img src="${item.img}" alt="${item.name}">
            <div class="favorites-item-info">
                <h4 class="favorites-item-title">${item.name}</h4>
                <p class="favorites-item-price">$${item.price}</p>
            </div>
            <button class="favorites-item-remove" data-id="${item.id}">×</button>
        `;
        favoritesItemsContainer.appendChild(favoriteItem);
    });

    // Делегация событий для кнопок удаления
    favoritesItemsContainer.querySelectorAll('.favorites-item-remove').forEach(button => {
        button.addEventListener('click', handleRemoveFromFavorites);
    });
    console.log('Favorites updated, count:', favorites.length);
}

// Удаление из избранного
function handleRemoveFromFavorites(e) {
    const button = e.target.closest('.favorites-item-remove');
    if (!button) return;

    const productId = Number(button.dataset.id);
    if (isNaN(productId) || productId <= 0) {
        console.error('Invalid product ID:', button.dataset.id, 'Button HTML:', button.outerHTML);
        showNotification('Ошибка: неверный ID товара');
        return;
    }

    console.log('Handling remove from favorites, ID:', productId, 'Favorites:', JSON.stringify(favorites));
    const favoriteItem = favorites.find(item => item.id === productId);
    if (!favoriteItem) {
        console.error('Favorite item not found for ID:', productId, 'Current favorites:', JSON.stringify(favorites));
        showNotification('Ошибка: товар не найден в избранном');
        return;
    }

    favorites = favorites.filter(item => item.id !== productId);
    console.log('Favorites after removal:', JSON.stringify(favorites));
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavorites();
    renderProducts(currentProducts);
    setupProductEventListeners();
    showNotification(`${favoriteItem.name} удален из избранного!`);
}

// Показать избранное
function showFavorites() {
    favoritesModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Скрыть избранное
function hideFavorites() {
    favoritesModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Очистка избранного
function handleClearFavorites() {
    if (favorites.length === 0) {
        showNotification('Список избранного пуст!');
        return;
    }
    favorites = [];
    console.log('Favorites cleared:', JSON.stringify(favorites));
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavorites();
    renderProducts(currentProducts);
    setupProductEventListeners();
    showNotification('Избранное очищено!');
}

// Показ уведомления
function showNotification(message) {
    notificationMessage.textContent = message;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}