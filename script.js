/* --- LOCAL STORAGE MANAGEMENT --- */
if (!localStorage.getItem('studentData')) {
    // Initial dummy data
    const initialData = {
        '2023-0001': { name: 'Sample Student', course: 'BSIT', status: 'Active', photo: null }
    };
    localStorage.setItem('studentData', JSON.stringify(initialData));
}

function getStudents() {
    return JSON.parse(localStorage.getItem('studentData'));
}

/* --- TAB SWITCHING --- */
function switchTab(tabName) {
    document.getElementById('registerSection').style.display = tabName === 'register' ? 'block' : 'none';
    document.getElementById('verifySection').style.display = tabName === 'verify' ? 'block' : 'none';
    
    const buttons = document.querySelectorAll('.tab-btn');
    buttons[0].classList.toggle('active', tabName === 'register');
    buttons[1].classList.toggle('active', tabName === 'verify');

    if (tabName === 'register' && html5QrcodeScanner) {
        stopScanner();
    }
}

/* --- REGISTRATION LOGIC --- */
function registerStudent() {
    const id = document.getElementById('regId').value.trim().toUpperCase();
    const name = document.getElementById('regName').value.trim();
    const course = document.getElementById('regCourse').value.trim();
    const photoInput = document.getElementById('regPhoto');

    if (!id || !name || !course) {
        alert("Please fill in ID, Name, and Course.");
        return;
    }

    const students = getStudents();
    if (students[id]) {
        alert("Student ID already exists!");
        return;
    }

    // Function to save student after handling photo
    const saveToStorage = (photoBase64) => {
        students[id] = {
            name: name,
            course: course,
            status: 'Active',
            dateRegistered: new Date().toLocaleDateString(),
            photo: photoBase64 // Save the image string
        };
        localStorage.setItem('studentData', JSON.stringify(students));
        generateQRCode(id);
    };

    // Check if user uploaded a photo
    if (photoInput.files && photoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            saveToStorage(e.target.result); // Save with photo
        };
        reader.readAsDataURL(photoInput.files[0]);
    } else {
        saveToStorage(null); // Save without photo
    }
}

function generateQRCode(text) {
    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = "";
    new QRCode(qrContainer, { text: text, width: 128, height: 128 });
    document.getElementById('qrText').innerText = text;
    document.getElementById('qrDisplay').style.display = 'block';
}

function clearForm() {
    document.getElementById('regId').value = '';
    document.getElementById('regName').value = '';
    document.getElementById('regCourse').value = '';
    document.getElementById('regPhoto').value = ''; // Clear file input
    document.getElementById('qrDisplay').style.display = 'none';
}

/* --- VERIFICATION LOGIC --- */
function verifyStudent() {
    const input = document.getElementById('verifyInput');
    const id = input.value.trim().toUpperCase();
    const resultArea = document.getElementById('resultArea');
    const loader = document.getElementById('loader');

    resultArea.style.display = 'none';
    loader.style.display = 'block';

    setTimeout(() => {
        loader.style.display = 'none';
        const students = getStudents();
        const student = students[id];

        if (student) {
            showSuccess(student, id);
        } else {
            showError();
        }
    }, 500);
}

function showSuccess(student, id) {
    const resultArea = document.getElementById('resultArea');
    
    // Check if student has a photo, otherwise use a default placeholder icon
    const photoHtml = student.photo 
        ? `<img src="${student.photo}" class="profile-pic-display" alt="Student Photo">` 
        : `<div class="profile-pic-display" style="display:flex;align-items:center;justify-content:center;font-size:40px;color:#ccc;background:#f0f0f0;">👤</div>`;

    resultArea.className = "result-card";
    resultArea.innerHTML = `
        ${photoHtml}
        <h2 style="color: #27ae60; margin:0;">✔ Verified</h2>
        <h3>${student.name}</h3>
        <p><strong>ID:</strong> ${id}</p>
        <p><strong>Course:</strong> ${student.course}</p>
        <p><strong>Status:</strong> ${student.status}</p>
    `;
    resultArea.style.display = 'block';
}

function showError() {
    const resultArea = document.getElementById('resultArea');
    resultArea.className = "result-card result-error";
    resultArea.innerHTML = `
        <div class="profile-pic-display" style="display:flex;align-items:center;justify-content:center;font-size:40px;color:#e74c3c;background:#fdecec;">?</div>
        <h2 style="color: #c0392b; margin:0;">✖ Not Found</h2>
        <p>This ID is not registered in the system.</p>
    `;
    resultArea.style.display = 'block';
}

/* --- CAMERA SCANNER LOGIC --- */
let html5QrcodeScanner = null;

function startScanner() {
    const readerDiv = document.getElementById('reader');
    readerDiv.style.display = 'block';

    html5QrcodeScanner = new Html5Qrcode("reader");

    html5QrcodeScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText, decodedResult) => {
            console.log(`Scan result: ${decodedText}`, decodedResult);
            document.getElementById('verifyInput').value = decodedText;
            verifyStudent();
            stopScanner();
        },
        (errorMessage) => {}
    ).catch(err => {
        console.error(err);
        alert("Camera failed to start.");
    });
}

function stopScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.stop().then(() => {
            document.getElementById('reader').style.display = 'none';
            html5QrcodeScanner.clear();
        }).catch(err => console.log("Failed to stop scanner."));
    }
}