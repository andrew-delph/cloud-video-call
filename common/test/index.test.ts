import moment from 'moment';

test(`adds 1 + 2 to equal 3`, () => {
  expect(1 + 2).toBe(3);
});

test(`test moment convert values`, () => {
  const time1 = moment();

  console.log(`time1: ${time1}`);

  expect(`${moment(time1.valueOf())}`).toBe(`${time1}`);
});
