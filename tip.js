(function () {
  'use strict';
  const buttons = [...document.querySelectorAll('[data-tip]')];
  const customArea = document.getElementById('customTipArea');
  const input = document.getElementById('customTip');
  const image = document.getElementById('tipQr');
  const result = document.getElementById('tipResult');
  const status = document.getElementById('tipStatus');
  const amountLabel = document.getElementById('tipAmount');
  const download = document.getElementById('downloadTipQr');

  function clearQr() {
    result.hidden = true;
    image.removeAttribute('src');
    download.removeAttribute('href');
    amountLabel.textContent = '';
  }

  function render(value) {
    clearQr();
    input.removeAttribute('aria-invalid');
    try {
      if (!window.TipPayment || typeof window.qrcode !== 'function') {
        throw new Error('โหลดระบบสร้าง QR ไม่สำเร็จ กรุณารีเฟรชหน้าเว็บ');
      }
      const amount = TipPayment.normalizeAmount(value);
      const qr = qrcode(0, 'M');
      qr.addData(TipPayment.createPayload(amount), 'Byte');
      qr.make();
      // Four blank modules on all sides are required for reliable scanning.
      const scale = 8;
      const size = qr.getModuleCount();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = (size + 8) * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('เบราว์เซอร์นี้ไม่รองรับการสร้าง QR');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000';
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (qr.isDark(row, col)) ctx.fillRect((col + 4) * scale, (row + 4) * scale, scale, scale);
        }
      }
      const png = canvas.toDataURL('image/png');
      image.src = png;
      image.alt = 'QR พร้อมเพย์สำหรับทิป ' + amount + ' บาท';
      download.href = png;
      download.download = 'song-tip-' + amount + '-THB.png';
      amountLabel.textContent = Number(amount).toLocaleString('th-TH', {
        minimumFractionDigits: 2, maximumFractionDigits: 2
      }) + ' บาท';
      result.hidden = false;
      status.textContent = 'สแกนเพื่อทิป ' + amountLabel.textContent;
    } catch (error) {
      status.textContent = error.message;
      if (!customArea.hidden) input.setAttribute('aria-invalid', 'true');
    }
  }

  buttons.forEach(button => button.addEventListener('click', () => {
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    const custom = button.dataset.tip === 'custom';
    customArea.hidden = !custom;
    if (custom) {
      render(input.value);
      input.focus();
    } else {
      render(button.dataset.tip);
    }
  }));
  input.addEventListener('input', () => render(input.value));
  render('20');
})();
