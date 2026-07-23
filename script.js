const CAPTURE_SCALE = 2; // 저장 해상도 배율 (2 = 레티나 수준)

/* ---------- 설정값 읽기 ---------- */

function getTargetWidth() {
    const preset = document.getElementById('width-preset').value;
    if (preset === 'auto') return null;
    if (preset === 'custom') {
        const custom = parseInt(document.getElementById('custom-width').value, 10);
        return custom > 0 ? custom : null;
    }
    return parseInt(preset, 10);
}

function getMargin() {
    const value = parseInt(document.getElementById('margin-size').value, 10);
    return isNaN(value) || value < 0 ? 0 : value;
}

/* ---------- 화면 반영 ---------- */

function applyWidth() {
    const area = document.getElementById('capture-area');
    const width = getTargetWidth();

    if (width) {
        // 너비를 고정하면 블록으로 바꿔야 지정한 폭이 그대로 적용된다
        area.style.display = 'block';
        area.style.width = width + 'px';
    } else {
        // 자동일 때는 내용 크기만큼만 차지하도록 원래 방식으로 되돌림
        area.style.display = 'inline-block';
        area.style.width = '';
    }
}

function applyStretch() {
    const on = document.getElementById('stretch-content').checked;
    document.getElementById('capture-area').classList.toggle('stretch', on);
}

function applyPreviewMargin() {
    const paper = document.getElementById('paper');
    const on = document.getElementById('preview-white').checked;

    paper.classList.toggle('white-preview', on);
    paper.style.padding = on ? getMargin() + 'px' : '';
}

function applyBackground() {
    document.getElementById('preview-wrapper').style.backgroundColor =
        document.getElementById('bg-color').value;
}

/* ---------- 미리보기 ---------- */

function updatePreview() {
    const htmlCode = document.getElementById('html-input').value;
    const cssCode = document.getElementById('css-input').value;

    document.getElementById('capture-area').innerHTML = htmlCode;
    document.getElementById('dynamic-style').innerHTML = cssCode;

    applyWidth();
    applyStretch();
    applyPreviewMargin();
}

/* ---------- 저장 ---------- */

function saveAsPng(withBackground) {
    const target = document.getElementById('capture-area');

    // 미리보기용 점선 테두리가 이미지에 찍히지 않도록 잠시 제거
    target.classList.add('capturing');

    html2canvas(target, {
        useCORS: true,
        backgroundColor: null,
        scale: CAPTURE_SCALE
    }).then(canvas => {
        const output = withBackground ? addWhiteMargin(canvas, getMargin()) : canvas;

        const link = document.createElement('a');
        link.download = withBackground ? 'layout-preview-white.png' : 'layout-preview.png';
        link.href = output.toDataURL('image/png');
        link.click();
    }).catch(err => {
        alert('이미지를 만들지 못했습니다: ' + err.message);
    }).finally(() => {
        target.classList.remove('capturing');
    });
}

// 캡처된 캔버스를 흰 바탕 위에 여백을 두고 다시 그린다
function addWhiteMargin(canvas, marginPx) {
    const pad = marginPx * CAPTURE_SCALE;
    const padded = document.createElement('canvas');
    padded.width = canvas.width + pad * 2;
    padded.height = canvas.height + pad * 2;

    const ctx = padded.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, padded.width, padded.height);
    ctx.drawImage(canvas, pad, pad);

    return padded;
}

/* ---------- 컨트롤 연결 ---------- */

document.addEventListener('DOMContentLoaded', () => {
    const preset = document.getElementById('width-preset');
    const custom = document.getElementById('custom-width');

    preset.addEventListener('change', () => {
        custom.disabled = preset.value !== 'custom';
        if (preset.value === 'custom') custom.focus();
        applyWidth();
    });

    custom.addEventListener('input', applyWidth);
    document.getElementById('stretch-content').addEventListener('change', applyStretch);
    document.getElementById('margin-size').addEventListener('input', applyPreviewMargin);
    document.getElementById('preview-white').addEventListener('change', applyPreviewMargin);
    document.getElementById('bg-color').addEventListener('input', applyBackground);

    applyWidth();
    applyBackground();
});