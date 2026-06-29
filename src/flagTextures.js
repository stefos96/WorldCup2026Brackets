import { CanvasTexture, SRGBColorSpace } from 'three';

const FLAG_WIDTH = 512;
const FLAG_HEIGHT = 256;

const TEAM_FLAGS = {
  ARG: { bands: ['#75aadb', '#ffffff', '#75aadb'], emblem: '#f6b40e' },
  ALG: { vertical: ['#006233', '#ffffff'], circle: '#d21034', emblem: '#d21034' },
  AUT: { bands: ['#ed2939', '#ffffff', '#ed2939'] },
  AUS: { field: '#012169', canton: '#ffffff', accent: '#e4002b', stars: '#ffffff' },
  BEL: { vertical: ['#000000', '#ffd90c', '#ef3340'] },
  BIH: { field: '#002395', triangle: '#fecb00', stars: '#ffffff' },
  BRA: { field: '#009b3a', diamond: '#ffdf00', circle: '#002776' },
  CAN: { vertical: ['#d52b1e', '#ffffff', '#d52b1e'], emblem: '#d52b1e' },
  COD: { field: '#007fff', diagonal: '#f7d618', diagonalAccent: '#ce1021', emblem: '#f7d618' },
  COL: { bands: ['#fcd116', '#003893', '#ce1126'], weights: [2, 1, 1] },
  CPV: { bands: ['#003893', '#003893', '#ffffff', '#cf2027', '#ffffff', '#003893'], weights: [6, 2, 1, 1, 1, 5], emblem: '#f7d116' },
  CRO: { bands: ['#ff0000', '#ffffff', '#171796'], checks: ['#ff0000', '#ffffff'] },
  DEN: { field: '#c60c30', cross: '#ffffff' },
  EGY: { bands: ['#ce1126', '#ffffff', '#000000'], emblem: '#c09300' },
  ENG: { field: '#ffffff', cross: '#ce1124' },
  FRA: { vertical: ['#002395', '#ffffff', '#ed2939'] },
  GER: { bands: ['#000000', '#dd0000', '#ffce00'] },
  GHA: { bands: ['#ce1126', '#fcd116', '#006b3f'], emblem: '#111111' },
  IRN: { bands: ['#239f40', '#ffffff', '#da0000'], emblem: '#da0000' },
  JPN: { field: '#ffffff', circle: '#bc002d' },
  KOR: { field: '#ffffff', circle: '#c60c30', lowerCircle: '#003478' },
  MAR: { field: '#c1272d', emblem: '#006233' },
  MEX: { vertical: ['#006847', '#ffffff', '#ce1126'], emblem: '#9c6b30' },
  NED: { bands: ['#ae1c28', '#ffffff', '#21468b'] },
  NOR: { field: '#ba0c2f', cross: '#ffffff', innerCross: '#00205b' },
  PAR: { bands: ['#d52b1e', '#ffffff', '#0038a8'], emblem: '#f6d04d' },
  POL: { bands: ['#ffffff', '#dc143c'] },
  POR: { vertical: ['#006600', '#ff0000'], split: 0.4, emblem: '#ffcc00' },
  QAT: { vertical: ['#ffffff', '#8a1538'], split: 0.28 },
  RSA: { bands: ['#e03c31', '#ffffff', '#001489'], chevron: ['#000000', '#ffb81c', '#007749'] },
  SEN: { vertical: ['#00853f', '#fdef42', '#e31b23'], emblem: '#00853f' },
  SRB: { bands: ['#c6363c', '#0c4076', '#ffffff'], emblem: '#f5c400' },
  ESP: { bands: ['#aa151b', '#f1bf00', '#aa151b'], weights: [1, 2, 1], emblem: '#aa151b' },
  SWE: { field: '#006aa7', cross: '#fecc00' },
  SUI: { field: '#ff0000', plus: '#ffffff' },
  TUN: { field: '#e70013', circle: '#ffffff', emblem: '#e70013' },
  URU: { stripes: ['#ffffff', '#0038a8'], canton: '#ffffff', emblem: '#fcd116' },
  USA: { stripes: ['#b22234', '#ffffff'], canton: '#3c3b6e', stars: '#ffffff' },
  ECU: { bands: ['#ffdd00', '#034ea2', '#ed1c24'], weights: [2, 1, 1], emblem: '#784421' },
  KSA: { field: '#006c35', emblem: '#ffffff' },
  WAL: { bands: ['#ffffff', '#00a650'], emblem: '#c8102e' },
  CMR: { vertical: ['#007a5e', '#ce1126', '#fcd116'], emblem: '#fcd116' },
  CIV: { vertical: ['#f77f00', '#ffffff', '#009e60'] },
  TBD: { field: '#263244', grid: '#556070', emblem: '#cbd5e1' },
};

