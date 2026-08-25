export function animateFlyToCart(sourceElement: HTMLElement | null) {
  if (typeof window === 'undefined' || !sourceElement) return;

  // Locate the cart icon button in the header
  const cartButton = document.querySelector('[aria-label="Carrito de compras"]');
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

  // Pulse cart icon on arrival
  setTimeout(() => {
    clone.remove();
    cartButton.classList.add('animate-bounce');
    setTimeout(() => cartButton.classList.remove('animate-bounce'), 600);
  }, 700);
}
