// History screen: list of finished workouts, newest first.
// Builds DOM only; app.js prepares the data.

// items: [{ id, dateText, durationText, exerciseNames: [string] }]
export function renderHistory(root, items) {
  root.replaceChildren();

  if (!items.length) {
    root.append(el('p', { className: 'empty' }, 'No finished workouts yet.'));
    return;
  }

  root.append(el('ul', { className: 'history-list' },
    ...items.map((item) => el('li', { className: 'card history-item' },
      el('div', { className: 'when' },
        el('span', {}, item.dateText),
        el('span', { className: 'duration' }, item.durationText)),
      el('p', { className: 'exercises' },
        item.exerciseNames.length ? item.exerciseNames.join(', ') : 'No exercises logged')))));
}

// Small helper: el('p', { className: 'x' }, 'text', childNode, ...)
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  node.append(...children);
  return node;
}
