document.addEventListener('DOMContentLoaded', function() {
    const unapLogo = document.getElementById('unapLogo');
    const matrixCanvas = document.getElementById('matrixCanvas');
    const honoraryModal = document.getElementById('honoraryModal');
    const closeHonoraryModalBtn = document.getElementById('closeHonoraryModal');
    const ctx = matrixCanvas.getContext('2d');

    let clickCount = 0;
    let clickTimer;
    let animationFrameId;

    // State for UNAP display
    let unapDisplayed = false;
    let unapFallProgress = 0;

    // Set canvas dimensions
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;

    // Matrix characters and speed
    const textToFall = "FELIPE ROJAS "; // Added space to avoid immediate repetition
    const fallSpeed = 0.3; // Smaller value for slower speed

    const fontSize = 16;
    const columns = matrixCanvas.width / fontSize;

    const drops = [];
    for (let i = 0; i < columns; i++) {
        drops[i] = { y: 1, charIndex: Math.floor(Math.random() * textToFall.length) };
    }

    function drawMatrix() {
        // Black semi-transparent background to fade out old characters
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

        if (!unapDisplayed) {
            // Draw UNAP in large letters
            ctx.fillStyle = '#04ba04'; // Green color for UNAP
            const unapFontSize = matrixCanvas.width / 8; // Adjust as needed for size
            ctx.font = 'bold ' + unapFontSize + 'px monospace';

            const unapText = 'UNAP';
            const textWidth = ctx.measureText(unapText).width;
            const x = (matrixCanvas.width - textWidth) / 2;
            const y = matrixCanvas.height / 4; // Starting Y position for UNAP

            ctx.fillText(unapText, x, y + unapFallProgress);

            unapFallProgress += fallSpeed * 5; // Make UNAP fall faster

            // Transition to regular matrix effect after UNAP has fallen sufficiently
            if (unapFallProgress > matrixCanvas.height / 2) { // UNAP has fallen halfway down the screen
                unapDisplayed = true;
                // Re-initialize drops for the regular matrix effect to start cleanly
                for (let i = 0; i < columns; i++) {
                    drops[i] = { y: 1, charIndex: Math.floor(Math.random() * textToFall.length) };
                }
            }
        } else {
            // Existing Matrix drawing logic
            ctx.fillStyle = '#04ba04'; // Green characters
            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < drops.length; i++) {
                const char = textToFall.charAt(drops[i].charIndex % textToFall.length);
                ctx.fillText(char, i * fontSize, drops[i].y * fontSize);

                // Sending the drop back to the top randomly after it has crossed the screen
                // Adding a randomness to the reset to make the drops scattered on the Y axis
                if (drops[i].y * fontSize > matrixCanvas.height && Math.random() > 0.975) {
                    drops[i].y = 0;
                    drops[i].charIndex = Math.floor(Math.random() * textToFall.length); // Start from random char in string
                }

                // Incrementing Y coordinate and character index
                drops[i].y += fallSpeed;
                drops[i].charIndex++;
            }
        }
        animationFrameId = requestAnimationFrame(drawMatrix);
    }

    function startMatrixAnimation() {
        matrixCanvas.classList.remove('hidden');
        // Reset UNAP display state when starting animation
        unapDisplayed = false;
        unapFallProgress = 0;

        // Re-initialize drops for new dimensions if needed (e.g., if window resized)
        matrixCanvas.width = window.innerWidth;
        matrixCanvas.height = window.innerHeight;
        for (let i = 0; i < columns; i++) {
            drops[i] = { y: 1, charIndex: Math.floor(Math.random() * textToFall.length) };
        }
        animationFrameId = requestAnimationFrame(drawMatrix);
    }

    function stopMatrixAnimation() {
        cancelAnimationFrame(animationFrameId);
        matrixCanvas.classList.add('hidden');
        showHonoraryModal();
    }

    function showHonoraryModal() {
        if (honoraryModal) {
            honoraryModal.style.display = 'flex';
            // Removed setTimeout for automatic closing
        }
    }

    function hideHonoraryModal() {
        if (honoraryModal) {
            honoraryModal.style.display = 'none';
        }
    }

    unapLogo.addEventListener('click', function() {
        clickCount++;

        clearTimeout(clickTimer);
        clickTimer = setTimeout(() => {
            clickCount = 0; // Reset count if clicks are too slow
        }, 500); // 500ms window for rapid clicks

        if (clickCount >= 3) {
            if (matrixCanvas.classList.contains('hidden')) {
                startMatrixAnimation();
            } else {
                stopMatrixAnimation();
            }
            clickCount = 0; // Reset count after triggering/stopping
        }
    });

    // Event listener for close button inside the honorary modal
    if (closeHonoraryModalBtn) {
        closeHonoraryModalBtn.addEventListener('click', hideHonoraryModal);
    }

    // Event listener to close modal when clicking outside its content
    if (honoraryModal) {
        honoraryModal.addEventListener('click', (e) => {
            if (e.target === honoraryModal) {
                hideHonoraryModal();
            }
        });
    }

    // Optional: Resize canvas on window resize
    window.addEventListener('resize', () => {
        matrixCanvas.width = window.innerWidth;
        matrixCanvas.height = window.innerHeight;
        // Re-initialize drops for new dimensions if needed
        // This part is already handled in startMatrixAnimation, but good to have for general resize
        // if the animation is not running.
        if (matrixCanvas.classList.contains('hidden')) {
            // Only reset if not currently animating, otherwise startMatrixAnimation handles it.
            for (let i = 0; i < columns; i++) {
                drops[i] = { y: 1, charIndex: Math.floor(Math.random() * textToFall.length) };
            }
        }
    });
});
