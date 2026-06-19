// ==========================================================================
// CENTRAL APPLICATION STATE & DATABASE CONTROLLER (DATABASE READY)
// ==========================================================================

// Jab aap backend server banaenge, toh is URL ko apne backend link se replace kar dena
// Example: const API_BASE_URL = "http://localhost:5000/api";
const API_BASE_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", () => {
    initDatabaseFallback(); // Sirf testing ke liye jab tak real DB pipeline active nahi hoti
    setupNavigationToggle();
    routeDispatcher();
});

// Mock Database Initialization (Fallback for Testing without active server)
function initDatabaseFallback() {
    if (!localStorage.getItem("ccgs_complaints")) {
        const sampleComplaints = [
            { id: "CP-8724", category: "Water Supply", subject: "Low water pressure in Sector 4", description: "Water line pressure dropped heavily since last week.", location: "Sector 4, Main Block", status: "Pending", user: "citizen@example.com", date: "2026-06-01" },
            { id: "CP-3109", category: "Electricity", subject: "Frequent Power Cuts", description: "Unscheduled power outages lasting over 4 hours daily.", location: "Greenwood Colony", status: "Resolved", user: "citizen@example.com", date: "2026-05-28" }
        ];
        localStorage.setItem("ccgs_complaints", JSON.stringify(sampleComplaints));
    }
    if (!localStorage.getItem("ccgs_users")) {
        localStorage.setItem("ccgs_users", JSON.stringify([
            { name: "John Doe", email: "citizen@example.com", mobile: "9876543210", address: "Agra, UP", password: "Password123" }
        ]));
    }
}

// Global UI Layout Engine
function setupNavigationToggle() {
    const toggleBtn = document.querySelector(".nav-toggle");
    const navLinks = document.querySelector(".nav-links");
    if (toggleBtn && navLinks) {
        toggleBtn.addEventListener("click", () => {
            navLinks.classList.toggle("show");
        });
    }
}

function getActiveUser() {
    return JSON.parse(sessionStorage.getItem("ccgs_active_session"));
}

function displayAlert(boxId, msg, variant) {
    const box = document.getElementById(boxId);
    if (box) {
        box.textContent = msg;
        box.className = `alert alert-${variant}`;
        box.style.display = "block";
    }
}

// Global Header Generator Helper (For Secure API Session Authorization)
function getHeaders() {
    const session = getActiveUser();
    const headers = { "Content-Type": "application/json" };
    if (session && session.token) {
        headers["Authorization"] = `Bearer ${session.token}`;
    }
    return headers;
}

// Check karega ki placeholder URL abhi tak changed hai ya nahi
function isUsingPlaceholderAPI() {
    return API_BASE_URL === "https://your-backend-api.com/api";
}

// ==========================================================================
// ROUTE INTERCEPTORS & CONTROLLERS
// ==========================================================================
function routeDispatcher() {
    const path = window.location.pathname.split("/").pop();

    if (path === "register.html") registerController();
    if (path === "login.html") loginController();
    if (path === "user-dashboard.html") userDashboardController();
    if (path === "admin-dashboard.html") adminDashboardController();
    if (path === "complaint-form.html") complaintFormController();
    if (path === "track-complaint.html") trackComplaintController();
    if (path === "complaint-history.html") complaintHistoryController();
    if (path === "contact.html") contactFormController();
    if (path === "analytics.html") analyticsController();
    if (path === "complaint-management.html") complaintManagementController();
    if (path === "user-management.html") userManagementController();
    if (path === "settings.html") settingsController();
    if (path === "forgot-password.html") forgotPasswordController();
}

