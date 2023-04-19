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

export async function createPieChart(
  data: {
    value: number;
    name: string;
    colour?: string;
  }[],
  filename: string,
) {
  var canvas = d3n.createCanvas(960, 500);
  var context = canvas.getContext(`2d`);

  var width = canvas.width;
  var height = canvas.height;
  var radius = Math.min(width, height) / 2;

  var arc = d3
    .arc<d3.PieArcDatum<typeof data[0]>>()
    .outerRadius(radius - 10)
    .innerRadius(0)
    .context(context);

  var labelArc = d3
    .arc<d3.PieArcDatum<typeof data[0]>>()
    .outerRadius(radius - 40)
    .innerRadius(radius - 40)
    .context(context);

  var pie = d3.pie<typeof data[0]>().value(function (d) {
    return d.value;
  });

  context.translate(width / 2, height / 2);

  console.log(`Data`, data);

  const arcs = pie(data);

  arcs.forEach(function (d, i) {
    context.beginPath();
    console.log(d);
    arc(d);
    context.fillStyle = d.data.colour ?? `red`;
    context.fill();
  });

  context.beginPath();
  arcs.forEach(arc);
  context.strokeStyle = `#fff`;
  context.stroke();

  context.textAlign = `center`;
  context.textBaseline = `middle`;
  context.fillStyle = `#000`;

  arcs.forEach(function (d) {
    const c = labelArc.centroid(d);
    context.fillText(d.data.name, c[0], c[1]);
  });

  canvas.pngStream().pipe(fs.createWriteStream(`${filename}.png`));
}

export async function createRidgeLineChart(
  data: {
    value: number;
    name: string;
    colour?: string;
  }[],
  filename: string,
) {
  var canvas = d3n.createCanvas(960, 500);
  var context = canvas.getContext(`2d`);

  var width = canvas.width;
  var height = canvas.height;
  var radius = Math.min(width, height) / 2;

  var arc = d3
    .arc<d3.PieArcDatum<typeof data[0]>>()
    .outerRadius(radius - 10)
    .innerRadius(0)
    .context(context);

  var labelArc = d3
    .arc<d3.PieArcDatum<typeof data[0]>>()
    .outerRadius(radius - 40)
    .innerRadius(radius - 40)
    .context(context);

  var pie = d3.pie<typeof data[0]>().value(function (d) {
    return d.value;
  });

  context.translate(width / 2, height / 2);

  console.log(`Data`, data);

  const arcs = pie(data);

  arcs.forEach(function (d, i) {
    context.beginPath();
    console.log(d);
    arc(d);
    context.fillStyle = d.data.colour ?? `red`;
    context.fill();
  });

  context.beginPath();
  arcs.forEach(arc);
  context.strokeStyle = `#fff`;
  context.stroke();

  context.textAlign = `center`;
  context.textBaseline = `middle`;
  context.fillStyle = `#000`;

  arcs.forEach(function (d) {
    const c = labelArc.centroid(d);
    context.fillText(d.data.name, c[0], c[1]);
  });

  canvas.pngStream().pipe(fs.createWriteStream(`${filename}.png`));
}
