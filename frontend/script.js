// Signup form
const signupForm = document.getElementById("signup-form");
if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        alert("Signup function triggered!");
        
        const username = event.target.elements[0].value;
        const email = event.target.elements[1].value;
        const password = event.target.elements[2].value;

        try {
            const response = await fetch("http://localhost:5000/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await response.json();
            alert(data.message);
            window.location.href = "login.html";
        } catch (err) {
            alert("Signup failed. Please try again.");
        }
    });
}

// Login form
const loginForm = document.getElementById("login-form");
if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = event.target.elements[0].value;
        const password = event.target.elements[1].value;

        try {
            const response = await fetch("http://localhost:5000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (data.token) {
                localStorage.setItem("authToken", data.token);
                window.location.href = "dashboard.html";
            } else {
                alert("Invalid credentials!");
            }
        } catch (err) {
            alert("Login failed. Please try again.");
        }
    });
}

// User info (dashboard)
document.addEventListener("DOMContentLoaded", async () => {
    const usernameElem = document.getElementById("username");
    if (usernameElem) {
        const token = localStorage.getItem("authToken");
        if (!token) {
            window.location.href = "login.html";
            return;
        }
        try {
            const response = await fetch("http://localhost:5000/user", {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` },
            });
            const data = await response.json();
            usernameElem.innerText = data.username;
        } catch (err) {
            window.location.href = "login.html";
        }
    }
});

// Link form
const linkForm = document.getElementById("link-form");
if (linkForm) {
    linkForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const title = event.target.elements[0].value;
        const url = event.target.elements[1].value;
        const token = localStorage.getItem("authToken");

        try {
            await fetch("http://localhost:5000/add_link", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ title, url }),
            });
            loadLinks(); // Refresh the link list
        } catch (err) {
            alert("Failed to add link.");
        }
    });
}

// Load links (only if link-list exists)
async function loadLinks() {
    const list = document.getElementById("link-list");
    if (!list) return;

    const token = localStorage.getItem("authToken");
    try {
        const response = await fetch("http://localhost:5000/user_links", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
        });
        const data = await response.json();
        list.innerHTML = "";

        data.links.forEach((link) => {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between";
            li.innerHTML = `<a href="${link.url}" target="_blank">${link.title}</a>
                            <button class="btn btn-danger btn-sm">Delete</button>`;
            li.querySelector("button").addEventListener("click", () => deleteLink(link.id));
            list.appendChild(li);
        });
    } catch (err) {
        list.innerHTML = "<li class='text-danger'>Failed to load links.</li>";
    }
}

// Only call loadLinks if link-list exists
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("link-list")) {
        loadLinks();
    }
});

// Delete link
async function deleteLink(linkId) {
    const token = localStorage.getItem("authToken");
    try {
        await fetch(`http://localhost:5000/delete_link/${linkId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` },
        });
        loadLinks();
    } catch (err) {
        alert("Failed to delete link.");
    }
}

// Logout button
const logoutBtn = document.getElementById("logout");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("authToken");
        window.location.href = "login.html";
    });
}
