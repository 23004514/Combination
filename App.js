// Global Application State
let currentUser = null;
let isLoggedIn = false;
const API_BASE_URL = 'http://localhost:8080/api'; // Defined API URL
let authToken = localStorage.getItem('authToken'); // Load token on start

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadUserData();
    generateCalendar();

    // Always redirect to login page on initial load if not logged in
    if (!isLoggedIn) {
        showPage('login');
    }
    // Add some petals when the app loads
    addPetals(10); 
});

function initializeApp() {
    // Check if user is logged in (using stored token/user)
    const storedUser = localStorage.getItem('currentUser');

    if (authToken && storedUser) {
        currentUser = JSON.parse(storedUser);
        isLoggedIn = true;
        updateUIForLoggedInUser();
        // Assume token is valid and navigate to home
        showPage('home'); 
    } else {
        isLoggedIn = false;
        showPage('login');
    }

    initializeProvinces(); 
}

// --- EVENT LISTENERS ---

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            
            if (isPageProtected(page) && !isLoggedIn) {
                showPage('login');
                return;
            }
            showPage(page);
        });
    });

    // Auth buttons (using IDs from your HTML structure)
    const loginBtn = document.getElementById('loginBtn');
    if(loginBtn) loginBtn.addEventListener('click', (e) => { e.preventDefault(); showPage('login'); });
    const registerBtn = document.getElementById('registerBtn');
    if(registerBtn) registerBtn.addEventListener('click', (e) => { e.preventDefault(); showPage('register'); });

    // Form submissions
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('forgotPasswordForm').addEventListener('submit', handleForgotPassword);
    document.getElementById('bookingForm').addEventListener('submit', handleBooking);
    document.getElementById('contactForm').addEventListener('submit', handleContact);

    // Profile and Settings
    document.getElementById('editBtn').addEventListener('click', toggleProfileEdit);
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Calendar
    document.getElementById('addReminderBtn').addEventListener('click', addReminder);

    // Quick links
    document.querySelectorAll('.quick-links a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            
            if (isPageProtected(page) && !isLoggedIn) {
                showPage('login');
                return;
            }
            showPage(page);
        });
    });
}

// --- UTILITY & NAVIGATION ---

function isPageProtected(pageId) {
    const protectedPages = ['home', 'booking', 'calendar', 'profile', 'settings'];
    return protectedPages.includes(pageId);
}

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show the selected page
    const pageElement = document.getElementById(pageId);
    if (pageElement) pageElement.classList.add('active');
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        }
    });
    
    // Special handling for certain pages
    if (pageId === 'home') {
        loadDashboardData();
    } else if (pageId === 'calendar') {
        generateCalendar();
    }
}

function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
}

// --- AUTHENTICATION (API INTEGRATED) ---

