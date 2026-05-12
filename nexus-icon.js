import { UI_ICONS } from "./ui-icons.js";

class NexusIcon extends HTMLElement {
  static get observedAttributes() { return ["name", "size"]; }

  connectedCallback() { this.render(); }
  attributeChangedCallback() { this.render(); }

  render() {
    const rawName = this.getAttribute("name") || "home";
    const rawSize = this.getAttribute("size") || "1.25em";

    // Sanitize name: only alphanumeric, hyphens, underscores (valid SVG ID chars)
    const safeName = rawName.replace(/[^a-zA-Z0-9_-]/g, '');
    // Sanitize size: only allow CSS size values (digits, dots, %, em, rem, px, vw, vh)
    const safeSize = /^[\d.]+(%|em|rem|px|vw|vh|ex|ch|vmin|vmax)?$/.test(rawSize) ? rawSize : '1.25em';

    const name = UI_ICONS[safeName] || safeName;
    const atlas = "/assets/svg/master-atlas.svg";

    // Build DOM with createElementNS to avoid innerHTML injection risk
    this.innerHTML = '';

    const style = document.createElement('style');
    style.textContent = `:host{display:inline-flex;width:${safeSize};height:${safeSize};color:inherit}svg{width:100%;height:100%;fill:currentColor;stroke:currentColor}`;
    this.appendChild(style);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('viewBox', '0 0 128 128');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `${atlas}#${name}`);
    svg.appendChild(use);
    this.appendChild(svg);
  }
}

customElements.define("nexus-icon", NexusIcon);
