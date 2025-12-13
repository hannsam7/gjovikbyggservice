document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contactForm');
    if (!form) return;
  
    // Security: Sanitize input to prevent XSS attacks
    const sanitizeInput = (input) => {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    };
  
    // Security: Sanitize for email to prevent header injection
    const sanitizeForEmail = (text) => {
        // Remove potential email header injections
        return text
            .replace(/[\r\n]/g, ' ')
            .replace(/[<>]/g, '')
            .trim();
    };
  
    // Security: Validate email format
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };
  
    // Security: Enhanced Norwegian phone validation
    const isValidPhone = (phone) => {
        // Remove all spaces and common separators
        const cleaned = phone.replace(/[\s\-\(\)]/g, '');
        
        // Norwegian mobile: 4XX XXXXX or 9XX XXXXX (8 digits)
        // Or with country code: +474XXXXXXX or +479XXXXXXX
        const phoneRegex = /^(\+47)?[49]\d{7}$/;
        
        return phoneRegex.test(cleaned);
    };
  
    // Security: Limit string length to prevent buffer overflow
    const limitLength = (str, maxLength) => {
        return str.substring(0, maxLength);
    };
  
    const countWords = (text) => (text.trim().split(/\s+/).filter(Boolean)).length;
    
    // Security: Enhanced rate limiting with localStorage
    const SUBMIT_LIMIT = 3; // Max 3 submissions
    const SUBMIT_WINDOW = 3600000; // Per hour (in ms)
    const SUBMIT_COOLDOWN = 3000; // 3 seconds between submissions
  
    let submissionHistory = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
  
    // Create success modal
    function createSuccessModal() {
        const modal = document.createElement('div');
        modal.className = 'form-modal';
        modal.id = 'successModal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content success">
                <div class="modal-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <h3>Takk for din henvendelse!</h3>
                <p>Vi åpner din e-postklient for å sende meldingen. Skjemaet er nå tilbakestilt.</p>
                <button class="modal-close-btn" onclick="closeModal('successModal')">Lukk</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
  
    // Create error modal
    function createErrorModal() {
        const modal = document.createElement('div');
        modal.className = 'form-modal';
        modal.id = 'errorModal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content error">
                <div class="modal-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <h3>Noe gikk galt</h3>
                <p>Det oppstod en feil ved sending av skjemaet. Vennligst prøv igjen eller kontakt oss direkte.</p>
                <div class="modal-actions">
                    <button class="modal-close-btn" onclick="closeModal('errorModal')">Lukk</button>
                    <a href="tel:+4792234450" class="modal-action-btn">Ring oss</a>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
  
    // Create rate limit modal
    function createRateLimitModal() {
        const modal = document.createElement('div');
        modal.className = 'form-modal';
        modal.id = 'rateLimitModal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content error">
                <div class="modal-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                </div>
                <h3>For mange forsøk</h3>
                <p>Du har nådd grensen for innsendinger. Vennligst prøv igjen senere eller kontakt oss direkte.</p>
                <div class="modal-actions">
                    <button class="modal-close-btn" onclick="closeModal('rateLimitModal')">Lukk</button>
                    <a href="tel:+4792234450" class="modal-action-btn">Ring oss</a>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
  
    // Show success modal
    function showSuccessModal() {
        let modal = document.getElementById('successModal');
        if (!modal) {
            createSuccessModal();
            modal = document.getElementById('successModal');
        }
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Auto-close after 5 seconds
        setTimeout(() => {
            closeModal('successModal');
        }, 5000);
    }
  
    // Show error modal
    function showErrorModal() {
        let modal = document.getElementById('errorModal');
        if (!modal) {
            createErrorModal();
            modal = document.getElementById('errorModal');
        }
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
  
    // Show rate limit modal
    function showRateLimitModal() {
        let modal = document.getElementById('rateLimitModal');
        if (!modal) {
            createRateLimitModal();
            modal = document.getElementById('rateLimitModal');
        }
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
  
    // Close modal function (global)
    window.closeModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };
  
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            ['successModal', 'errorModal', 'rateLimitModal'].forEach(id => {
                closeModal(id);
            });
        }
    });
  
    // Add modal styles
    const style = document.createElement('style');
    style.textContent = `
        .form-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        }
  
        .form-modal.active {
            display: flex;
            align-items: center;
            justify-content: center;
        }
  
        .modal-overlay {
            position: absolute;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(4px);
            cursor: pointer;
        }
  
        .modal-content {
            position: relative;
            background: #242825;
            border-radius: 16px;
            padding: 2.5rem;
            max-width: 500px;
            width: 90%;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            animation: slideUp 0.4s ease;
            border: 2px solid #C89A2E;
        }
  
        .modal-content.success {
            border-color: #4CAF50;
        }
  
        .modal-content.error {
            border-color: #f44336;
        }
  
        .modal-icon {
            margin: 0 auto 1.5rem;
            width: 64px;
            height: 64px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
  
        .modal-content.success .modal-icon {
            background: rgba(76, 175, 80, 0.15);
            color: #4CAF50;
        }
  
        .modal-content.error .modal-icon {
            background: rgba(244, 67, 54, 0.15);
            color: #f44336;
        }
  
        .modal-content h3 {
            color: #C89A2E;
            font-size: 1.75rem;
            margin-bottom: 1rem;
            font-weight: 600;
        }
  
        .modal-content.success h3 {
            color: #4CAF50;
        }
  
        .modal-content.error h3 {
            color: #f44336;
        }
  
        .modal-content p {
            color: #f0f0f0;
            font-size: 1.1rem;
            line-height: 1.6;
            margin-bottom: 2rem;
        }
  
        .modal-close-btn {
            background: #C89A2E;
            color: #242825;
            border: none;
            padding: 0.875rem 2rem;
            border-radius: 999px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(200, 154, 46, 0.3);
        }
  
        .modal-close-btn:hover {
            background: #A57F25;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(200, 154, 46, 0.4);
        }
  
        .modal-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }
  
        .modal-action-btn {
            background: transparent;
            color: #C89A2E;
            border: 2px solid #C89A2E;
            padding: 0.875rem 2rem;
            border-radius: 999px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: none;
            display: inline-block;
        }
  
        .modal-action-btn:hover {
            background: rgba(200, 154, 46, 0.15);
        }
  
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
  
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
  
        @media (max-width: 768px) {
            .modal-content {
                padding: 2rem 1.5rem;
                width: 95%;
            }
  
            .modal-content h3 {
                font-size: 1.5rem;
            }
  
            .modal-content p {
                font-size: 1rem;
            }
  
            .modal-close-btn,
            .modal-action-btn {
                font-size: 1rem;
                padding: 0.75rem 1.5rem;
            }
  
            .modal-actions {
                flex-direction: column;
            }
  
            .modal-action-btn {
                width: 100%;
            }
        }
    `;
    document.head.appendChild(style);
  
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Security: Check honeypot field (bot detection)
        const honeypot = form.elements.website?.value;
        if (honeypot) {
            // This is likely a bot - silently reject
            console.log('Bot detected');
            return;
        }
  
        // Security: Enhanced rate limiting check with localStorage
        const now = Date.now();
        
        // Clean old submissions from history
        submissionHistory = submissionHistory.filter(time => now - time < SUBMIT_WINDOW);
        
        // Check if limit exceeded
        if (submissionHistory.length >= SUBMIT_LIMIT) {
            showRateLimitModal();
            return;
        }
  
        // Check cooldown period
        const lastSubmit = submissionHistory[submissionHistory.length - 1] || 0;
        if (now - lastSubmit < SUBMIT_COOLDOWN) {
            alert('Vennligst vent litt før du sender inn skjemaet på nytt.');
            return;
        }
  
        // Basic validity check
        if (form.checkValidity && !form.checkValidity()) {
            form.reportValidity();
            return;
        }
  
        // Get and sanitize form values
        const nameRaw = form.elements.name?.value?.trim() || '';
        const phoneRaw = form.elements.phone?.value?.trim() || '';
        const emailRaw = form.elements.email?.value?.trim() || '';
        const projectRaw = form.elements.projectType?.value || '';
        const descEl = form.querySelector('#description');
        const maxWords = parseInt(descEl?.dataset.maxWords || '100', 10);
        const descriptionRaw = descEl?.value?.trim() || '';
  
        // Security: Limit input lengths
        const name = sanitizeForEmail(limitLength(sanitizeInput(nameRaw), 100));
        const phone = sanitizeForEmail(limitLength(sanitizeInput(phoneRaw), 20));
        const email = sanitizeForEmail(limitLength(sanitizeInput(emailRaw), 100));
        const project = sanitizeForEmail(limitLength(sanitizeInput(projectRaw), 50));
        const description = sanitizeForEmail(limitLength(sanitizeInput(descriptionRaw), 1000));
  
        // Validation checks
        if (name.length < 2) {
            alert('Vennligst skriv inn et gyldig navn (minst 2 tegn).');
            form.elements.name.focus();
            return;
        }
  
        if (!isValidPhone(phone)) {
            alert('Vennligst skriv inn et gyldig telefonnummer (8 siffer, starter med 4 eller 9).');
            form.elements.phone.focus();
            return;
        }
  
        if (!isValidEmail(email)) {
            alert('Vennligst skriv inn en gyldig e-postadresse.');
            form.elements.email.focus();
            return;
        }
  
        if (!project) {
            alert('Vennligst velg en prosjekttype.');
            form.elements.projectType.focus();
            return;
        }
  
        if (description.length < 10) {
            alert('Vennligst beskriv prosjektet ditt (minst 10 tegn).');
            descEl.focus();
            return;
        }
  
        // Enforce word limit
        if (countWords(description) > maxWords) {
            alert(`Beskrivelsen kan ikke overstige ${maxWords} ord.`);
            descEl.focus();
            return;
        }
  
        // Security: Create sanitized mailto link
        const subject = sanitizeForEmail(`Ny henvendelse – ${project}`);
        const bodyLines = [
            `Navn: ${name}`,
            `Telefon: ${phone}`,
            `E-post: ${email}`,
            `Prosjekt: ${project}`,
            '',
            'Beskrivelse:',
            description
        ];
  
        try {
            const mailto = `mailto:post@gjovik-byggservice.no?subject=${
                encodeURIComponent(subject)
            }&body=${
                encodeURIComponent(bodyLines.join('\n'))
            }`;
  
            // Update submission history
            submissionHistory.push(now);
            localStorage.setItem('formSubmissions', JSON.stringify(submissionHistory));
  
            // Show success message
            showSuccessModal();
  
            // Open mailto link after a short delay
            setTimeout(() => {
                window.location.href = mailto;
            }, 500);
            
            // Reset form after successful submission
            setTimeout(() => {
                form.reset();
                const counter = document.getElementById('descriptionHelp');
                if (counter) {
                    counter.textContent = '0/100 ord';
                    counter.classList.remove('warn', 'exceeded');
                }
            }, 2000);
            
        } catch (error) {
            console.error('Error creating mailto link:', error);
            showErrorModal();
        }
    });
  
    // Security: Prevent form submission via Enter key in text inputs (only allow in textarea)
    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            return false;
        }
    });
  
    // Security: Add input validation listeners
    const nameInput = form.elements.name;
    const phoneInput = form.elements.phone;
    const emailInput = form.elements.email;
  
    if (nameInput) {
        nameInput.addEventListener('blur', () => {
            const value = nameInput.value.trim();
            if (value && value.length < 2) {
                nameInput.setCustomValidity('Navnet må være minst 2 tegn langt.');
            } else {
                nameInput.setCustomValidity('');
            }
        });
  
        nameInput.addEventListener('input', () => {
            nameInput.setCustomValidity('');
        });
    }
  
    if (phoneInput) {
        phoneInput.addEventListener('blur', () => {
            const value = phoneInput.value.trim();
            if (value && !isValidPhone(value)) {
                phoneInput.setCustomValidity('Vennligst skriv inn et gyldig norsk telefonnummer (8 siffer, starter med 4 eller 9).');
            } else {
                phoneInput.setCustomValidity('');
            }
        });
  
        phoneInput.addEventListener('input', () => {
            phoneInput.setCustomValidity('');
        });
    }
  
    if (emailInput) {
        emailInput.addEventListener('blur', () => {
            const value = emailInput.value.trim();
            if (value && !isValidEmail(value)) {
                emailInput.setCustomValidity('Vennligst skriv inn en gyldig e-postadresse.');
            } else {
                emailInput.setCustomValidity('');
            }
        });
  
        emailInput.addEventListener('input', () => {
            emailInput.setCustomValidity('');
        });
    }
  
    // Close modal when clicking overlay
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            const modal = e.target.closest('.form-modal');
            if (modal) {
                closeModal(modal.id);
            }
        }
    });
  });