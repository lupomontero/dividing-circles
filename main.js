const random = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

const degreesToRadians = degrees => degrees * Math.PI / 180;

const drawCircle = (ctx, x, y, radius, color, stroke = true) => {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  if (stroke) {
    ctx.stroke();
  }
  if (color) {
    ctx.fillStyle = color;
    ctx.fill();
  }
};

const drawLine = (ctx, fromX, fromY, toX, toY) => {
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
};

const createPointOnCircle = (angle, radius) => {
  const radians = degreesToRadians(angle);
  return {
    x: radius + Math.cos(radians) * radius,
    y: radius + Math.sin(radians) * radius,
  };
};

const createPoints = (radius, max = 10, randomDistribution = false) => {
  const recurse = (memo, remaining) => {
    if (remaining === 0) {
      return memo;
    }

    const angle = (
      randomDistribution
        ? random(0, 360)
        : remaining * (360 / max)
    );
    const point = createPointOnCircle(angle, radius);

    return recurse([...memo, point], remaining - 1);
  };

  return recurse([], max);
};

const drawPauseIcon = (ctx, radius) => {
  const x1 = radius - (radius / 4) - (radius / 30);
  const y1 = radius - (radius / 5);
  const x2 = radius + (radius / 30);
  const w = radius / 4;
  const h = radius / 2.5;
  ctx.clearRect(x1, y1, w, h);
  ctx.clearRect(x2, y1, w, h);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(x1, y1, w, h);
  ctx.fillRect(x2, y1, w, h);
};

const createCanvas = (width) => {
  const canvas = Object.assign(
    document.createElement('canvas'),
    { width, height: width },
  );
  const ctx = canvas.getContext('2d');
  const radius = width / 2;

  ctx.font = `${width / 40}px monospace`;
  ctx.textBaseline = 'top';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';

  const update = () => {
    if (canvas.isDestroyed) {
      return;
    }

    if (state.isPaused) {
      drawPauseIcon(ctx, radius);
      return window.requestAnimationFrame(() => update());
    }

    ctx.clearRect(0, 0, width, width);

    const points = createPoints(radius, state.points, state.randomDistribution);
    const n = points.length;
    const regions = (n / 24) * (Math.pow(n, 3) - (6 * Math.pow(n, 2)) + (23 * n) - 18) + 1;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`Points: ${n}`, 0, 0);
    ctx.fillText(`Regions: ${Math.round(regions)}`, 0, width / 29);

    drawCircle(ctx, radius, radius, Math.floor(width / 2), 'transparent', true);

    points.forEach(({ x, y }) => {
      drawCircle(ctx, x, y, 5, 'white', true);
      points.forEach(({ x: x2, y: y2 }) => {
        drawLine(ctx, x, y, x2, y2);
      });
    });

    window.requestAnimationFrame(() => update());
  };

  update();

  return canvas;
};

const render = () => {
  const root = document.getElementById('root');
  Object.assign(root.querySelector('canvas') || {}, { isDestroyed: true });
  root.innerHTML = '';
  root.appendChild(
    createCanvas(Math.min(window.innerWidth, window.innerHeight) * .9),
  );
};

const state = {
  points: 2,
  randomDistribution: true,
  showHelp: false,
  isPaused: false,
};

const shortcuts = {
  h: {
    description: 'Show/hide help (keyboard shortcuts)',
    fn: () => {
      Object.assign(state, { showHelp: !state.showHelp });
      if (!state.showHelp) {
        return document.body.removeChild(document.querySelector('.help'));
      }
      const container = Object.assign(document.createElement('div'), {
        className: 'help',
        innerHTML: '<h2>Keyboard shortcuts</h2>',
      });
      Object.keys(shortcuts).forEach((key) => {
        const el = document.createElement('div');
        el.textContent = `${key}: ${shortcuts[key].description}`;
        container.appendChild(el);
      });
      document.body.appendChild(container);
    },
  },
  ArrowUp: {
    description: 'Increase number of points',
    fn: () => Object.assign(state, {
      points: state.points + 1,
      isPaused: false,
    }),
  },
  ArrowDown: {
    description: 'Decrease number of points',
    fn: () => {
      if (state.points === 2) {
        return;
      }
      Object.assign(state, {
        points: state.points - 1,
        isPaused: false,
      });
    },
  },
  r: {
    description: 'Toggle random distribution',
    fn: () => Object.assign(state, {
      randomDistribution: !state.randomDistribution,
      isPaused: false,
    }),
  },
  p: {
    description: 'Pause/unpause',
    fn: () => Object.assign(state, { isPaused: !state.isPaused }),
  },
};

window.addEventListener('keydown', (e) => {
  if (!shortcuts[e.key]) {
    return;
  }

  shortcuts[e.key].fn();
});

window.addEventListener('resize', render);

render();

// Auto-show help on startup...
setTimeout(() => {
  window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'h' }));
});
