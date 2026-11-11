/* PromptPay payload for the recipient decoded from the original qr.JPG. */
(function (root) {
  'use strict';
  const recipient = Object.freeze({ type: '03', id: '004999085797768' });

  function field(tag, value) {
    return tag + String(value.length).padStart(2, '0') + value;
  }

  function crc16(text) {
    let crc = 0xffff;
    for (const char of text) {
      crc ^= char.charCodeAt(0) << 8;
      for (let bit = 0; bit < 8; bit++) {
        crc = ((crc << 1) ^ ((crc & 0x8000) ? 0x1021 : 0)) & 0xffff;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  function normalizeAmount(value) {
    const text = String(value).trim();
    if (!/^\d{1,6}(\.\d{1,2})?$/.test(text)) {
      throw new Error('กรุณาระบุ 0.01–999,999.99 บาท ทศนิยมไม่เกิน 2 ตำแหน่ง');
    }
    const [whole, fraction = ''] = text.split('.');
    const satang = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
    if (satang < 1 || satang > 99999999) {
      throw new Error('กรุณาระบุ 0.01–999,999.99 บาท');
    }
    return Math.floor(satang / 100) + '.' + String(satang % 100).padStart(2, '0');
  }

  function createPayload(value) {
    const amount = normalizeAmount(value);
    const merchant = field('00', 'A000000677010111') + field(recipient.type, recipient.id);
    const data = field('00', '01') + field('01', '12') + field('29', merchant)
      + field('58', 'TH') + field('53', '764') + field('54', amount) + '6304';
    return data + crc16(data);
  }

  const api = Object.freeze({ recipient, crc16, normalizeAmount, createPayload });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TipPayment = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
