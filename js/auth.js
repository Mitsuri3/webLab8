// Топ-100 паролей 2024 
const commonPasswords = ['Password123!', 'Qwerty2024', 'Admin123', '12345678'];

// Элементы DOM
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const phoneInput = document.getElementById('phone');
const emailInput = document.getElementById('email');
const birthDateInput = document.getElementById('birthDate');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const middleNameInput = document.getElementById('middleName');
const nicknameInput = document.getElementById('nickname');
const generateNicknameBtn = document.getElementById('generateNickname');
const termsInput = document.getElementById('terms');
const registerBtn = document.getElementById('registerBtn');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notificationMessage');
const tabs = document.querySelectorAll('.auth-tab');
const passwordMethodInputs = document.querySelectorAll('input[name="passwordMethod"]');
const nicknameAttemptsText = document.getElementById('nicknameAttempts');

// Состояние
let nicknameAttempts = 5;
let isManualNickname = false;

// Утилита для уведомлений
function showNotification(message) {
    notificationMessage.textContent = message;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    // Переключение вкладок
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            registerForm.style.display = tab.dataset.tab === 'register' ? 'block' : 'none';
            loginForm.style.display = tab.dataset.tab === 'login' ? 'block' : 'none';
        });
    });

    // Открытие нужной вкладки по URL
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab === 'login') {
        tabs[1].click();
    }

    // Валидация формы регистрации
    registerForm.addEventListener('input', validateRegisterForm);
    registerForm.addEventListener('submit', handleRegister);
    loginForm.addEventListener('submit', handleLogin);
    generateNicknameBtn.addEventListener('click', generateNickname);
    passwordMethodInputs.forEach(input => {
        input.addEventListener('change', handlePasswordMethodChange);
    });

    // Генерация начального никнейма
    generateNickname();
});

// Валидация формы регистрации
async function validateRegisterForm() {
    let isValid = true;

    // Телефон (Беларусь)
    const phoneRegex = /^\+375\s?\(?(29|33|44|25)\)?\s?\d{3}-?\d{2}-?\d{2}$/;
    if (!phoneRegex.test(phoneInput.value)) {
        document.getElementById('phoneError').textContent = 'Введите корректный номер РБ (+375 XX XXX-XX-XX)';
        isValid = false;
    } else {
        document.getElementById('phoneError').textContent = '';
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value)) {
        document.getElementById('emailError').textContent = 'Введите корректный email';
        isValid = false;
    } else {
        try {
            const response = await fetch(`http://localhost:3000/users?email=${encodeURIComponent(emailInput.value)}`);
            const users = await response.json();
            if (users.length > 0) {
                document.getElementById('emailError').textContent = 'Email уже зарегистрирован';
                isValid = false;
            } else {
                document.getElementById('emailError').textContent = '';
            }
        } catch (error) {
            console.error('Error checking email:', error);
        }
    }

    // Дата рождения (16+ лет)
    const today = new Date();
    const birthDate = new Date(birthDateInput.value);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    if (!birthDateInput.value || age < 16) {
        document.getElementById('birthDateError').textContent = 'Вам должно быть не менее 16 лет';
        isValid = false;
    } else {
        document.getElementById('birthDateError').textContent = '';
    }

    // Пароль
    const passwordMethod = document.querySelector('input[name="passwordMethod"]:checked').value;
    if (passwordMethod === 'manual') {
        const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
        if (!passwordRegex.test(passwordInput.value)) {
            document.getElementById('passwordError').textContent = 'Пароль должен содержать 8-20 символов, включая заглавную букву, строчную, цифру и спецсимвол';
            isValid = false;
        } else if (commonPasswords.includes(passwordInput.value)) {
            document.getElementById('passwordError').textContent = 'Пароль слишком распространён';
            isValid = false;
        } else {
            document.getElementById('passwordError').textContent = '';
        }

        // Подтверждение пароля
        if (passwordInput.value !== confirmPasswordInput.value) {
            document.getElementById('confirmPasswordError').textContent = 'Пароли не совпадают';
            isValid = false;
        } else {
            document.getElementById('confirmPasswordError').textContent = '';
        }
    } else {
        document.getElementById('passwordError').textContent = '';
        document.getElementById('confirmPasswordError').textContent = '';
    }

    // Имя и фамилия
    if (!firstNameInput.value.trim()) {
        document.getElementById('firstNameError').textContent = 'Введите имя';
        isValid = false;
    } else {
        document.getElementById('firstNameError').textContent = '';
    }

    if (!lastNameInput.value.trim()) {
        document.getElementById('lastNameError').textContent = 'Введите фамилию';
        isValid = false;
    } else {
        document.getElementById('lastNameError').textContent = '';
    }

    // Никнейм
    try {
        const response = await fetch(`http://localhost:3000/users?nickname=${encodeURIComponent(nicknameInput.value)}`);
        const users = await response.json();
        if (users.length > 0) {
            document.getElementById('nicknameError').textContent = 'Никнейм уже занят';
            isValid = false;
        } else {
            document.getElementById('nicknameError').textContent = '';
        }
    } catch (error) {
        console.error('Error checking nickname:', error);
    }

    // Условия
    if (!termsInput.checked) {
        document.getElementById('termsError').textContent = 'Необходимо согласиться с условиями';
        isValid = false;
    } else {
        document.getElementById('termsError').textContent = '';
    }

    registerBtn.disabled = !isValid;
}

