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
  const width = 800 * 2;
  const height = 600 * 2;
  const padding = 100;
  const dotSize = 10;

  const minX = Math.min(...data.map((p) => p.x));
  const minY = Math.min(...data.map((p) => p.y));
  const maxX = Math.max(...data.map((p) => p.x));
  const maxY = Math.max(...data.map((p) => p.y));

  const scaleX = (width - 2 * padding) / (maxX - minX);
  const scaleY = (height - 2 * padding) / (maxY - minY);

  console.log(
    `createDotGraph ${name} points ${
      data.length
    } minX,minY ${minX},${minY} maxX,maxY ${maxX},${maxY} diffX ${
      maxX - minX
    } diffY ${maxY - minY} scaleX ${scaleX} scaleY ${scaleY}`,
  );

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
    .arc<d3.PieArcDatum<(typeof data)[0]>>()
    .outerRadius(radius - 10)
    .innerRadius(0)
    .context(context);

  var labelArc = d3
    .arc<d3.PieArcDatum<(typeof data)[0]>>()
    .outerRadius(radius - 40)
    .innerRadius(radius - 40)
    .context(context);

  var pie = d3.pie<(typeof data)[0]>().value(function (d) {
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

function createHistogram(numbers: number[]): [number, number][] {
  const histogram: { [key: number]: number } = {};

  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const range = 10;
  const bucketSize = (max - min) / range;

  for (let i = min; i < max; i = i + bucketSize) {
    histogram[i] = 0;
  }

  numbers.forEach((number) => {
    const roundedNumber =
      Math.floor((number - min) / bucketSize) * bucketSize + min;

    if (!histogram.hasOwnProperty(roundedNumber)) {
      histogram[roundedNumber] = 0;
    } else {
    }

    histogram[roundedNumber]++;
  });

  const result: [number, number][] = [];
  for (const number in histogram) {
    result.push([parseFloat(number), histogram[number]]);
  }

  result.sort((a, b) => a[0] - b[0]);

  return result;
}

export async function createRidgeLineChart(
  data: {
    [key: string]: {
      values: number[];
      colour?: string;
    };
  },
  filename: string,
) {
  const options = {
    width: 960 * 2,
    height: 500 * 2,
    margin: { top: 30, right: 30, bottom: 30, left: 30 },
  };

  var canvas = d3n.createCanvas(options.width, options.height);
  var context = canvas.getContext(`2d`);

  const dataParsed: {
    key: string;
    values: [number, number][];
    colour?: string;
  }[] = [];

  for (const key in data) {
    const item = data[key];
    const histogram = createHistogram(item.values);

    console.log(`histogram length`, histogram.length);

    dataParsed.push({ key, values: histogram, colour: item.colour ?? `red` });
  }

  const x_min = d3.min(dataParsed, (d) =>
    d3.min(d.values, (value) => value[0]),
  )!;
  const x_max = d3.max(dataParsed, (d) =>
    d3.max(d.values, (value) => value[0]),
  )!;
  const y_min = d3.min(dataParsed, (d) =>
    d3.min(d.values, (value) => value[1]),
  )!;
  const y_max = d3.max(dataParsed, (d) =>
    d3.max(d.values, (value) => value[1]),
  )!;
  console.log(`x_min`, x_min, `x_max`, x_max);
  console.log(`y_min`, y_min, `y_max`, y_max);

  console.log(
    `d3.max(dataParsed, (d) => d.values.length)!`,
    d3.max(dataParsed, (d) => d.values.length)!,
  );

  const xScale = d3
    .scaleLinear()
    .range([options.margin.left, options.width - options.margin.right])
    .domain([x_min, x_max]);

  const yScale = d3
    .scaleLinear()
    .range([
      options.height / dataParsed.length - options.margin.bottom,
      options.margin.top,
    ])
    .domain([
      0,
      d3.max(dataParsed, (d) => d3.max(d.values, (value) => value[1]))!,
    ]);

  const ySpacing =
    (options.height - options.margin.top - options.margin.bottom) /
    dataParsed.length;

  //   ySpacing = 200;
  console.log(`ySpacing`, ySpacing);

  // Set background color
  context.fillStyle = `#f0f0f0`;
  context.fillRect(0, 0, options.width, options.height);

  context.lineWidth = 1;

  dataParsed
    .sort((a, b) => {
      const aTotal = a.values.reduce((accumulator, currentItem) => {
        return accumulator + currentItem[0] * currentItem[1];
      }, 0);
      const bTotal = b.values.reduce((accumulator, currentItem) => {
        return accumulator + currentItem[0] * currentItem[1];
      }, 0);
      return bTotal - aTotal;
    })
    .forEach((d, index) => {
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
        .y0(yScale(0))
        .y1((d) => yScale(d[1]))
        .context(context);

      // context.strokeStyle = d.colour ?? `red`;
      // context.beginPath();
      // line(d.values);
      // context.stroke();

      context.fillStyle = d.colour ?? `red33`;
      context.beginPath();
      area(d.values);
      context.closePath();
      context.fill();

      context.fillStyle = `black`;
      context.fillText(
        d.key,
        options.margin.left - 20,
        yScale(d3.mean(d.values, (value) => value[1])!),
      );

      context.restore();
    });

  // Draw the x-axis grid
  context.strokeStyle = `#000`;
  context.lineWidth = 1;
  xScale.ticks().forEach((tick) => {
    const textWidth = context.measureText(tick).width;
    const textHeight = context.measureText(tick).emHeightAscent;

    const x = xScale(tick);
    context.fillStyle = `black`;
    context.fillText(tick, x - textWidth / 2, 20 + textHeight);

    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, 20);
    context.stroke();
  });

  canvas.pngStream().pipe(fs.createWriteStream(`${filename}.png`));
}