function fillBands(ctx, colors, weights = colors.map(() => 1)) {
  const total = weights.reduce((sum, value) => sum + value, 0);
  let y = 0;

  colors.forEach((color, index) => {
    const height = (FLAG_HEIGHT * weights[index]) / total;
    ctx.fillStyle = color;
    ctx.fillRect(0, y, FLAG_WIDTH, height);
    y += height;
  });
}

function fillVertical(ctx, colors, split) {
  let x = 0;

  colors.forEach((color, index) => {
    const width = split && index === 0 ? FLAG_WIDTH * split : (FLAG_WIDTH - x) / (colors.length - index);
    ctx.fillStyle = color;
    ctx.fillRect(x, 0, width, FLAG_HEIGHT);
    x += width;
  });
}

function drawStar(ctx, x, y, radius, color, points = 5) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();

  for (let i = 0; i < points * 2; i += 1) {
    const angle = (Math.PI * i) / points - Math.PI / 2;
    const pointRadius = i % 2 === 0 ? radius : radius * 0.42;
    ctx.lineTo(Math.cos(angle) * pointRadius, Math.sin(angle) * pointRadius);
  }

  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawCenteredEmblem(ctx, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(FLAG_WIDTH * 0.5, FLAG_HEIGHT * 0.5, FLAG_HEIGHT * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlag(ctx, flag) {
  if (flag.bands) {
    fillBands(ctx, flag.bands, flag.weights);
  } else if (flag.vertical) {
    fillVertical(ctx, flag.vertical, flag.split);
  } else {
    ctx.fillStyle = flag.field;
    ctx.fillRect(0, 0, FLAG_WIDTH, FLAG_HEIGHT);
  }

  if (flag.stripes) {
    const stripeHeight = FLAG_HEIGHT / 9;
    for (let i = 0; i < 9; i += 1) {
      ctx.fillStyle = flag.stripes[i % flag.stripes.length];
      ctx.fillRect(0, i * stripeHeight, FLAG_WIDTH, stripeHeight);
    }
  }

  if (flag.diamond) {
    ctx.fillStyle = flag.diamond;
    ctx.beginPath();
    ctx.moveTo(FLAG_WIDTH * 0.5, FLAG_HEIGHT * 0.12);
    ctx.lineTo(FLAG_WIDTH * 0.9, FLAG_HEIGHT * 0.5);
    ctx.lineTo(FLAG_WIDTH * 0.5, FLAG_HEIGHT * 0.88);
    ctx.lineTo(FLAG_WIDTH * 0.1, FLAG_HEIGHT * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  if (flag.triangle) {
    ctx.fillStyle = flag.triangle;
    ctx.beginPath();
    ctx.moveTo(FLAG_WIDTH * 0.36, 0);
    ctx.lineTo(FLAG_WIDTH, FLAG_HEIGHT);
    ctx.lineTo(FLAG_WIDTH, 0);
    ctx.closePath();
    ctx.fill();
  }

  if (flag.diagonal) {
    ctx.save();
    ctx.translate(FLAG_WIDTH * 0.5, FLAG_HEIGHT * 0.5);
    ctx.rotate(-Math.PI / 7);
    ctx.fillStyle = flag.diagonalAccent;
    ctx.fillRect(-FLAG_WIDTH, -FLAG_HEIGHT * 0.08, FLAG_WIDTH * 2, FLAG_HEIGHT * 0.16);
    ctx.fillStyle = flag.diagonal;
    ctx.fillRect(-FLAG_WIDTH, -FLAG_HEIGHT * 0.045, FLAG_WIDTH * 2, FLAG_HEIGHT * 0.09);
    ctx.restore();
  }

  if (flag.canton) {
    ctx.fillStyle = flag.canton;
    ctx.fillRect(0, 0, FLAG_WIDTH * 0.42, FLAG_HEIGHT * 0.5);
  }

  if (flag.cross) {
    ctx.fillStyle = flag.cross;
    ctx.fillRect(0, FLAG_HEIGHT * 0.42, FLAG_WIDTH, FLAG_HEIGHT * 0.16);
    ctx.fillRect(FLAG_WIDTH * 0.28, 0, FLAG_WIDTH * 0.12, FLAG_HEIGHT);
  }

  if (flag.innerCross) {
    ctx.fillStyle = flag.innerCross;
    ctx.fillRect(0, FLAG_HEIGHT * 0.455, FLAG_WIDTH, FLAG_HEIGHT * 0.09);
    ctx.fillRect(FLAG_WIDTH * 0.295, 0, FLAG_WIDTH * 0.09, FLAG_HEIGHT);
  }

  if (flag.chevron) {
    const [black, gold, green] = flag.chevron;

    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(FLAG_WIDTH * 0.42, FLAG_HEIGHT * 0.5);
    ctx.lineTo(0, FLAG_HEIGHT);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = black;
    ctx.beginPath();
    ctx.moveTo(0, FLAG_HEIGHT * 0.1);
    ctx.lineTo(FLAG_WIDTH * 0.32, FLAG_HEIGHT * 0.5);
    ctx.lineTo(0, FLAG_HEIGHT * 0.9);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = green;
    ctx.lineWidth = FLAG_HEIGHT * 0.16;
    ctx.beginPath();
    ctx.moveTo(0, FLAG_HEIGHT * 0.5);
    ctx.lineTo(FLAG_WIDTH * 0.42, FLAG_HEIGHT * 0.5);
    ctx.stroke();
  }

  if (flag.plus) {
    ctx.fillStyle = flag.plus;
    ctx.fillRect(FLAG_WIDTH * 0.42, FLAG_HEIGHT * 0.22, FLAG_WIDTH * 0.16, FLAG_HEIGHT * 0.56);
    ctx.fillRect(FLAG_WIDTH * 0.28, FLAG_HEIGHT * 0.4, FLAG_WIDTH * 0.44, FLAG_HEIGHT * 0.2);
  }

  if (flag.circle) {
    ctx.fillStyle = flag.circle;
    ctx.beginPath();
    ctx.arc(FLAG_WIDTH * 0.5, FLAG_HEIGHT * 0.5, FLAG_HEIGHT * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }

  if (flag.lowerCircle) {
    ctx.fillStyle = flag.lowerCircle;
    ctx.beginPath();
    ctx.arc(FLAG_WIDTH * 0.5, FLAG_HEIGHT * 0.54, FLAG_HEIGHT * 0.18, 0, Math.PI);
    ctx.fill();
  }

  if (flag.checks) {
    const size = FLAG_HEIGHT * 0.09;
    const startX = FLAG_WIDTH * 0.43;
    const startY = FLAG_HEIGHT * 0.34;
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        ctx.fillStyle = flag.checks[(row + col) % 2];
        ctx.fillRect(startX + col * size, startY + row * size, size, size);
      }
    }
  }

  if (flag.grid) {
    ctx.strokeStyle = flag.grid;
    ctx.lineWidth = 2;
    for (let x = 0; x <= FLAG_WIDTH; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, FLAG_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= FLAG_HEIGHT; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(FLAG_WIDTH, y);
      ctx.stroke();
    }
  }

  if (flag.stars) {
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        drawStar(ctx, FLAG_WIDTH * 0.06 + col * 32, FLAG_HEIGHT * 0.08 + row * 24, 5, flag.stars);
      }
    }
  }

  if (flag.emblem) {
    drawCenteredEmblem(ctx, flag.emblem);
  }
}

export function createFlagTexture(countryCode = 'TBD') {
  const canvas = document.createElement('canvas');
  canvas.width = FLAG_WIDTH;
  canvas.height = FLAG_HEIGHT;

  const ctx = canvas.getContext('2d');
  const flag = TEAM_FLAGS[countryCode] ?? TEAM_FLAGS.TBD;

  drawFlag(ctx, flag);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;

  return texture;
}
