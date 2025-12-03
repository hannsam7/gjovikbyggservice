document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  // Security: Sanitize input to prevent XSS attacks
  const sanitizeInput = (input) => {
      const div = document.createElement('div');
      div.textContent = input;
      return div.innerHTML;
  };

  // Security: Validate email format
  const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
  };

  // Security: Validate phone number (Norwegian format)
  const isValidPhone = (phone) => {
      // Allow Norwegian phone numbers: +47 followed by 8 digits, or just 8 digits
      const phoneRegex = /^(\+47)?[0-9]{8}$/;
      return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  // Security: Limit string length to prevent buffer overflow
  const limitLength = (str, maxLength) => {
      return str.substring(0, maxLength);
  };

  const countWords = (text) => (text.trim().split(/\s+/).filter(Boolean)).length;
  
  // Add rate limiting for form submissions (prevent spam)
  let lastSubmitTime = 0;
  const SUBMIT_COOLDOWN = 3000; // 3 seconds between submissions

  form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Rate limiting check
      const now = Date.now();
      if (now - lastSubmitTime < SUBMIT_COOLDOWN) {
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
      const name = limitLength(sanitizeInput(nameRaw), 100);
      const phone = limitLength(sanitizeInput(phoneRaw), 20);
      const email = limitLength(sanitizeInput(emailRaw), 100);
      const project = limitLength(sanitizeInput(projectRaw), 50);
      const description = limitLength(sanitizeInput(descriptionRaw), 1000);

      // Validation checks
      if (name.length < 2) {
          alert('Vennligst skriv inn et gyldig navn (minst 2 tegn).');
          form.elements.name.focus();
          return;
      }

      if (!isValidPhone(phone)) {
          alert('Vennligst skriv inn et gyldig telefonnummer (8 siffer).');
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
      const subject = `Ny henvendelse – ${project}`;
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
          const mailto = `mailto:hannasamb@gmail.com?subject=${
              encodeURIComponent(subject)
          }&body=${
              encodeURIComponent(bodyLines.join('\n'))
          }`;

          // Update last submit time
          lastSubmitTime = now;

          // Open mailto link
          window.location.href = mailto;
          
          // Optional: Reset form after successful submission
          setTimeout(() => {
              form.reset();
              const counter = document.getElementById('descriptionHelp');
              if (counter) {
                  counter.textContent = '0/100 ord';
                  counter.classList.remove('warn', 'exceeded');
              }
          }, 1000);
          
      } catch (error) {
          console.error('Error creating mailto link:', error);
          alert('Det oppstod en feil. Vennligst prøv igjen.');
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
              phoneInput.setCustomValidity('Vennligst skriv inn et gyldig norsk telefonnummer.');
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
});