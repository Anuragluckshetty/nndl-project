let personImage = null;
let tshirtImage = null;

// Smooth scrolling
function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

// Handle person photo upload
document.getElementById('personUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(event) {
            personImage = event.target.result;
            document.getElementById('personPreview').innerHTML = 
                `<img src="${event.target.result}" alt="Person photo">`;
            updateGenerateButton();
        };
        reader.readAsDataURL(file);
    }
});

// Handle t-shirt image upload
document.getElementById('tshirtUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(event) {
            tshirtImage = event.target.result;
            document.getElementById('tshirtPreview').innerHTML = 
                `<img src="${event.target.result}" alt="T-shirt image">`;
            updateGenerateButton();
        };
        reader.readAsDataURL(file);
    }
});

// Enable/disable generate button
function updateGenerateButton() {
    const btn = document.getElementById('generateBtn');
    btn.disabled = !(personImage && tshirtImage);
}

// Generate virtual try-on result
async function generateResult() {
    if (!personImage || !tshirtImage) return;

    const resultPreview = document.getElementById('resultPreview');
    const generateBtn = document.getElementById('generateBtn');
    
    generateBtn.disabled = true;
    
    try {
        // Show loading state
        resultPreview.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <div class="loading-spinner"></div>
                <p style="color: rgba(255,255,255,0.6); margin-top: 20px;">
                    Processing images...<br>
                    This may take a few seconds
                </p>
            </div>
        `;

        // First check if server is running
        try {
            const healthCheck = await fetch('http://localhost:5000/health');
            if (!healthCheck.ok) {
                throw new Error('Server is not running');
            }
        } catch (e) {
            throw new Error('Cannot connect to server. Please make sure the server is running (python model.py)');
        }

        // Process images
        const response = await fetch('http://localhost:5000/try-on', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                person_image: personImage,
                cloth_image: tshirtImage
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // Show success result
        resultPreview.innerHTML = `
            <img src="${data.result}" alt="Try-on result" style="max-width: 100%; max-height: 100%; object-fit: contain;">
        `;
    } catch (error) {
        let errorMessage = error.message || 'Failed to generate try-on result';
        let helpText = '';

        // Add specific help text based on error message
        if (errorMessage.includes('RGBA')) {
            helpText = `
                <br><br>The image format is not supported.<br>
                Please try uploading JPG images instead of PNG with transparency.
            `;
        } else {
            helpText = `
                <br><br>Please make sure:<br>
                1. The server is running (python model.py)<br>
                2. Person image is full body, front-facing<br>
                3. T-shirt image is clear and isolated
            `;
        }

        resultPreview.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <div style="font-size: 3em; margin-bottom: 20px;">❌</div>
                <h3 style="margin-bottom: 10px; color: #ff4444;">Error</h3>
                <p style="color: rgba(255,255,255,0.6); font-size: 0.9em;">
                    ${errorMessage}${helpText}
                </p>
            </div>
        `;
    } finally {
        generateBtn.disabled = false;
    }
}