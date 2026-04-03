// ==========================================
// SUPABASE CONFIGURATION
// ==========================================
const SUPABASE_URL = 'https://wqngzhpqxbwsvukzgsto.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_jLAL4F3UXGsRFjStUmBPqQ_PeN_A0By';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// AUTHENTICATION LOGIC
// ==========================================

async function signUpWithEmail() {
    const emailEl = document.getElementById("regEmail");
    if (!emailEl || !emailEl.value.trim()) {
        alert("Please enter an email address first!");
        return;
    }
    window.tempUserEmail = emailEl.value.trim();
    document.getElementById("loginModal").style.display = "none";
    document.getElementById("regModal").style.display = "flex";
}

async function saveNewUser() {
    const email = window.tempUserEmail;
    const fullName = document.getElementById("regFullName").value.trim(); 
    const phone = document.getElementById("regPhone").value.trim();
    const username = document.getElementById("regUsername").value.trim();
    const password = document.getElementById("regPassword").value.trim();
    const errorEl = document.getElementById("regError");

    if (!fullName || !phone || !username || !password) {
        if(errorEl) errorEl.innerText = "All fields are required!";
        return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        if(errorEl) errorEl.innerText = error.message;
        return;
    }

    const mId = "ACM-W-" + Math.floor(1000 + Math.random() * 9000);
    
    const { error: dbError } = await supabaseClient.from('users').insert([{
        id: data.user.id,
        username: username,
        name: fullName, 
        phone: phone,
        password: password, 
        membership_id: mId,
        email: email
    }]);

    if (!dbError) {
        localStorage.setItem("loggedUsername", username);
        alert(`Success! Welcome ${fullName}`);
        window.location.href = "home.html";
    } else {
        if(errorEl) errorEl.innerText = "Database Error: " + dbError.message;
    }
}

async function login() {
    const user = document.getElementById("userid").value.trim();
    const pass = document.getElementById("password").value.trim();
    const errorEl = document.getElementById("error");

    const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('username', user)
        .eq('password', pass)
        .single();

    if (data) {
        localStorage.setItem("loggedUsername", user);
        window.location.href = "home.html";
    } else {
        if(errorEl) errorEl.innerText = "Invalid Username or Password";
    }
}

function logout() {
    localStorage.removeItem("loggedUsername");
    window.location.href = "index.html";
}

// Security Check: Redirect to login if not authenticated
function checkLogin() {
    const user = localStorage.getItem("loggedUsername");
    if (!user && !window.location.pathname.includes("index.html")) {
        window.location.href = "index.html";
    }
}

// ==========================================
// DATA FETCHING & UI UPDATES
// ==========================================

async function loadMemberInfo() {
    const userLabel = localStorage.getItem("loggedUsername");
    if (!userLabel) return;

    const { data: profile } = await supabaseClient
        .from('users')
        .select('*')
        .eq('username', userLabel)
        .single();

    if (profile) {
        // Welcome Header
        const welcomeHeader = document.getElementById("showName");
        if (welcomeHeader) {
            welcomeHeader.innerText = profile.name;
        }

        // Dashboard Stats
        if (document.getElementById("showUserId")) {
            document.getElementById("showUserId").innerText = profile.username;
        }
        if (document.getElementById("showMembershipId")) {
            document.getElementById("showMembershipId").innerText = profile.membership_id;
        }
    }
}

async function loadMemberCardData() {
    const userLabel = localStorage.getItem("loggedUsername");
    if (!userLabel) return;

    const { data: profile } = await supabaseClient
        .from('users')
        .select('*')
        .eq('username', userLabel)
        .single();

    if (profile) {
        const mName = profile.name || "ACM Member";
        const mId = profile.membership_id || "ACM-W-000";

        const elements = ["cardName", "cardMemberId", "cardNameBack", "cardMemberIdBack"];
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = (id.includes("Name")) ? mName : mId;
        });
    }
}

// Global Load Listener
window.addEventListener('load', () => {
    checkLogin();
    const path = window.location.pathname;
    if (path.includes("home.html")) {
        loadMemberInfo();
    }
    if (path.includes("membership-card.html")) {
        loadMemberCardData();
    }
});

// ==========================================
// EXPORT CARD AS PDF
// ==========================================
async function downloadCardPDF() {
    const { jsPDF } = window.jspdf;
    const downloadBtn = document.querySelector(".download-btn");
    const cardSheet = document.getElementById("cardSheet");

    if(!cardSheet) return;
    downloadBtn.innerText = "⏳ Preparing PDF...";
    downloadBtn.disabled = true;

    try {
        const canvas = await html2canvas(cardSheet, { 
            scale: 3, 
            useCORS: true,
            logging: false 
        });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const xPos = (pdf.internal.pageSize.getWidth() - imgWidth) / 2;

        pdf.addImage(imgData, "PNG", xPos, 20, imgWidth, imgHeight);
        pdf.save("ACM_Membership_Card.pdf");
        downloadBtn.innerText = "✅ Downloaded!";
    } catch (err) {
        console.error(err);
        alert("Download failed.");
        downloadBtn.innerText = "❌ Error";
    }

    setTimeout(() => {
        downloadBtn.innerText = "📥 Download Membership Card";
        downloadBtn.disabled = false;
    }, 3000);
}