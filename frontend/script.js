// Utility functions for loading states
function setLoading(element, isLoading) {
    if (isLoading) {
        element.classList.add('loading');
        if (element.tagName === 'BUTTON') {
            element.classList.add('btn-loading');
            element.disabled = true;
        }
    } else {
        element.classList.remove('loading');
        if (element.tagName === 'BUTTON') {
            element.classList.remove('btn-loading');
            element.disabled = false;
        }
    }
}

// Utility functions for notifications
function showNotification(message, type = 'error') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);

    // Remove the notification after 5 seconds
    setTimeout(() => {
        alertDiv.classList.add('hide');
        setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
}

// Utility function for API calls
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem("authToken");
    const defaultHeaders = {
        "Content-Type": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` })
    };

    try {
        const response = await fetch(`http://localhost:5000${endpoint}`, {
            ...options,
            headers: { ...defaultHeaders, ...options.headers }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || "Something went wrong");
        }
        
        return data;
    } catch (error) {
        showNotification(error.message);
        throw error;
    }
}

// Validation utility functions
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return re.test(password);
}

function validateURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

function validateField(field, value) {
    const feedback = field.nextElementSibling;
    let isValid = true;
    let message = '';

    switch (field.name) {
        case 'username':
            if (value.length < 3) {
                isValid = false;
                message = 'Username must be at least 3 characters long';
            }
            break;
        case 'email':
            if (!validateEmail(value)) {
                isValid = false;
                message = 'Please enter a valid email address';
            }
            break;
        case 'password':
            if (!validatePassword(value)) {
                isValid = false;
                message = 'Password must be at least 8 characters long and contain uppercase, lowercase, and numbers';
            }
            break;
        case 'title':
            if (value.length < 1) {
                isValid = false;
                message = 'Title is required';
            }
            break;
        case 'url':
            if (!validateURL(value)) {
                isValid = false;
                message = 'Please enter a valid URL';
            }
            break;
    }

    field.classList.toggle('is-invalid', !isValid);
    field.classList.toggle('is-valid', isValid);
    if (feedback && feedback.classList.contains('invalid-feedback')) {
        feedback.textContent = message;
    }

    return isValid;
}

// Add validation to all forms
document.addEventListener('DOMContentLoaded', () => {
    // Add validation feedback elements to all form inputs
    document.querySelectorAll('form input').forEach(input => {
        if (!input.nextElementSibling?.classList.contains('invalid-feedback')) {
            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            input.parentNode.insertBefore(feedback, input.nextSibling);
        }
    });

    // Add input event listeners for real-time validation
    document.querySelectorAll('form input').forEach(input => {
        input.addEventListener('input', (e) => {
            validateField(e.target, e.target.value);
        });
    });
});

// Signup form
const signupForm = document.getElementById("signup-form");
if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        
        // Validate all fields
        const username = event.target.elements[0];
        const email = event.target.elements[1];
        const password = event.target.elements[2];
        
        const isUsernameValid = validateField(username, username.value);
        const isEmailValid = validateField(email, email.value);
        const isPasswordValid = validateField(password, password.value);
        
        if (!isUsernameValid || !isEmailValid || !isPasswordValid) {
            showNotification('Please fix the validation errors', 'error');
            return;
        }

        const submitButton = event.target.querySelector('button[type="submit"]');
        setLoading(submitButton, true);
        
        try {
            const data = await apiCall('/signup', {
                method: "POST",
                body: JSON.stringify({ 
                    username: username.value, 
                    email: email.value, 
                    password: password.value 
                })
            });
            
            showNotification(data.message, 'success');
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1000);
        } catch (err) {
            // Error is already handled by apiCall
        } finally {
            setLoading(submitButton, false);
        }
    });
}