// Генерация никнейма
async function generateNickname() {
    if (nicknameAttempts <= 0 && !isManualNickname) {
        nicknameInput.readonly = false;
        generateNicknameBtn.disabled = true;
        isManualNickname = true;
        showNotification('Введите никнейм вручную');
        return;
    }

    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    if (!firstName || !lastName) {
        showNotification('Введите имя и фамилию для генерации никнейма');
        return;
    }

    const prefixes = [
        firstName.slice(0, Math.floor(Math.random() * 3) + 1),
        lastName.slice(0, Math.floor(Math.random() * 3) + 1)
    ];
    const number = Math.floor(Math.random() * 990) + 10;
    const suffixes = ['', '_cool', '_pro', '_star'];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    let nickname = `${prefixes[0]}${prefixes[1]}${number}${suffix}`;

    try {
        const response = await fetch(`http://localhost:3000/users?nickname=${encodeURIComponent(nickname)}`);
        const users = await response.json();
        if (users.length > 0) {
            nicknameAttempts--;
            nicknameAttemptsText.textContent = `Attempts left: ${nicknameAttempts}`;
            generateNickname();
        } else {
            nicknameInput.value = nickname;
            nicknameAttempts--;
            nicknameAttemptsText.textContent = `Attempts left: ${nicknameAttempts}`;
            validateRegisterForm();
        }
    } catch (error) {
        console.error('Error checking nickname:', error);
    }
}

// Обработка выбора метода пароля
function handlePasswordMethodChange() {
    const method = document.querySelector('input[name="passwordMethod"]:checked').value;
    if (method === 'auto') {
        const autoPassword = generatePassword();
        passwordInput.value = autoPassword;
        confirmPasswordInput.value = autoPassword;
        passwordInput.readonly = true;
        confirmPasswordInput.readonly = true;
    } else {
        passwordInput.value = '';
        confirmPasswordInput.value = '';
        passwordInput.readonly = false;
        confirmPasswordInput.readonly = false;
    }
    validateRegisterForm();
}

// Генерация пароля
function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Добавляем обязательные символы
    password += 'A1a!';
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Регистрация
async function handleRegister(e) {
    e.preventDefault();
    const user = {
        phone: phoneInput.value,
        email: emailInput.value,
        birthDate: birthDateInput.value,
        password: passwordInput.value,
        firstName: firstNameInput.value,
        lastName: lastNameInput.value,
        middleName: middleNameInput.value || '',
        nickname: nicknameInput.value,
        role: 'customer',
        agreedToTerms: termsInput.checked,
        createdAt: new Date().toISOString()
    };

    try {
        const response = await fetch('http://localhost:3000/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        });

        if (!response.ok) throw new Error('Ошибка при регистрации');

        const newUser = await response.json();
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        showNotification('Регистрация успешна!');
        setTimeout(() => {
            window.location.href = 'catalog.html';
        }, 1000);
    } catch (error) {
        console.error('Error registering user:', error);
        showNotification('Ошибка при регистрации. Попробуйте позже.');
    }
}

// Авторизация
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`http://localhost:3000/users?email=${encodeURIComponent(email)}`);
        const users = await response.json();
        if (users.length === 0 || users[0].password !== password) {
            showNotification('Неверный email или пароль');
            return;
        }

        localStorage.setItem('currentUser', JSON.stringify(users[0]));
        showNotification('Авторизация успешна!');
        setTimeout(() => {
            window.location.href = 'catalog.html';
        }, 1000);
    } catch (error) {
        console.error('Error logging in:', error);
        showNotification('Ошибка при авторизации. Попробуйте позже.');
    }
}