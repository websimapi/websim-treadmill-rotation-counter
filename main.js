// removed ESM import; using global window.jsQR

const QR_CODE_IDENTIFIER = "TREADMILL_ROTATION_MARKER";

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const rotationCountElement = document.getElementById('rotation-count');
const statusMessageElement = document.getElementById('status-message');
const detectionStatusElement = document.getElementById('current-detection-status');

let rotationCount = 0;
// isQrDetected tracks the state in the *previous* frame.
let isQrDetected = false; 
let videoStream = null;

// Function to update the rotation count display
function updateRotationDisplay() {
    rotationCountElement.textContent = rotationCount;
}

// Function to update detection status display
function updateDetectionStatus(detected) {
    if (detected) {
        detectionStatusElement.textContent = "QR Code Visible!";
        detectionStatusElement.className = 'detected';
    } else {
        detectionStatusElement.textContent = "Searching...";
        detectionStatusElement.className = 'not-detected';
    }
}

// Main processing loop using requestAnimationFrame
function tick() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        
        // Ensure canvas dimensions match video dimensions for accurate capture
        if (canvas.height !== video.videoHeight || canvas.width !== video.videoWidth) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
        }

        // Draw the video frame onto the canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get the image data from the canvas
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Scan for QR code
        const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert", 
        });

        let currentDetection = false;

        if (code && code.data === QR_CODE_IDENTIFIER) {
            currentDetection = true;
        }
        
        updateDetectionStatus(currentDetection);

        // --- Rotation Counting Logic ---
        // We count a rotation when the QR code transitions from NOT detected (out of view) to DETECTED (entering view).
        
        if (currentDetection && !isQrDetected) {
            rotationCount++;
            updateRotationDisplay();
        }
        
        // Update the state for the next frame
        isQrDetected = currentDetection;

    }

    requestAnimationFrame(tick);
}

// Function to handle camera initialization
async function setupCamera() {
    statusMessageElement.textContent = "Requesting camera permissions...";
    statusMessageElement.className = '';
    try {
        // Prefer rear camera ('environment') as it's typically required for pointing at external objects like a treadmill.
        const constraints = {
            video: {
                facingMode: "environment" 
            }
        };

        videoStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = videoStream;
        
        // Ensure video is not mirrored, typical for environment camera
        video.style.transform = 'scaleX(1)'; 
        
        await video.play();
        statusMessageElement.textContent = "Camera feed active. Please align QR code.";
        
        // Start the continuous processing loop
        requestAnimationFrame(tick);

    } catch (err) {
        console.error("Error accessing camera: ", err);
        statusMessageElement.textContent = `ERROR: Could not access camera. Ensure permissions are granted. (${err.name}: ${err.message})`;
        statusMessageElement.className = 'error';
    }
}

// Start the application
setupCamera();