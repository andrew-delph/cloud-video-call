import { assert } from 'chai';
import { ReadyMessage } from '../src';
import { bufferToUint8Array, messageToBuffer } from '../src/utils';
import { parseReadyMessage } from '../src/message_helper';

describe(`basic`, function () {
  it(`test equal`, function () {
    assert.equal(5, 5);
  });

  it(`test notEqual`, function () {
    assert.notEqual(4, 5);
  });
});

describe(`Test rabbitmq messages`, function () {
  it(`test equal`, function () {
    // const readyMessage1 = new ReadyMessage();
    // readyMessage1.setUserId(`testid`);
    // const readyMessage2 = new ReadyMessage();
    // readyMessage2.setUserId(`testid`);
    // assert(ReadyMessage.compareFields(readyMessage1, readyMessage2));
  });

  it(`test seralize deseralize`, function () {
    const userId = `testid`;
    const readyMessage1 = new ReadyMessage();
    readyMessage1.setUserId(userId);

    const readyMessage2 = ReadyMessage.deserializeBinary(
      readyMessage1.serializeBinary(),
    );

    assert.equal(readyMessage1.getUserId(), readyMessage2.getUserId());

    assert.equal(userId, readyMessage2.getUserId());
  });

  it(`test seralize deseralize with buffer`, function () {
    const userId = `testid`;
    const priority = 0.0111111;
    const readyMessage1 = new ReadyMessage();
    readyMessage1.setUserId(userId);
    readyMessage1.setPriority(priority);

    const buffer = messageToBuffer(readyMessage1);

    const readyMessage2 = parseReadyMessage(buffer);

    assert.equal(readyMessage1.getUserId(), readyMessage2.getUserId());
    assert.equal(readyMessage1.getPriority(), readyMessage2.getPriority());

    assert.equal(userId, readyMessage2.getUserId());
    assert.equal(priority, readyMessage2.getPriority());
  });
});
