export function animateFlyToCart(sourceElement: HTMLElement | null) {
  if (typeof window === 'undefined' || !sourceElement) return;

  // El carrito vive en el botón flotante inferior derecho.
  const cartButton = document.querySelector<HTMLElement>('[data-cart-button="true"]') ||
    document.querySelector<HTMLElement>('[aria-label^="Abrir carrito"]');
  if (!cartButton) return;

  const sourceRect = sourceElement.getBoundingClientRect();
  const targetRect = cartButton.getBoundingClientRect();

  // Create flying clone element
  const clone = sourceElement.cloneNode(true) as HTMLElement;
  clone.style.position = 'fixed';
  clone.style.left = `${sourceRect.left}px`;
  clone.style.top = `${sourceRect.top}px`;
  clone.style.width = `${sourceRect.width}px`;
  clone.style.height = `${sourceRect.height}px`;
  clone.style.zIndex = '9999';
  clone.style.pointerEvents = 'none';
  clone.style.borderRadius = '8px';
  clone.style.boxShadow = '0 10px 25px rgba(216, 129, 147, 0.5)';
  clone.style.margin = '0';
  clone.style.transition = 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
  clone.style.opacity = '0.95';

  document.body.appendChild(clone);

  // Trigger frame animation towards cart button
  requestAnimationFrame(() => {
    clone.style.left = `${targetRect.left + targetRect.width / 2 - 15}px`;
    clone.style.top = `${targetRect.top + targetRect.height / 2 - 15}px`;
    clone.style.width = '30px';
    clone.style.height = '30px';
    clone.style.opacity = '0';
    clone.style.transform = 'scale(0.2) rotate(360deg)';
  });

  // Al llegar: quitar la copia y animar el contador y el carrito.
  setTimeout(() => {
    clone.remove();

    // Pop del botón flotante (keyframes .cart-pop ya definidos en FloatingCartButton)
    cartButton.classList.add('cart-pop');
    setTimeout(() => cartButton.classList.remove('cart-pop'), 600);

    // Rebote del contador usando un selector estable, no una clase visual cambiante.
    const badge = cartButton.querySelector('[data-cart-badge="true"]');
    if (badge && badge instanceof HTMLElement) {
      badge.classList.add('animate-bounce');
      setTimeout(() => badge.classList.remove('animate-bounce'), 600);
    }
  }, 700);
}
