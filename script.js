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

function getNumber(id) {
    const value = parseInt(document.getElementById(id).value, 10);
    return isNaN(value) || value < 0 ? 0 : value;
}

const getMargin = () => getNumber('margin-size');
const getRadius = () => getNumber('corner-radius');

// 그림자가 여백 밖으로 잘리지 않도록 여백 크기에 맞춰 조절한다
function getShadow() {
    if (!document.getElementById('shadow-on').checked) return null;
    const margin = getMargin();
    if (margin === 0) return null;
    return {
        blur: Math.min(24, margin * 0.6),
        offsetY: Math.min(8, margin * 0.2),
        color: 'rgba(0, 0, 0, 0.20)'
    };
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

// 여백 · 라운딩 · 그림자를 미리보기에 그대로 보여준다
function applyPreviewStyle() {
    const paper = document.getElementById('paper');
    const area = document.getElementById('capture-area');
    const on = document.getElementById('preview-white').checked;
    const radius = getRadius();
    const shadow = getShadow();

    paper.classList.toggle('white-preview', on);
    paper.style.padding = on ? getMargin() + 'px' : '';

    area.style.borderRadius = radius ? radius + 'px' : '';
    area.style.overflow = radius ? 'hidden' : '';
    area.style.boxShadow = (on && shadow)
        ? `0 ${shadow.offsetY}px ${shadow.blur}px ${shadow.color}`
        : '';
}

/* ---------- 미리보기 ---------- */

function updatePreview() {
    const htmlCode = document.getElementById('html-input').value;
    const cssCode = document.getElementById('css-input').value;

    document.getElementById('capture-area').innerHTML = htmlCode;
    document.getElementById('dynamic-style').innerHTML = cssCode;

    applyWidth();
    applyStretch();
    applyPreviewStyle();
}

/* ---------- 저장 ---------- */

function saveAsPng(withBackground) {
    const target = document.getElementById('capture-area');

    // 미리보기 전용 장식(점선, 그림자)이 이미지에 찍히지 않도록 잠시 제거
    target.classList.add('capturing');

    html2canvas(target, {
        useCORS: true,
        backgroundColor: null,
        scale: CAPTURE_SCALE
    }).then(canvas => {
        const output = withBackground ? composeOnWhite(canvas) : canvas;

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

// 캡처된 캔버스를 흰 바탕 위에 여백 · 라운딩 · 그림자와 함께 다시 그린다
function composeOnWhite(canvas) {
    const s = CAPTURE_SCALE;
    const pad = getMargin() * s;
    const radius = Math.min(getRadius() * s, canvas.width / 2, canvas.height / 2);
    const shadow = getShadow();

    const out = document.createElement('canvas');
    out.width = canvas.width + pad * 2;
    out.height = canvas.height + pad * 2;

    const ctx = out.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out.width, out.height);

    // 1) 내용과 같은 모양의 판을 그려 그림자를 드리운다
    if (shadow) {
        ctx.save();
        ctx.shadowColor = shadow.color;
        ctx.shadowBlur = shadow.blur * s;
        ctx.shadowOffsetY = shadow.offsetY * s;
        ctx.fillStyle = '#ffffff';
        roundRectPath(ctx, pad, pad, canvas.width, canvas.height, radius);
        ctx.fill();
        ctx.restore();
    }

    // 2) 둥근 모서리로 잘라내며 내용을 얹는다
    ctx.save();
    roundRectPath(ctx, pad, pad, canvas.width, canvas.height, radius);
    ctx.clip();
    ctx.drawImage(canvas, pad, pad);
    ctx.restore();

    return out;
}

// 둥근 사각형 경로 (구형 브라우저에서도 동작하도록 arcTo로 직접 그림)
function roundRectPath(ctx, x, y, width, height, radius) {
    const r = Math.max(0, radius);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
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

    ['margin-size', 'corner-radius'].forEach(id => {
        document.getElementById(id).addEventListener('input', applyPreviewStyle);
    });
    ['shadow-on', 'preview-white'].forEach(id => {
        document.getElementById(id).addEventListener('change', applyPreviewStyle);
    });

    applyWidth();
    applyPreviewStyle();
});