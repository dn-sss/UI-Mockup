function initCanvas(canvasId, imageName) {

    let canvas = document.getElementById(canvasId);
    let ctx = canvas.getContext('2d');

    var image = new Image();
    image.onload = function (event) {
        drawCanvas(this, canvasId);
    };
    image.src = imageName;

    let overlayCanvas = document.getElementById(`${canvasId}Overlay`);
    let overlayCtx = overlayCanvas.getContext('2d');
    overlayCtx.font = '30px serif';
    overlayCtx.lineWidth = 1;
    overlayCtx.textBaseline = "bottom";
    overlayCtx.fillStyle = "red";
    overlayCtx.textAlign = "center";
    overlayCtx.fillText("overlay sample", parseInt(overlayCanvas.width / 2), parseInt(overlayCanvas.height/2));
}

function drawCanvas(image, canvasId) {

    let canvas = document.getElementById(canvasId);
    let canvasCtx = canvas.getContext('2d');

    let imageWidth = image.width;
    let imageHeight = image.height;

    canvasCtx.drawImage(image, 0, 0);
}

function processSliderInput(evt) {
    // get label
    let label = this.labels[0];
    label.firstElementChild.innerText = evt.target.value;
}