// 1. Registration Handler (Database Driven)
function registerController() {
    const form = document.getElementById("registerForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("regName").value.trim();
        const email = document.getElementById("regEmail").value.trim();
        const mobile = document.getElementById("regMobile").value.trim();
        const address = document.getElementById("regAddress").value.trim();
        const pass = document.getElementById("regPass").value;
        const confirmPass = document.getElementById("regConfirmPass").value;

        if (pass.length < 6) {
            displayAlert("regAlert", "Password must be at least 6 characters long.", "danger");
            return;
        }
        if (pass !== confirmPass) {
            displayAlert("regAlert", "Passwords do not match.", "danger");
            return;
        }

        // --- REAL DATABASE OPERATION ---
        if (!isUsingPlaceholderAPI()) {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, mobile, address, password: pass })
                });
                const data = await response.json();
                if (response.ok) {
                    displayAlert("regAlert", "Registration complete! Redirecting...", "success");
                    setTimeout(() => window.location.href = "login.html", 1500);
                } else {
                    displayAlert("regAlert", data.message || "Registration failed.", "danger");
                }
            } catch (err) {
                displayAlert("regAlert", "Database connection offline.", "danger");
            }
            return;
        }

        // --- MOCK TESTING FALLBACK ---
        let users = JSON.parse(localStorage.getItem("ccgs_users")) || [];
        if (users.some(u => u.email === email)) {
            displayAlert("regAlert", "Email profile already exists.", "danger");
            return;
        }
        users.push({ name, email, mobile, address, password: pass });
        localStorage.setItem("ccgs_users", JSON.stringify(users));
        displayAlert("regAlert", "Registration complete! Redirecting to credentials gateway...", "success");
        setTimeout(() => window.location.href = "login.html", 1500);
    });
}

