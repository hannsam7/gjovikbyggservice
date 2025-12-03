// Project gallery and lightbox functionality
document.addEventListener('DOMContentLoaded', function() {
    const projectCards = document.querySelectorAll('.project-card');
    let currentImageIndex = 0;
    let galleryImages = [];

    // Create lightbox element
    const lightbox = createLightbox();
    document.body.appendChild(lightbox);

    // Add click handlers to project images
    projectCards.forEach((card, index) => {
        const projectImage = card.querySelector('.project-image img');
        
        if (projectImage) {
            projectImage.style.cursor = 'pointer';
            
            projectImage.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                openLightbox(index);
            });
        }
    });

    function createLightbox() {
        const lightboxContainer = document.createElement('div');
        lightboxContainer.className = 'lightbox';
        lightboxContainer.innerHTML = `
            <div class="lightbox-overlay"></div>
            <div class="lightbox-content">
                <button class="lightbox-close">&times;</button>
                <button class="lightbox-prev">&#8249;</button>
                <button class="lightbox-next">&#8250;</button>
                <img class="lightbox-image" src="" alt="">
                <div class="lightbox-info">
                    <h3 class="lightbox-title"></h3>
                    <p class="lightbox-location"></p>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
      style.textContent = `
      .lightbox {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
      }
      .lightbox.active { display: block; }
      .lightbox-overlay {
          position: absolute;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.95);
      }
      .lightbox-content {
          position: relative;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 2rem;
      }
      .lightbox-image {
          max-width: 90%;
          max-height: 80vh;
          object-fit: contain;
          border-radius: 8px;
          z-index: 1;
      }
      .lightbox-close,
      .lightbox-prev,
      .lightbox-next {
          position: fixed;
          background-color: rgba(200, 154, 46, 0.9);
          color: #242825;
          border: none;
          font-size: 2rem;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 10000;
          box-shadow: 0 4px 16px rgba(0,0,0,0.35);
      }
      .lightbox-close:hover,
      .lightbox-prev:hover,
      .lightbox-next:hover {
          background-color: #C89A2E;
          transform: scale(1.1);
      }
      .lightbox-close {
          top: 20px;
          right: 20px;
          font-size: 2.5rem;
          line-height: 1;
      }
      .lightbox-prev,
      .lightbox-next {
          top: 50%;
          transform: translateY(-50%);
      }
      .lightbox-prev { left: 20px; }
      .lightbox-next { right: 20px; }

      .lightbox-prev:hover,
      .lightbox-next:hover {
          transform: translateY(-50%) scale(1.1);
      }

      .lightbox-info {
          margin-top: 1.5rem;
          text-align: center;
          color: white;
          z-index: 1;
      }
      .lightbox-title {
          color: #C89A2E;
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
      }
      .lightbox-location { color: #8a8a8a; }

      @media (max-width: 768px) {
          .lightbox-close,
          .lightbox-prev,
          .lightbox-next {
              width: 40px;
              height: 40px;
              font-size: 1.5rem;
          }
          .lightbox-image {
              max-width: 95%;
              max-height: 70vh;
          }
          .lightbox-prev { left: 8px; }
          .lightbox-next { right: 8px; }
          .lightbox-prev:hover,
          .lightbox-next:hover {
              transform: translateY(-50%) scale(1.05);
          }
      }
  `;
        document.head.appendChild(style);

        // Event listeners
        const closeBtn = lightboxContainer.querySelector('.lightbox-close');
        const prevBtn = lightboxContainer.querySelector('.lightbox-prev');
        const nextBtn = lightboxContainer.querySelector('.lightbox-next');
        const overlay = lightboxContainer.querySelector('.lightbox-overlay');

        closeBtn.addEventListener('click', closeLightbox);
        overlay.addEventListener('click', closeLightbox);
        prevBtn.addEventListener('click', showPreviousImage);
        nextBtn.addEventListener('click', showNextImage);

        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (!lightboxContainer.classList.contains('active')) return;
            
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') showPreviousImage();
            if (e.key === 'ArrowRight') showNextImage();
        });

        return lightboxContainer;
    }

    function openLightbox(index) {
        // Gather all project images
        galleryImages = Array.from(projectCards).map(card => {
            const img = card.querySelector('.project-image img');
            const title = card.querySelector('.project-title')?.textContent || 'Prosjekt';
            const location = card.querySelector('.project-location')?.textContent || '';
            
            return {
                src: img.src,
                alt: img.alt,
                title: title,
                location: location
            };
        });

        currentImageIndex = index;
        updateLightboxImage();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    function showPreviousImage() {
        currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
        updateLightboxImage();
    }

    function showNextImage() {
        currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
        updateLightboxImage();
    }

    function updateLightboxImage() {
        const currentImage = galleryImages[currentImageIndex];
        const img = lightbox.querySelector('.lightbox-image');
        const title = lightbox.querySelector('.lightbox-title');
        const location = lightbox.querySelector('.lightbox-location');

        img.src = currentImage.src;
        img.alt = currentImage.alt;
        title.textContent = currentImage.title;
        location.textContent = currentImage.location;
    }
});