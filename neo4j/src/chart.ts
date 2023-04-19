const fs = require(`fs`);
import * as d3 from 'd3';
import ChartJSImage from 'chart.js-image';
const svg2img = require(`svg2img`);
import { createCanvas } from 'canvas';
const D3Node = require(`d3-node`);

const canvasModule = require(`canvas`); // supports node-canvas v1 & v2.x
const d3n = new D3Node({ canvasModule });

export function createDotGraph(
  data: {
    x: number;
    y: number;
    dotColor?: string;
  }[],
  name: string,
) {
  console.log(`create data ${data.length}`);

  const width = 800 * 2;
  const height = 600 * 2;
  const padding = 100;
  const dotSize = 5;

  const minX = Math.min(...data.map((p) => p.x));
  const maxX = Math.max(...data.map((p) => p.x));
  const minY = Math.min(...data.map((p) => p.y));
  const maxY = Math.max(...data.map((p) => p.y));

  const scaleX = (width - 2 * padding) / (maxX - minX);
  const scaleY = (height - 2 * padding) / (maxY - minY);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext(`2d`);

  // Background
  ctx.fillStyle = `white`;
  ctx.fillRect(0, 0, width, height);

  // Axes
  ctx.strokeStyle = `black`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  // Labels
  ctx.font = `16px Arial`;
  ctx.fillStyle = `black`;

  const topRight = `(${maxX.toFixed(2)}, ${maxY.toFixed(2)})`;
  const bottomLeft = `(${minX.toFixed(2)}, ${minY.toFixed(2)})`;
  ctx.fillText(bottomLeft, padding, height - padding + 20);
  ctx.fillText(topRight, width - padding, padding + 20);

  // ctx.fillText(`(${minX}, ${minY})`, padding, height - padding + 20);
  // ctx.fillText(`(${maxX}, ${maxY})`, width - padding, padding + 20);

  // Dots
  for (const point of data) {
    ctx.fillStyle = point.dotColor ?? `red`;
    const x = (point.x - minX) * scaleX + padding;
    const y = height - padding - (point.y - minY) * scaleY;
    ctx.beginPath();
    ctx.arc(x, y, dotSize, 0, Math.PI * 2);
    ctx.fill();
  }

  const buffer = canvas.toBuffer(`image/png`);
  fs.writeFileSync(`./${name}.png`, buffer);
}

export async function createLineChart() {
  const canvas = d3n.createCanvas(960, 500);
  const context = canvas.getContext(`2d`);

  const width = canvas.width;
  const height = canvas.height;
  const radius = Math.min(width, height) / 2;

  const colors = [
    `#98abc5`,
    `#8a89a6`,
    `#7b6888`,
    `#6b486b`,
    `#a05d56`,
    `#d0743c`,
    `#ff8c00`,
  ];

  const arc = d3
    .arc()
    .outerRadius(radius - 10)
    .innerRadius(0)
    .context(context);

  const labelArc = d3
    .arc()
    .outerRadius(radius - 40)
    .innerRadius(radius - 40)
    .context(context);

  const pie = d3
    .pie()
    .sort(null)
    .value(function (d: any) {
      return d.population;
    });

  context.translate(width / 2, height / 2);

  const data = d3.range(1000).map(d3.randomBates(10));

  const arcs = pie(data);

  arcs.forEach(function (d, i) {
    context.beginPath();
    //@ts-ignore
    arc(d);
    context.fillStyle = colors[i];
    context.fill();
  });

  context.beginPath();
  //@ts-ignore
  arcs.forEach(arc);
  context.strokeStyle = `#fff`;
  context.stroke();

  context.textAlign = `center`;
  context.textBaseline = `middle`;
  context.fillStyle = `#000`;

  arcs.forEach(function (d: any) {
    const c = labelArc.centroid(d);
    context.fillText(d.data.age, c[0], c[1]);
  });

  canvas.pngStream().pipe(fs.createWriteStream(`output.png`));
}