// 2. Authentication Handler (Database Driven with Admin Authorization Gate)
function loginController() {

    const form = document.getElementById("loginForm");
    const passInput = document.getElementById("loginPass");
    const togglePass = document.getElementById("togglePass");

    if (!form) return;

    // Show / Hide Password
    if (togglePass && passInput) {

        togglePass.addEventListener("click", () => {

            const targetType =
                passInput.type === "password"
                    ? "text"
                    : "password";

            passInput.type = targetType;

            togglePass.classList.toggle("fa-eye-slash");
        });
    }

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email =
            document.getElementById("loginEmail")
            .value.trim();

        const pass =
            document.getElementById("loginPass")
            .value;

        // Admin Shortcut Login
        if (
            email === "admin@ccgs.gov.in" &&
            pass === "admin2026"
        ) {

            sessionStorage.setItem(
                "ccgs_active_session",
                JSON.stringify({
                    name: "Central System Administrator",
                    email: email,
                    role: "admin"
                })
            );

            window.location.href =
                "admin-dashboard.html";

            return;
        }

        // REAL DATABASE LOGIN

        try {

            const response = await fetch(
                `${API_BASE_URL}/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                        "application/json"
                    },
                    body: JSON.stringify({
                        email: email,
                        password: pass
                    })
                }
            );

            const data =
                await response.json();

            if (response.ok) {

                sessionStorage.setItem(
                    "ccgs_active_session",
                    JSON.stringify({
                        id: data.user.id,
                        name: data.user.name,
                        email: data.user.email,
                        role: data.user.role
                    })
                );

                if (
                    data.user.role === "admin"
                ) {

                    window.location.href =
                        "admin-dashboard.html";

                } else {

                    window.location.href =
                        "user-dashboard.html";
                }

            } else {

                displayAlert(
                    "loginAlert",
                    data.message,
                    "danger"
                );
            }

        } catch (err) {

            console.error(err);

            displayAlert(
                "loginAlert",
                "Server Connection Failed",
                "danger"
            );
        }

    });
}

// 3. Citizen Workspace Controller (Database Driven)
async function userDashboardController() {
    const session = getActiveUser();
    if (!session || session.role !== "user") { window.location.href = "login.html"; return; }

    const userNameElement = document.getElementById("userName");
    if (userNameElement) userNameElement.textContent = session.name;

    // --- REAL DATABASE OPERATION ---
    if (!isUsingPlaceholderAPI()) {
        try {
            const response = await fetch(
    `${API_BASE_URL}/complaints/my-stats?user_id=${session.id}`,
    {
                method: "GET",
                headers: getHeaders()
            });
            if (response.ok) {
                const stats = await response.json();
                document.getElementById("totalCount").textContent = stats.total;
                document.getElementById("pendingCount").textContent = stats.pending;
                document.getElementById("resolvedCount").textContent = stats.resolved;
            }
        } catch (err) {
            console.error("Failed to load real DB metrics", err);
        }
        return;
    }

    // --- MOCK TESTING FALLBACK ---
    const complaints = (JSON.parse(localStorage.getItem("ccgs_complaints")) || []).filter(c => c.user === session.email);
    document.getElementById("totalCount").textContent = complaints.length;
    document.getElementById("pendingCount").textContent = complaints.filter(c => c.status === "Pending").length;
    document.getElementById("resolvedCount").textContent = complaints.filter(c => c.status === "Resolved").length;
}

// 4. Complaint Formulation Engine (Database Driven)
function complaintFormController() {

    const session = getActiveUser();

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    const form =
        document.getElementById("complaintForm");

    if (!form) return;

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const complaintData = {

            user_id: session.id,

            category:
                document.getElementById("category").value,

            subject:
                document.getElementById("subject").value.trim(),

            description:
                document.getElementById("description").value.trim(),

            location:
                document.getElementById("location").value.trim()
        };

        try {

            const response = await fetch(
                `${API_BASE_URL}/complaints`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                        "application/json"
                    },
                    body: JSON.stringify(
                        complaintData
                    )
                }
            );

            const data =
                await response.json();

            if (response.ok) {

                displayAlert(
                    "formAlert",
                    `Complaint Submitted Successfully. ID: ${data.complaint_id}`,
                    "success"
                );

                form.reset();

            } else {

                displayAlert(
                    "formAlert",
                    data.message,
                    "danger"
                );
            }

        } catch (err) {

            console.error(err);

            displayAlert(
                "formAlert",
                "Server Connection Failed",
                "danger"
            );
        }

    });
}
// 5. Public Verification Tracking System (Database Query Lookup)
function trackComplaintController() {
    const searchBtn = document.getElementById("searchBtn");
    if (!searchBtn) return;

    searchBtn.addEventListener("click", async () => {
        const idInput = document.getElementById("trackId").value.trim();
        const wrapper = document.getElementById("trackResult");
        if (!idInput) return;

        // --- REAL DATABASE OPERATION ---
        if (!isUsingPlaceholderAPI()) {
            try {
                const response = await fetch(`${API_BASE_URL}/complaints/track/${idInput}`);
                if (response.ok) {
                    const match = await response.json();
                    renderTrackView(match, wrapper);
                } else {
                    alert("No matching record identified inside system framework.");
                    wrapper.style.display = "none";
                }
            } catch (err) {
                console.error("Database querying error", err);
            }
            return;
        }

        // --- MOCK TESTING FALLBACK ---
        const complaints = JSON.parse(localStorage.getItem("ccgs_complaints")) || [];
        const match = complaints.find(c => c.id.toLowerCase() === idInput.toLowerCase());

        if (match) {
            renderTrackView(match, wrapper);
        } else {
            alert("No matching record identified inside local framework.");
            wrapper.style.display = "none";
        }
    });
}

function renderTrackView(match, wrapper) {

    document.getElementById("resId")
        .textContent =
        match.complaint_id;

    document.getElementById("resCategory")
        .textContent =
        match.category;

    document.getElementById("resSubject")
        .textContent =
        match.subject;

    document.getElementById("resStatus")
        .textContent =
        match.status;

    document.getElementById("resDate")
        .textContent =
        match.created_at;

    wrapper.style.display =
        "block";
}

// 6. Data Stream Rendering & Filter Engine (Database Driven)
function complaintHistoryController() {
    const session = getActiveUser();
    if (!session) { window.location.href = "login.html"; return; }

    const tableBody = document.getElementById("historyTableBody");
    const searchInput = document.getElementById("searchQuery");
    const filterStatus = document.getElementById("filterStatus");
    let recordsContainer = [];

    async function fetchHistoryStream() {
        // --- REAL DATABASE OPERATION ---
        if (!isUsingPlaceholderAPI()) {
            try {
                const response = await fetch(
    `${API_BASE_URL}/complaints/user/${session.id}`,
    {
                    method: "GET",
                    headers: getHeaders()
                });
                if (response.ok) {
                    recordsContainer = await response.json();
                    renderTable(recordsContainer);
                }
            } catch (err) {
                console.error("Database history extraction failed.", err);
            }
            return;
        }

        // --- MOCK TESTING FALLBACK ---
        const allComplaints = JSON.parse(localStorage.getItem("ccgs_complaints")) || [];
        recordsContainer = session.role === "admin" ? allComplaints : allComplaints.filter(c => c.user === session.email);
        renderTable(recordsContainer);
    }

    function renderTable(dataArray) {
        if (!tableBody) return;
        tableBody.innerHTML = dataArray.map(c => `
            <tr>
                <td><strong>${c.complaint_id}</strong></td>
                <td>${c.category}</td>
                <td>${c.subject}</td>
                <td>${c.created_at}</td>
                <td><span class="status-badge ${c.status.toLowerCase()}">${c.status}</span></td>
            </tr>
        `).join('');
        if(dataArray.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No records matched parameters.</td></tr>`;
        }
    }

    function applyFilters() {
        let filtered = recordsContainer;
        const query = searchInput.value.toLowerCase();
        const status = filterStatus.value;

        if (query) {
            filtered = filtered.filter(c => c.complaint_id.toLowerCase().includes(query) || c.subject.toLowerCase().includes(query));
        }
        if (status !== "All") {
            filtered = filtered.filter(c => c.status === status);
        }
        renderTable(filtered);
    }

    if (searchInput && filterStatus) {
        searchInput.addEventListener("input", applyFilters);
        filterStatus.addEventListener("change", applyFilters);
    }

    fetchHistoryStream();
}

