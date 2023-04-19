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

export async function createRidgeLineChart(filename: string) {
  const options = {
    width: 960,
    height: 500,
    margin: { top: 30, right: 30, bottom: 30, left: 30 },
  };

  var canvas = d3n.createCanvas(options.width, options.height);
  var context = canvas.getContext(`2d`);

  const data: {
    key: string;
    values: [number, number][];
    colour?: string;
  }[] = [
    {
      key: `A`,
      values: [5, 7, 10, 12, 6, 8, 5, 11, 9, 7].map((d, i) => [i, d]),
    },
    {
      key: `B`,
      values: [6, 12, 5, 8, 6, 13, 9, 7, 12, 4].map((d, i) => [i, d]),
      colour: `red`,
    },
    {
      key: `C`,
      values: [8, 4, 7, 9, 10, 6, 8, 13, 12, 7].map((d, i) => [i, d]),
    },
  ];

  console.log(`data`, JSON.stringify(data));

  const xScale = d3
    .scaleLinear()
    .range([options.margin.left, options.width - options.margin.right])
    .domain([0, data[0].values.length - 1]);

  const yScale = d3
    .scaleLinear()
    .range([
      options.height / data.length - options.margin.bottom,
      options.margin.top,
    ])
    .domain([0, d3.max(data, (d) => d3.max(d.values, (value) => value[1]))!]);

  const ySpacing =
    (options.height - options.margin.top - options.margin.bottom) / data.length;

  //   ySpacing = 200;
  console.log(`ySpacing`, ySpacing);

  // Set background color
  context.fillStyle = `#f0f0f0`; // Change this to your desired color
  context.fillRect(0, 0, options.width, options.height);

  context.lineWidth = 1;

  data.forEach((d, index) => {
    context.save();
    context.translate(0, index * ySpacing);

    const line = d3
      .line()
      .x((d) => {
        return xScale(d[0]);
      })
      .y((d) => {
        return yScale(d[1]);
      })
      .context(context);

    const area = d3
      .area()
      .x((d) => xScale(d[0]))
      .y0(options.height)
      .y1((d) => yScale(d[1]))
      .context(context);

    context.strokeStyle = d.colour ?? `steelblue`;
    context.beginPath();
    line(d.values);
    context.stroke();

    context.fillStyle = `black`;
    context.fillText(
      d.key,
      options.margin.left - 20,
      yScale(d3.mean(d.values, (value) => value[1])!),
    );

    context.restore();
  });

  canvas.pngStream().pipe(fs.createWriteStream(`${filename}.png`));
}
