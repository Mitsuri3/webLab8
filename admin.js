// Элементы DOM
const productForm = document.getElementById('productForm');
const productIdInput = document.getElementById('productId');
const productNameInput = document.getElementById('productName');
const productPriceInput = document.getElementById('productPrice');
const productImgInput = document.getElementById('productImg');
const productDescriptionInput = document.getElementById('productDescription');
const productCategoryInput = document.getElementById('productCategory');
const productRatingInput = document.getElementById('productRating');
const productIsNewInput = document.getElementById('productIsNew');
const productDiscountInput = document.getElementById('productDiscount');
const submitProductBtn = document.getElementById('submitProduct');
const productList = document.getElementById('productList');
const feedbackList = document.getElementById('feedbackList');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notificationMessage');

// Утилита для уведомлений
function showNotification(message) {
    notificationMessage.textContent = message;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Доступ только для администраторов');
        setTimeout(() => {
            window.location.href = 'catalog.html';
        }, 1000);
        return;
    }

    // Загрузка продуктов и отзывов
    loadProducts();
    loadFeedback();

    // Валидация формы продукта
    productForm.addEventListener('input', validateProductForm);
    productForm.addEventListener('submit', handleProductSubmit);
});

// Валидация формы продукта
function validateProductForm() {
    let isValid = true;

    if (!productNameInput.value.trim()) {
        document.getElementById('productNameError').textContent = 'Введите название';
        isValid = false;
    } else {
        document.getElementById('productNameError').textContent = '';
    }

    if (!productPriceInput.value || productPriceInput.value <= 0) {
        document.getElementById('productPriceError').textContent = 'Введите корректную цену';
        isValid = false;
    } else {
        document.getElementById('productPriceError').textContent = '';
    }

    if (!productImgInput.value.trim()) {
        document.getElementById('productImgError').textContent = 'Введите URL изображения';
        isValid = false;
    } else {
        document.getElementById('productImgError').textContent = '';
    }

    if (!productDescriptionInput.value.trim()) {
        document.getElementById('productDescriptionError').textContent = 'Введите описание';
        isValid = false;
    } else {
        document.getElementById('productDescriptionError').textContent = '';
    }

    if (!productCategoryInput.value.trim()) {
        document.getElementById('productCategoryError').textContent = 'Введите категорию';
        isValid = false;
    } else {
        document.getElementById('productCategoryError').textContent = '';
    }

    if (!productRatingInput.value || productRatingInput.value < 0 || productRatingInput.value > 5) {
        document.getElementById('productRatingError').textContent = 'Рейтинг должен быть от 0 до 5';
        isValid = false;
    } else {
        document.getElementById('productRatingError').textContent = '';
    }

    submitProductBtn.disabled = !isValid;
}

// Загрузка продуктов
async function loadProducts() {
    try {
        const response = await fetch('http://localhost:3000/products');
        const products = await response.json();
        productList.innerHTML = '';
        products.forEach(product => {
            const item = document.createElement('div');
            item.className = 'admin-item';
            item.innerHTML = `
                <p>${product.name} - $${product.price}</p>
                <div>
                    <button class="edit" data-id="${product.id}">Edit</button>
                    <button class="delete" data-id="${product.id}">Delete</button>
                </div>
            `;
            productList.appendChild(item);
        });

        // Обработчики кнопок
        productList.querySelectorAll('.edit').forEach(btn => {
            btn.addEventListener('click', () => editProduct(btn.dataset.id));
        });
        productList.querySelectorAll('.delete').forEach(btn => {
            btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
        });
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Ошибка загрузки продуктов');
    }
}

// Загрузка отзывов
async function loadFeedback() {
    try {
        const response = await fetch('http://localhost:3000/feedback');
        const feedback = await response.json();
        feedbackList.innerHTML = '';
        for (const item of feedback) {
            const productResponse = await fetch(`http://localhost:3000/products/${item.productId}`);
            const product = productResponse.ok ? await productResponse.json() : { name: 'Unknown' };
            const div = document.createElement('div');
            div.className = 'admin-item';
            div.innerHTML = `
                <p>${product.name}: ${item.comment} (Rating: ${item.rating})</p>
                <button class="delete" data-id="${item.id}">Delete</button>
            `;
            feedbackList.appendChild(div);
        }

        feedbackList.querySelectorAll('.delete').forEach(btn => {
            btn.addEventListener('click', () => deleteFeedback(btn.dataset.id));
        });
    } catch (error) {
        console.error('Error loading feedback:', error);
        showNotification('Ошибка загрузки отзывов');
    }
}

// Отправка/обновление продукта
async function handleProductSubmit(e) {
    e.preventDefault();
    const product = {
        name: productNameInput.value,
        price: Number(productPriceInput.value),
        img: productImgInput.value,
        description: productDescriptionInput.value,
        category: productCategoryInput.value,
        rating: Number(productRatingInput.value),
        isNew: productIsNewInput.checked,
        discount: Number(productDiscountInput.value) || 0
    };

    try {
        const method = productIdInput.value ? 'PUT' : 'POST';
        const url = productIdInput.value
            ? `http://localhost:3000/products/${productIdInput.value}`
            : 'http://localhost:3000/products';
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(product)
        });

        if (!response.ok) throw new Error('Ошибка при сохранении продукта');

        showNotification(productIdInput.value ? 'Продукт обновлён!' : 'Продукт добавлен!');
        productForm.reset();
        productIdInput.value = '';
        submitProductBtn.textContent = 'Add Product';
        submitProductBtn.disabled = true;
        loadProducts();
    } catch (error) {
        console.error('Error saving product:', error);
        showNotification('Ошибка при сохранении продукта');
    }
}

// Редактирование продукта
async function editProduct(id) {
    try {
        const response = await fetch(`http://localhost:3000/products/${id}`);
        const product = await response.json();
        productIdInput.value = product.id;
        productNameInput.value = product.name;
        productPriceInput.value = product.price;
        productImgInput.value = product.img;
        productDescriptionInput.value = product.description;
        productCategoryInput.value = product.category;
        productRatingInput.value = product.rating;
        productIsNewInput.checked = product.isNew;
        productDiscountInput.value = product.discount;
        submitProductBtn.textContent = 'Update Product';
        validateProductForm();
    } catch (error) {
        console.error('Error loading product:', error);
        showNotification('Ошибка загрузки продукта');
    }
}

// Удаление продукта
async function deleteProduct(id) {
    try {
        const response = await fetch(`http://localhost:3000/products/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Ошибка при удалении продукта');
        showNotification('Продукт удалён!');
        loadProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Ошибка при удалении продукта');
    }
}

// Удаление отзыва
async function deleteFeedback(id) {
    try {
        const response = await fetch(`http://localhost:3000/feedback/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Ошибка при удалении отзыва');
        showNotification('Отзыв удалён!');
        loadFeedback();
    } catch (error) {
        console.error('Error deleting feedback:', error);
        showNotification('Ошибка при удалении отзыва');
    }
}