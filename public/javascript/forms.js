document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contactForm');
    if (!form) return;
  
    const countWords = (text) => (text.trim().split(/\s+/).filter(Boolean)).length;
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
  
      // Basic validity
      if (!form.checkValidity && !form.checkValidity?.()) {
        form.reportValidity?.();
        return;
      }
  
      const name = form.elements.name?.value?.trim() || '';
      const phone = form.elements.phone?.value?.trim() || '';
      const email = form.elements.email?.value?.trim() || '';
      const project = form.elements.projectType?.value || '';
      const descEl = form.querySelector('#description');
      const maxWords = parseInt(descEl?.dataset.maxWords || '100', 10);
      const description = descEl?.value?.trim() || '';
  
      // Enforce word limit again on submit
      if (countWords(description) > maxWords) {
        descEl.focus();
        return;
      }
  
      const subject = `Ny henvendelse – ${project || 'Prosjekt'}`;
      const bodyLines = [
        `Navn: ${name}`,
        `Telefon: ${phone}`,
        `E-post: ${email}`,
        `Prosjekt: ${project}`,
        '',
        'Beskrivelse:',
        description
      ];
  
      const mailto = `mailto:hannasamb@gmail.com?subject=${
        encodeURIComponent(subject)
      }&body=${
        encodeURIComponent(bodyLines.join('\n'))
      }`;
  
      window.location.href = mailto;
    });
  });