// 7. Administrative Operational Space (Database Syncing & Status Modifiers)
function adminDashboardController() {

    const session = getActiveUser();

    if (!session || session.role !== "admin") {
        window.location.href = "login.html";
        return;
    }

    async function syncMetrics() {

        try {

            // Dashboard Summary
            const summaryResponse =
                await fetch(
                    `${API_BASE_URL}/admin/dashboard-summary`
                );

            const summaryData =
                await summaryResponse.json();

            document.getElementById("admTotal").textContent =
                summaryData.totalComplaints;

            document.getElementById("admPending").textContent =
                summaryData.pendingComplaints;

            document.getElementById("admResolved").textContent =
                summaryData.resolvedComplaints;

            document.getElementById("admUsersCount").textContent =
                summaryData.totalUsers;

            // Complaint List
            const complaintsResponse =
                await fetch(
                    `${API_BASE_URL}/admin/complaints`
                );

            const complaints =
                await complaintsResponse.json();

            renderAdminRecords(complaints);

        }
        catch (err) {

            console.error(
                "Dashboard Loading Error:",
                err
            );

        }
    }

    function renderAdminRecords(complaintsList) {

        const tbody =
            document.getElementById("adminTableBody");

        if (!tbody) return;

        if (complaintsList.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center;">
                        No Complaints Found
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML = complaintsList.map(c => `

            <tr>

                <td>
                    <strong>${c.complaint_id}</strong>
                </td>

                <td>
                    ${c.email}
                </td>

                <td>
                    ${c.category}
                </td>

                <td>
                    ${c.subject}
                </td>

                <td>

                    <select
                        class="status-select"
                        data-id="${c.id}">

                        <option value="Pending"
                            ${c.status === "Pending" ? "selected" : ""}>
                            Pending
                        </option>

                        <option value="In Progress"
                            ${c.status === "In Progress" ? "selected" : ""}>
                            In Progress
                        </option>

                        <option value="Resolved"
                            ${c.status === "Resolved" ? "selected" : ""}>
                            Resolved
                        </option>

                        <option value="Rejected"
                            ${c.status === "Rejected" ? "selected" : ""}>
                            Rejected
                        </option>

                    </select>

                </td>

            </tr>

        `).join("");

        attachStatusEvents();
    }

    function attachStatusEvents() {

        document
            .querySelectorAll(".status-select")
            .forEach(select => {

                select.addEventListener(
                    "change",
                    async function () {

                        const complaintId =
                            this.dataset.id;

                        const newStatus =
                            this.value;

                        try {

                            const response =
                                await fetch(
                                    `${API_BASE_URL}/admin/complaints/${complaintId}`,
                                    {
                                        method: "PUT",
                                        headers: {
                                            "Content-Type":
                                                "application/json"
                                        },
                                        body: JSON.stringify({
                                            status: newStatus
                                        })
                                    }
                                );

                            const data =
                                await response.json();

                            if (response.ok) {

                                alert(
                                    "Status Updated Successfully"
                                );

                                syncMetrics();

                            } else {

                                alert(
                                    data.message ||
                                    "Update Failed"
                                );

                            }

                        }
                        catch (err) {

                            console.error(err);

                            alert(
                                "Server Connection Error"
                            );

                        }

                    }
                );

            });

    }

    syncMetrics();
}
// 8. Contact Form Submissions Handling
function contactFormController() {
    const form = document.getElementById("contactForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        displayAlert("contactAlert", "Communication packet transmitted successfully. Our cell team will reach out shortly.", "success");
        form.reset();
    });
}

