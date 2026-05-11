function updatePreview() {
    const htmlCode = document.getElementById('html-input').value;
    const cssCode = document.getElementById('css-input').value;
    
    document.getElementById('capture-area').innerHTML = htmlCode;
    document.getElementById('dynamic-style').innerHTML = cssCode;
}

function saveAsPng() {
    const target = document.getElementById('capture-area');
    
    html2canvas(target, {
        useCORS: true,
        backgroundColor: null,
        scale: 2
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'layout-preview.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}