/**
 * NexusIcon Web Component
 * Dynamically injects SVG symbols from the master-atlas.
 * Usage: <nexus-icon name="electra"></nexus-icon>
 */
class NexusIcon extends HTMLElement {
  connectedCallback() {
    const rawName = this.getAttribute('name');

    // Default alignment to behave like a standard icon
    this.style.display = 'inline-block';
    this.style.verticalAlign = '-0.125em';
    this.style.width = '20px';
    this.style.height = '20px';

    // Basic safety: if name is missing, render nothing
    if (!rawName) {
      this.innerHTML = '';
      return;
    }

    // Sanitize: only allow alphanumeric chars, hyphens, and underscores
    // This prevents XSS through attribute injection.
    const name = rawName.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!name) {
      this.innerHTML = '';
      return;
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'nav-icon');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'width:100%;height:100%;pointer-events:none;filter:drop-shadow(0 0 5px currentColor)';
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `/assets/svg/master-atlas.svg#${name}`);
    svg.appendChild(use);
    this.appendChild(svg);
  }
}

// Prevent double-registration errors
if (!customElements.get('nexus-icon')) {
  customElements.define('nexus-icon', NexusIcon);
}