// Global Log-out Engine Interface Hook
function logout() {
    sessionStorage.removeItem("ccgs_active_session");
    window.location.href = "login.html";
}


//ANALYTICS
function analyticsController() {

    const session = getActiveUser();

    if (!session || session.role !== "admin") {
        window.location.href = "login.html";
        return;
    }

    loadAnalytics();

    async function loadAnalytics() {

        try {

            const response = await fetch(
                `${API_BASE_URL}/admin/analytics`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );

            const data = await response.json();

            document.getElementById("anaTotal").textContent =
                data.total || 0;

            document.getElementById("anaPending").textContent =
                data.pending || 0;

            document.getElementById("anaResolved").textContent =
                data.resolved || 0;

            document.getElementById("anaUsers").textContent =
                data.totalUsers || 0;

            // Resolution Rate

            const rate =
                data.total > 0
                    ? Math.round(
                        (data.resolved / data.total) * 100
                    )
                    : 0;

            document.getElementById(
                "resolutionRate"
            ).textContent = rate + "%";

            // Department Table

            const deptBody =
                document.getElementById(
                    "departmentTableBody"
                );

            deptBody.innerHTML =
                data.departmentStats.map(dept => `
                    <tr>
                        <td>${dept.category}</td>
                        <td>${dept.count}</td>
                    </tr>
                `).join("");

        } catch (error) {

            console.error(
                "Analytics Loading Failed",
                error
            );

        }

    }

}

//USER MANAGEMENT
/*user management*/

function userManagementController() {

    const session = getActiveUser();

    if (!session || session.role !== "admin") {
        window.location.href = "login.html";
        return;
    }

    const tableBody =
        document.getElementById("userTableBody");

    const totalUsers =
        document.getElementById("totalUsers");

    const verifiedUsers =
        document.getElementById("verifiedUsers");

    const pendingUsers =
        document.getElementById("pendingUsers");

    const searchBox =
        document.getElementById("userSearch");

    let users = [];

    async function loadUsers() {

        try {

            const response = await fetch(
                `${API_BASE_URL}/admin/users`
            );

            users = await response.json();

            if (totalUsers)
                totalUsers.textContent = users.length;

            if (verifiedUsers)
                verifiedUsers.textContent = users.length;

            if (pendingUsers)
                pendingUsers.textContent = 0;

            renderUsers(users);

        } catch (err) {

            console.error(err);

            tableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        Failed To Load Users
                    </td>
                </tr>
            `;
        }
    }

    function renderUsers(data) {

        if (!tableBody) return;

        if (data.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="6"
                    style="text-align:center;">
                        No Users Found
                    </td>
                </tr>
            `;

            return;
        }

        tableBody.innerHTML = data.map(user => `

            <tr>

                <td>${user.id}</td>

                <td>${user.name}</td>

                <td>${user.email}</td>

                <td>${user.mobile || "-"}</td>

                <td>
                    <span class="status-badge resolved">
                        Active
                    </span>
                </td>

                <td>

                    <button
                        class="btn btn-primary viewUser"
                        data-id="${user.id}">
                        View
                    </button>

                </td>

            </tr>

        `).join("");

        attachEvents();
    }

    function attachEvents() {

        document
        .querySelectorAll(".viewUser")
        .forEach(btn => {

            btn.addEventListener("click", function() {

                const userId =
                    this.dataset.id;

                const selectedUser =
                    users.find(
                        u => u.id == userId
                    );

                if (!selectedUser) return;

                alert(
`Name: ${selectedUser.name}

Email: ${selectedUser.email}

Mobile: ${selectedUser.mobile || "-"}

Address: ${selectedUser.address || "-"}

Role: ${selectedUser.role}`
                );

            });

        });

    }

    if (searchBox) {

        searchBox.addEventListener("input", function() {

            const value =
                this.value.toLowerCase();

            const filtered =
                users.filter(user =>

                    user.name.toLowerCase().includes(value)
                    ||
                    user.email.toLowerCase().includes(value)

                );

            renderUsers(filtered);

        });

    }

    loadUsers();

}




