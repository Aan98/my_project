// Active workout screen: start button, timer, exercises with their sets,
// add exercise, add set and finish workout. Builds DOM only; every change
// goes through the `actions` passed in by app.js.

// view: { active: false } or
//   { active: true, timerText, startedText, focusExerciseId,
//     exercises: [{ id, name, sets: [{ id, text }] }] }
// actions: start(), finish(), addExercise(name) and
//   addSet(exerciseId, weightText, repsText). The last two return an
//   error message, or null on success.
export function renderWorkout(root, view, actions) {
  root.replaceChildren();

  if (!view.active) {
    root.append(
      el('p', { className: 'empty' }, 'No workout in progress.'),
      bottomBar(el('button', { type: 'button', className: 'primary', onclick: actions.start }, 'Start workout')),
    );
    return;
  }

  root.append(
    el('p', { className: 'timer', dataset: { timer: '' } }, view.timerText),
    el('p', { className: 'started' }, view.startedText),
    ...view.exercises.map((exercise) => exerciseCard(exercise, actions)),
    addExerciseForm(actions),
    bottomBar(finishButton(actions)),
  );

  if (view.focusExerciseId) {
    root.querySelector(`[data-exercise-id="${view.focusExerciseId}"] input`)?.focus();
  }
}

// Updates only the timer text, so inputs being typed in are not redrawn.
export function updateTimer(root, text) {
  const timer = root.querySelector('[data-timer]');
  if (timer) timer.textContent = text;
}

function exerciseCard(exercise, actions) {
  const weight = el('input', {
    name: 'weight', inputMode: 'decimal', autocomplete: 'off', enterKeyHint: 'next',
  });
  const reps = el('input', {
    name: 'reps', inputMode: 'numeric', pattern: '[0-9]*', autocomplete: 'off', enterKeyHint: 'done',
  });
  const error = el('p', { className: 'form-error', role: 'alert' });

  const form = el('form', {
    className: 'set-form',
    onsubmit: (event) => {
      event.preventDefault();
      error.textContent = actions.addSet(exercise.id, weight.value, reps.value) ?? '';
    },
  },
  el('label', {}, 'Weight (kg)', weight),
  el('label', {}, 'Reps', reps),
  el('button', { type: 'submit', className: 'primary' }, 'Add set'));

  return el('section', { className: 'card', dataset: { exerciseId: exercise.id } },
    el('h2', {}, exercise.name),
    exercise.sets.length
      ? el('ol', { className: 'sets' }, ...exercise.sets.map((set) => el('li', {}, set.text)))
      : '',
    form,
    error);
}

function addExerciseForm(actions) {
  const name = el('input', {
    name: 'exercise', placeholder: 'Exercise name', autocomplete: 'off',
    autocapitalize: 'sentences', enterKeyHint: 'done',
  });
  const error = el('p', { className: 'form-error', role: 'alert' });

  return el('div', { className: 'card' },
    el('form', {
      className: 'add-exercise',
      onsubmit: (event) => {
        event.preventDefault();
        error.textContent = actions.addExercise(name.value) ?? '';
      },
    },
    name,
    el('button', { type: 'submit', className: 'secondary' }, 'Add exercise')),
    error);
}

// Two taps to finish, so a mis-tap cannot end the workout. Uses no
// browser dialog (confirm() is blocked in some browsers and webviews).
const CONFIRM_MS = 4000;

function finishButton(actions) {
  let timeoutId = null;
  const button = el('button', {
    type: 'button',
    className: 'danger',
    onclick: () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        actions.finish();
        return;
      }
      button.textContent = 'Tap again to finish';
      button.classList.add('armed');
      timeoutId = setTimeout(() => {
        timeoutId = null;
        button.textContent = 'Finish workout';
        button.classList.remove('armed');
      }, CONFIRM_MS);
    },
  }, 'Finish workout');
  return button;
}

function bottomBar(button) {
  return el('div', { className: 'bottom-bar' }, button);
}

// Small helper: el('p', { className: 'x' }, 'text', childNode, ...)
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  const { dataset, ...rest } = props;
  Object.assign(node, rest);
  if (dataset) Object.assign(node.dataset, dataset);
  node.append(...children);
  return node;
}