// Login form
const loginForm = document.getElementById("login-form");
if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        
        // Validate all fields
        const email = event.target.elements[0];
        const password = event.target.elements[1];
        
        const isEmailValid = validateField(email, email.value);
        const isPasswordValid = validateField(password, password.value);
        
        if (!isEmailValid || !isPasswordValid) {
            showNotification('Please fix the validation errors', 'error');
            return;
        }

        const submitButton = event.target.querySelector('button[type="submit"]');
        setLoading(submitButton, true);

        try {
            const data = await apiCall('/login', {
                method: "POST",
                body: JSON.stringify({ 
                    email: email.value, 
                    password: password.value 
                })
            });
            
            localStorage.setItem("authToken", data.token);
            showNotification("Login successful!", 'success');
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1000);
        } catch (err) {
            // Error is already handled by apiCall
        } finally {
            setLoading(submitButton, false);
        }
    });
}

// User info (dashboard)
document.addEventListener("DOMContentLoaded", async () => {
    const usernameElem = document.getElementById("username");
    if (usernameElem) {
        const token = localStorage.getItem("authToken");
        if (!token) {
            showNotification("Please login to access this page", 'warning');
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1000);
            return;
        }
        setLoading(usernameElem, true);
        try {
            const data = await apiCall('/user', {
                method: "GET"
            });
            usernameElem.innerText = data.username;
        } catch (err) {
            // Error is already handled by apiCall
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1000);
        } finally {
            setLoading(usernameElem, false);
        }
    }
});

// Link form
const linkForm = document.getElementById("link-form");
if (linkForm) {
    linkForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        
        // Validate all fields
        const title = event.target.elements[0];
        const url = event.target.elements[1];
        
        const isTitleValid = validateField(title, title.value);
        const isUrlValid = validateField(url, url.value);
        
        if (!isTitleValid || !isUrlValid) {
            showNotification('Please fix the validation errors', 'error');
            return;
        }

        const submitButton = event.target.querySelector('button[type="submit"]');
        setLoading(submitButton, true);

        try {
            await apiCall('/add_link', {
                method: "POST",
                body: JSON.stringify({ 
                    title: title.value, 
                    url: url.value 
                })
            });
            
            showNotification("Link added successfully!", 'success');
            event.target.reset();
            // Reset validation states
            title.classList.remove('is-valid');
            url.classList.remove('is-valid');
            loadLinks();
        } catch (err) {
            // Error is already handled by apiCall
        } finally {
            setLoading(submitButton, false);
        }
    });
}

// Load links (only if link-list exists)
async function loadLinks() {
    const list = document.getElementById("link-list");
    if (!list) return;

    setLoading(list, true);
    try {
        const data = await apiCall('/user_links', {
            method: "GET"
        });
        
        list.innerHTML = "";
        if (data.links.length === 0) {
            list.innerHTML = "<li class='text-muted'>No links added yet. Add your first link above!</li>";
            return;
        }

        data.links.forEach((link) => {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center";
            li.innerHTML = `
                <a href="${link.url}" target="_blank" class="text-decoration-none">${link.title}</a>
                <button class="btn btn-danger btn-sm delete-link" data-link-id="${link.id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `;
            list.appendChild(li);
        });

        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-link').forEach(button => {
            button.addEventListener('click', (e) => {
                const linkId = e.target.closest('.delete-link').dataset.linkId;
                deleteLink(linkId);
            });
        });
    } catch (err) {
        // Error is already handled by apiCall
        list.innerHTML = "<li class='text-danger'>Failed to load links.</li>";
    } finally {
        setLoading(list, false);
    }
}

// Delete link
async function deleteLink(linkId) {
    const button = event.target.closest('.delete-link');
    setLoading(button, true);
    
    try {
        await apiCall(`/delete_link/${linkId}`, {
            method: "DELETE"
        });
        
        showNotification("Link deleted successfully!", 'success');
        loadLinks();
    } catch (err) {
        // Error is already handled by apiCall
    } finally {
        setLoading(button, false);
    }
}

// Logout button
const logoutBtn = document.getElementById("logout");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("authToken");
        showNotification("Logged out successfully!", 'success');
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1000);
    });
}

// Only call loadLinks if link-list exists
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("link-list")) {
        loadLinks();
    }
});