//COMPLAINT MANAGEMENT 
// COMPLAINT MANAGEMENT
function complaintManagementController() {

    const session = getActiveUser();

    if (!session || session.role !== "admin") {
        window.location.href = "login.html";
        return;
    }

    const tableBody =
        document.getElementById("adminComplaintTable");

    const searchBox =
        document.getElementById("complaintSearch");

    const statusFilter =
        document.getElementById("statusFilter");

    let complaints = [];

    loadComplaints();

    async function loadComplaints() {

        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/admin/complaints`
                );

            complaints =
                await response.json();

            renderComplaints(complaints);

        } catch (err) {

            console.error(err);

            alert(
                "Failed to load complaints"
            );
        }
    }

    function renderComplaints(data) {

        if (!tableBody) return;

        if (data.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        No Complaints Found
                    </td>
                </tr>
            `;

            return;
        }

        tableBody.innerHTML =
            data.map(c => `

            <tr>

                <td>${c.complaint_id}</td>

                <td>${c.email}</td>

                <td>${c.category}</td>

                <td>${c.subject}</td>

                <td>

                    <select
                        class="complaintStatus"
                        data-id="${c.id}">

                        <option value="Pending"
                        ${c.status === "Pending" ? "selected" : ""}>
                        Pending
                        </option>

                        <option value="In Progress"
                        ${c.status === "In Progress" ? "selected" : ""}>
                        In Progress
                        </option>

                        <option value="Resolved"
                        ${c.status === "Resolved" ? "selected" : ""}>
                        Resolved
                        </option>

                        <option value="Rejected"
                        ${c.status === "Rejected" ? "selected" : ""}>
                        Rejected
                        </option>

                    </select>

                </td>

                <td>

                    <a href="complaint-details.html?id=${c.id}"
                        class="btn btn-primary">

                            View </a>

                </td>

            </tr>

        `).join("");

        attachEvents();
    }

    function attachEvents() {

        document
        .querySelectorAll(".complaintStatus")
        .forEach(select => {

            select.addEventListener(
                "change",
                async function() {

                    const complaintId =
                        this.dataset.id;

                    const newStatus =
                        this.value;

                    try {

                        const response =
                            await fetch(
                                `${API_BASE_URL}/admin/complaints/${complaintId}`,
                                {
                                    method: "PUT",
                                    headers: {
                                        "Content-Type":
                                        "application/json"
                                    },
                                    body: JSON.stringify({
                                        status: newStatus
                                    })
                                }
                            );

                        const data =
                            await response.json();

                        alert(data.message);

                    } catch (err) {

                        console.error(err);

                        alert(
                            "Failed to update status"
                        );
                    }

                }
            );

        });

        document
        .querySelectorAll(".viewComplaint")
        .forEach(btn => {

            btn.addEventListener(
                "click",
                function() {

                    const complaintId =
                        this.dataset.id;

                    const complaint =
                        complaints.find(
                            c => c.id == complaintId
                        );

                    if (!complaint) return;

                    alert(

`Complaint ID: ${complaint.complaint_id}

Citizen: ${complaint.name}

Email: ${complaint.email}

Department: ${complaint.category}

Subject: ${complaint.subject}

Description: ${complaint.description}

Location: ${complaint.location}

Status: ${complaint.status}

Date: ${complaint.created_at}`

                    );

                }
            );

        });

    }

    function applyFilters() {

        let filtered = complaints;

        const search =
            searchBox.value.toLowerCase();

        const status =
            statusFilter.value;

        if (search) {

            filtered =
                filtered.filter(c =>

                    c.complaint_id
                    .toLowerCase()
                    .includes(search)

                    ||

                    c.subject
                    .toLowerCase()
                    .includes(search)
                );
        }

        if (status !== "All") {

            filtered =
                filtered.filter(
                    c => c.status === status
                );
        }

        renderComplaints(filtered);
    }

    if (searchBox) {
        searchBox.addEventListener(
            "input",
            applyFilters
        );
    }

    if (statusFilter) {
        statusFilter.addEventListener(
            "change",
            applyFilters
        );
    }
}
// SETTINGS PAGE

