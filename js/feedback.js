// Элементы DOM
const feedbackForm = document.getElementById('feedbackForm');
const productSelect = document.getElementById('productSelect');
const ratingSelect = document.getElementById('rating');
const commentInput = document.getElementById('comment');
const submitFeedbackBtn = document.getElementById('submitFeedback');
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
    if (!currentUser) {
        showNotification('Пожалуйста, войдите в аккаунт');
        setTimeout(() => {
            window.location.href = 'auth.html?tab=login';
        }, 1000);
        return;
    }

    if (currentUser.role === 'admin') {
        showNotification('Администраторы не могут оставлять отзывы');
        setTimeout(() => {
            window.location.href = 'catalog.html';
        }, 1000);
        return;
    }

    // Загрузка купленных товаров
    try {
        const response = await fetch(`http://localhost:3000/orders?userId=${currentUser.id}`);
        const orders = await response.json();
        const productIds = new Set();
        orders.forEach(order => {
            order.items.forEach(item => productIds.add(item.productId));
        });

        const products = [];
        for (const productId of productIds) {
            const productResponse = await fetch(`http://localhost:3000/products/${productId}`);
            if (productResponse.ok) {
                products.push(await productResponse.json());
            }
        }

        productSelect.innerHTML = '<option value="">Choose a product</option>';
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = product.name;
            productSelect.appendChild(option);
        });

        if (products.length === 0) {
            showNotification('У вас нет купленных товаров для отзыва');
            submitFeedbackBtn.disabled = true;
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Ошибка загрузки товаров');
    }

    // Валидация формы
    feedbackForm.addEventListener('input', validateFeedbackForm);
    feedbackForm.addEventListener('submit', handleFeedbackSubmit);
});

// Валидация формы
function validateFeedbackForm() {
    let isValid = true;

    if (!productSelect.value) {
        document.getElementById('productSelectError').textContent = 'Выберите товар';
        isValid = false;
    } else {
        document.getElementById('productSelectError').textContent = '';
    }

    if (!ratingSelect.value) {
        document.getElementById('ratingError').textContent = 'Выберите оценку';
        isValid = false;
    } else {
        document.getElementById('ratingError').textContent = '';
    }

    if (commentInput.value.length < 10) {
        document.getElementById('commentError').textContent = 'Комментарий должен содержать минимум 10 символов';
        isValid = false;
    } else {
        document.getElementById('commentError').textContent = '';
    }

    submitFeedbackBtn.disabled = !isValid;
}

// Отправка отзыва
async function handleFeedbackSubmit(e) {
    e.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const feedback = {
        userId: currentUser.id,
        productId: Number(productSelect.value),
        comment: commentInput.value,
        rating: Number(ratingSelect.value),
        createdAt: new Date().toISOString()
    };

    try {
        const response = await fetch('http://localhost:3000/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(feedback)
        });

        if (!response.ok) throw new Error('Ошибка при отправке отзыва');

        showNotification('Отзыв успешно отправлен!');
        feedbackForm.reset();
        submitFeedbackBtn.disabled = true;
    } catch (error) {
        console.error('Error submitting feedback:', error);
        showNotification('Ошибка при отправке отзыва. Попробуйте позже.');
    }
}