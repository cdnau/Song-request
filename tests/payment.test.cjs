const { test } = require('node:test');
const assert = require('node:assert/strict');
const payment = require('../promptpay.js');
const qrcode = require('../vendor/qrcode.js');

function fields(text) {
  const result = {};
  for (let offset = 0; offset < text.length;) {
    const tag = text.slice(offset, offset + 2);
    const length = Number(text.slice(offset + 2, offset + 4));
    result[tag] = text.slice(offset + 4, offset + 4 + length);
    offset += length + 4;
  }
  return result;
}

test('CRC agrees with standard check vector and original QR checksum', () => {
  assert.equal(payment.crc16('123456789'), '29B1');
  assert.equal(payment.crc16('00020101021129390016A000000677010111031500499908579776853037645802TH6304'), '18C7');
});

test('presets and custom amounts preserve the original recipient and THB currency', () => {
  for (const amount of ['20', '50', '100', '1000', '25.50', '0.01', '999999.99']) {
    const payload = payment.createPayload(amount);
    const data = fields(payload);
    assert.equal(data['29'], '0016A0000006770101110315004999085797768');
    assert.equal(data['01'], '12');
    assert.equal(data['53'], '764');
    assert.equal(data['58'], 'TH');
    assert.equal(data['54'], Number(amount).toFixed(2));
    assert.equal(data['63'], payment.crc16(payload.slice(0, -4)));
    const qr = qrcode(0, 'M');
    qr.addData(payload, 'Byte');
    assert.doesNotThrow(() => qr.make());
  }
});

test('rejects zero, negative, excessive precision, overflow and non-decimal input', () => {
  for (const amount of ['', ' ', '0', '0.00', '-20', '1.001', '1000000', '1e3', 'NaN', 'Infinity', '1,000', '20บาท', null, undefined]) {
    assert.throws(() => payment.createPayload(amount));
  }
  assert.equal(payment.normalizeAmount(' 25.5 '), '25.50');
  assert.equal(payment.normalizeAmount('000020'), '20.00');
});