// Uses API for Login, stores token/user.
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    if (!email || !password) {
        alert("Please fill in all fields.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);

            // Assuming 'data.user' contains Name, Surname, email, cellphone, Province, etc.
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            currentUser = data.user;
            isLoggedIn = true;
            updateUIForLoggedInUser();
            showPage('home');
            alert("Login successful!");
        } else {
            alert(data.message || "Invalid credentials. Please try again.");
            if (data.message.includes("register")) {
                showPage('register');
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please check your network connection.');
    }
}

// Includes Province, still uses localStorage as a mock until a registration API is added.
function handleRegister(e) {
    e.preventDefault();

    const Name = document.getElementById('Name').value.trim();
    const Surname = document.getElementById('Surname').value.trim();
    const Email = document.getElementById('Email').value.trim();
    const Cellphone = document.getElementById('Cellphone').value.trim();
    const Password = document.getElementById('Password').value.trim();
    const Province = document.getElementById('province').value; // <-- FIX: Captures Province

    if (!Name || !Surname || !Email || !Cellphone || !Password || !Province) {
        alert("Please fill in all fields, including province.");
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users')) || [];

    const exists = users.some(u => u.email === Email || u.cellphone === Cellphone);
    if (exists) {
        alert("An account with that email or phone already exists.");
        return;
    }

    // <-- FIX: Province added to the user object
    const newUser = { Name, Surname, email: Email, cellphone: Cellphone, password: Password, Province };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // Auto-login the new user (Mock authentication)
    currentUser = newUser;
    isLoggedIn = true;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateUIForLoggedInUser();
    showPage('home');
    alert("Registration successful! Welcome.");
}

function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value.trim();
    
    if (!email) {
        alert("Please enter your email address.");
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userExists = users.some(u => u.email === email);
    
    if (!userExists) {
        alert("No account found with that email. Please register first.");
        showPage('register');
        return;
    }
    
    alert(`A password reset link has been sent to ${email}.`);
    showPage('login');
}

function handleLogout(e) {
    e.preventDefault();
    currentUser = null;
    isLoggedIn = false;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken'); // IMPORTANT: Remove token on logout
    authToken = null; 

    // Update UI
    document.getElementById('loginBtn').style.display = 'inline-block';
    document.getElementById('registerBtn').style.display = 'inline-block';
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.remove();

    showPage('login');
    alert("You have been logged out successfully.");
}

function updateUIForLoggedInUser() {
    // Update auth buttons
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('registerBtn').style.display = 'none';
    
    const authButtons = document.getElementById('authButtons');
    if (authButtons && !document.getElementById('logoutBtn')) {
        const logoutBtn = document.createElement('a');
        logoutBtn.href = '#';
        logoutBtn.className = 'btn btn-outline';
        logoutBtn.id = 'logoutBtn';
        logoutBtn.textContent = 'Logout';
        logoutBtn.addEventListener('click', handleLogout);
        authButtons.appendChild(logoutBtn);
    }
    
    // Update user info in dashboard and profile form
    if (currentUser) {
        // Dashboard
        document.getElementById('dashName').textContent = currentUser.Name || 'Not set';
        document.getElementById('dashEmail').textContent = currentUser.email || 'Not set';
        document.getElementById('dashCell').textContent = currentUser.cellphone || 'Not set';
        document.getElementById('dashProvince').textContent = currentUser.Province || 'Not set'; // <-- FIX: Uses Province
        
        // Profile form
        document.getElementById('surname').value = currentUser.Surname || '';
        document.getElementById('name').value = currentUser.Name || '';
        document.getElementById('email').value = currentUser.email || '';
        document.getElementById('cellphone').value = currentUser.cellphone || '';
        
        // Set Province value for the select element
        const profileProvince = document.getElementById('province');
        if (profileProvince) profileProvince.value = currentUser.Province || ''; 
    }
}

// --- DASHBOARD AND BOOKING (API INTEGRATED) ---

// Uses API for loading dashboard data.
async function loadDashboardData() {
    if (!isLoggedIn) return;

    try {
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (response.ok && data.success) {
            const recentBookingsList = document.getElementById('recentBookings');
            recentBookingsList.innerHTML = '';
            
            if (data.bookings.length === 0) {
                recentBookingsList.innerHTML = '<li>No recent bookings</li>';
            } else {
                data.bookings.slice(0, 5).forEach(booking => {
                    const li = document.createElement('li');
                    li.textContent = `${booking.from} to ${booking.to} on ${booking.date}`;
                    recentBookingsList.appendChild(li);
                });
            }
        } else {
            console.error('Failed to load bookings:', data.message);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        document.getElementById('recentBookings').innerHTML = '<li>Error loading bookings. Check API connection.</li>';
    }
}

function initializeProvinces() {
    const provinces = [
        "Gauteng", "KwaZulu-Natal", "Western Cape", "Eastern Cape", 
        "Free State", "Limpopo", "Mpumalanga", "North West", "Northern Cape"
    ];
    
    // Find both the booking selects and the profile select
    const fromSelect = document.getElementById('fromProvince');
    const toSelect = document.getElementById('toProvince');
    const registerProvince = document.getElementById('province');

    provinces.forEach(province => {
        // For Booking "From"
        if (fromSelect) {
            const option1 = document.createElement('option');
            option1.value = province;
            option1.textContent = province;
            fromSelect.appendChild(option1);
        }

        // For Booking "To"
        if (toSelect) {
            const option2 = document.createElement('option');
            option2.value = province;
            option2.textContent = province;
            toSelect.appendChild(option2);
        }

        // For Registration/Profile
        if (registerProvince) {
             const option3 = document.createElement('option');
            option3.value = province;
            option3.textContent = province;
            registerProvince.appendChild(option3);
        }
    });
}

function handleBooking(e) {
    e.preventDefault();
    
    if (!isLoggedIn) {
        alert("Please log in to book a flight.");
        showPage('login');
        return;
    }
    
    const from = document.getElementById('fromProvince').value;
    const to = document.getElementById('toProvince').value;
    const date = document.getElementById('flightDate').value;
    
    if (from === to) {
        alert("Departure and destination cannot be the same.");
        return;
    }
    
    // NOTE: This should be an async API call (e.g., POST to /bookings)
    // Keeping as localStorage mock for consistency with your existing code structure
    const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    bookings.push({
        from, 
        to, 
        date, 
        bookedAt: new Date().toLocaleString(),
        user: currentUser.email
    });
    localStorage.setItem('bookings', JSON.stringify(bookings));
    
    // Add alert (local mock)
    const alerts = JSON.parse(localStorage.getItem('flightAlerts')) || [];
    alerts.unshift({
        title: "Flight Booking Confirmed!",
        message: `Your flight from ${from} to ${to} on ${date} has been booked.`,
        time: new Date().toLocaleString()
    });
    localStorage.setItem('flightAlerts', JSON.stringify(alerts));
    
    document.getElementById('bookingMessage').textContent = `Flight booked from ${from} to ${to} on ${date}.`;
    document.getElementById('bookingForm').reset();
    
    loadDashboardData();
}

// --- PROFILE FUNCTIONS ---

function toggleProfileEdit() {
    const editBtn = document.getElementById('editBtn');
    const fields = ['surname', 'name', 'email', 'cellphone', 'province']; 
    
    if (editBtn.textContent === 'Edit Profile') {
        // Enable editing
        fields.forEach(field => {
            const el = document.getElementById(field);
            if (el) el.readOnly = false;
        });
        editBtn.textContent = 'Save Changes';
    } else {
        // Save changes (NOTE: Should be an API PUT call)
        if (currentUser) {
            currentUser.Surname = document.getElementById('surname').value;
            currentUser.Name = document.getElementById('name').value;
            currentUser.email = document.getElementById('email').value;
            currentUser.cellphone = document.getElementById('cellphone').value;
            currentUser.Province = document.getElementById('province').value; // <-- FIX: Updated
            
            // Local storage update (Mock)
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const userIndex = users.findIndex(u => u.email === currentUser.email);
            if (userIndex !== -1) {
                users[userIndex] = currentUser;
                localStorage.setItem('users', JSON.stringify(users));
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            }
            
            updateUIForLoggedInUser();
            alert("Profile updated successfully!");
        }
        
        // Disable editing
        fields.forEach(field => {
            const el = document.getElementById(field);
            if (el) el.readOnly = true;
        });
        editBtn.textContent = 'Edit Profile';
    }
}


// --- CALENDAR & REMINDERS ---

function generateCalendar() {
    // ... (Your generateCalendar logic remains the same) ...
    const monthYear = document.getElementById('monthYear');
    const calendarGrid = document.getElementById('calendarGrid');
    const now = new Date();
    
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    if(monthYear) monthYear.textContent = `${months[now.getMonth()]} ${now.getFullYear()}`;
    
    if(calendarGrid) {
        // Create header
        calendarGrid.innerHTML = `
            <div class="header">Sun</div>
            <div class="header">Mon</div>
            <div class="header">Tue</div>
            <div class="header">Wed</div>
            <div class="header">Thu</div>
            <div class="header">Fri</div>
            <div class="header">Sat</div>
        `;
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            calendarGrid.innerHTML += "<div></div>";
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const div = document.createElement("div");
            div.textContent = day;
            div.addEventListener("click", () => selectDate(day));
            calendarGrid.appendChild(div);
        }
    }
}

function selectDate(day) {
    document.querySelectorAll("#calendarGrid div").forEach(d => {
        if (!d.classList.contains('header')) {
            d.classList.remove("selected");
        }
    });
    
    const selected = [...document.getElementById('calendarGrid').children].find(el => el.textContent == day);
    if (selected) selected.classList.add("selected");
    
    const now = new Date();
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    const reminderDate = document.getElementById('reminderDate');
    if(reminderDate) reminderDate.value = `${day} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

function addReminder() {
    const date = document.getElementById('reminderDate').value;
    const text = document.getElementById('reminderText').value.trim();
    
    if (!date || !text) {
        alert("Please select a date and enter a reminder note.");
        return;
    }
    
    const reminderList = document.getElementById('reminderList');
    if(reminderList) {
        const li = document.createElement("li");
        li.textContent = `${date}: ${text}`;
        reminderList.appendChild(li);
    }
    document.getElementById('reminderText').value = "";
    alert(`Reminder set for ${date}`);
}


// --- SETTINGS AND THEME ---

function saveSettings() {
    localStorage.setItem('2fa', document.getElementById('2fa').checked);
    // NOTE: Saving password to local storage is INSECURE. This should only be for
    // demonstration purposes, or the field should be used to send a change request to the API.
    localStorage.setItem('password', document.getElementById('password').value);
    localStorage.setItem('theme', document.getElementById('theme').value);
    localStorage.setItem('timezone', document.getElementById('timezone').value);
    localStorage.setItem('debug', document.getElementById('debug').checked);
    localStorage.setItem('beta', document.getElementById('beta').checked);
    
    alert('Settings saved successfully!');
}

function loadUserData() {
    // Load saved settings
    const twoFa = document.getElementById('2fa');
    if(twoFa) twoFa.checked = localStorage.getItem('2fa') === 'true';

    const password = document.getElementById('password');
    if(password) password.value = localStorage.getItem('password') || '';

    const themeSelect = document.getElementById('theme');
    if(themeSelect) themeSelect.value = localStorage.getItem('theme') || 'dark';

    const timezone = document.getElementById('timezone');
    if(timezone) timezone.value = localStorage.getItem('timezone') || 'UTC+2';

    const debug = document.getElementById('debug');
    if(debug) debug.checked = localStorage.getItem('debug') === 'true';

    const beta = document.getElementById('beta');
    if(beta) beta.checked = localStorage.getItem('beta') === 'true';
    
    // Apply theme
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-theme');
        const toggleBtn = document.getElementById('themeToggle');
        if(toggleBtn) toggleBtn.textContent = '☀️';
    }
}

function toggleTheme() {
    const themeToggle = document.getElementById('themeToggle');
    
    if (document.body.classList.contains('light-theme')) {
        document.body.classList.remove('light-theme');
        themeToggle.textContent = '🌙';
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.add('light-theme');
        themeToggle.textContent = '☀️';
        localStorage.setItem('theme', 'light');
    }
}


// --- MISC FUNCTIONS ---

function handleContact(e) {
    e.preventDefault();
    alert('Thank you for contacting us! Our support team will get back to you shortly.');
    document.getElementById('contactForm').reset();
}

function addPetals(count) {
    for (let i = 0; i < count; i++) {
        const petal = document.createElement('div');
        petal.classList.add('petal');
        petal.style.left = Math.random() * 100 + "vw";
        petal.style.animationDuration = (5 + Math.random() * 10) + "s";
        petal.style.opacity = Math.random();
        document.body.appendChild(petal);
    }
}

function removePetals() {
    document.querySelectorAll('.petal').forEach(p => p.remove());
}