/**
 * story-navigator.js — Reusable story node navigator renderer.
 *
 * Renders a list of story nodes into a container element using safe
 * DOM construction only — no innerHTML, no XSS risk.
 *
 * Usage:
 *   import { renderStoryNavigator } from '/src/story-navigator.js';
 *   renderStoryNavigator(nodes, document.getElementById('story-map'));
 *
 */

/**
 * @typedef {{ id: string, title: string, act?: number }} StoryNode
 */

/**
 * Render a flat list of story nodes into `container`.
 * Clears existing content, then appends one `.story-nav-item` per node.
 *
 * @param {StoryNode[]} nodes
 * @param {HTMLElement} container
 * @param {(node: StoryNode) => void} [onNodeClick]
 */
export function renderStoryNavigator(nodes, container, onNodeClick) {
  container.replaceChildren(); // SAFE: no innerHTML used anywhere in this module

  nodes.forEach(node => {
    // --- Safe DOM creation (no innerHTML, no XSS risk) ---
    const item = document.createElement('div');
    item.className = 'story-nav-item';
    item.dataset.id = node.id; // safe for identifiers

    const title = document.createElement('span');
    title.textContent = node.title; // SAFE: never interpreted as HTML

    item.appendChild(title);

    // Attach click/activate handler when onNodeClick is provided
    if (typeof onNodeClick === 'function') {
      item.addEventListener('click', () => onNodeClick(node));
    }

    container.appendChild(item);
  });
}