function settingsController() {

    const session = getActiveUser();

    if (!session || session.role !== "admin") {

        window.location.href = "login.html";
        return;
    }

    const form = document.getElementById("settingsForm");

    if (!form) return;

    // Load previously saved settings

    const savedSettings =
        JSON.parse(localStorage.getItem("portal_settings"));

    if (savedSettings) {

        Object.keys(savedSettings).forEach(key => {

            const field =
                document.getElementById(key);

            if (field) {
                field.value = savedSettings[key];
            }

        });

    }

    form.addEventListener("submit", function(e) {

        e.preventDefault();

        const settings = {

            portalName:
                document.getElementById("portalName").value,

            portalDescription:
                document.getElementById("portalDescription").value,

            portalEmail:
                document.getElementById("portalEmail").value,

            supportNumber:
                document.getElementById("supportNumber").value,

            officeAddress:
                document.getElementById("officeAddress").value,

            resolutionDays:
                document.getElementById("resolutionDays").value,

            allowEvidence:
                document.getElementById("allowEvidence").value,

            allowRegistration:
                document.getElementById("allowRegistration").value,

            emailVerification:
                document.getElementById("emailVerification").value,

            emailNotifications:
                document.getElementById("emailNotifications").value,

            smsNotifications:
                document.getElementById("smsNotifications").value,

            sessionTimeout:
                document.getElementById("sessionTimeout").value,

            auditLogs:
                document.getElementById("auditLogs").value

        };

        localStorage.setItem(
            "portal_settings",
            JSON.stringify(settings)
        );

        alert("Settings Saved Successfully");

    });

}

//FORGET PASSWORD
function forgotPasswordController() {

    const form =
        document.getElementById("forgotPasswordForm");

    if (!form) return;

    form.addEventListener("submit", function(e) {

        e.preventDefault();

        const email =
            document.getElementById("resetEmail").value;

        const newPass =
            document.getElementById("newPassword").value;

        const confirmPass =
            document.getElementById("confirmPassword").value;

        if(newPass !== confirmPass){

            alert("Passwords do not match");
            return;

        }

        let users =
            JSON.parse(localStorage.getItem("ccgs_users")) || [];

        const user =
            users.find(u => u.email === email);

        if(!user){

            alert("Email not registered");
            return;

        }

        user.password = newPass;

        localStorage.setItem(
            "ccgs_users",
            JSON.stringify(users)
        );

        alert("Password Updated Successfully");

        window.location.href = "login.html";

    });

}

//COMPLAINT-DETAILS//

function complaintDetailsController() {

    const session = getActiveUser();

    if (!session || session.role !== "admin") {
        window.location.href = "login.html";
        return;
    }

    const params =
        new URLSearchParams(window.location.search);

    const complaintId =
        params.get("id");

    if (!complaintId) return;

    loadComplaint();

    async function loadComplaint() {

        try {

            const response = await fetch(
                `${API_BASE_URL}/admin/complaints/${complaintId}`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );

            const complaint =
                await response.json();

            document.getElementById(
                "detailComplaintId"
            ).textContent =
                complaint.complaint_id;

            document.getElementById(
                "detailName"
            ).textContent =
                complaint.name;

            document.getElementById(
                "detailEmail"
            ).textContent =
                complaint.email;

            document.getElementById(
                "detailCategory"
            ).textContent =
                complaint.category;

            document.getElementById(
                "detailSubject"
            ).textContent =
                complaint.subject;

            document.getElementById(
                "detailDescription"
            ).textContent =
                complaint.description;

            document.getElementById(
                "detailLocation"
            ).textContent =
                complaint.location;

            document.getElementById(
                "detailStatus"
            ).textContent =
                complaint.status;

            document.getElementById(
                "detailDate"
            ).textContent =
                complaint.created_at;

        }

        catch (error) {

            console.error(
                "Failed to Load Complaint",
                error
            );

        }

    }

}