const totalPagesInPDF = IDRViewer.config.pagecount;
IDRViewer.setLayout("presentation");
IDRViewer.setZoom("fitpage");
console.log();

for (let i = 1; i <= totalPagesInPDF; i++) {
    const pageX = document.querySelector("#page" + i);

    const observer = new MutationObserver((mutationList, observerObject) => {
        mutationList.forEach(mutation => {
            if (
                mutation.type === "childList" &&
                Array.from(mutation.addedNodes).filter(node => node.id === "p" + i)
                    .length === 1
            ) {
                observerObject.disconnect();
                const pX = document.querySelector("#p" + i);
                main(pX, pageX, document.title, i);
            }
        });
    });

    observer.observe(pageX, {childList: true});
}

const main = (pX, pageX, fileId, page) => {
    console.log(`File: ${fileId}, page: ${page}`);
    const canvasElement = document.createElement("canvas");
    pageX.appendChild(canvasElement);
    const ctx = canvasElement.getContext("2d");

    let rect = pageX.getBoundingClientRect();
    let lastMouseX = 0;
    let lastMouseY = 0;
    let newMouseX = 0;
    let newMouseY = 0;
    let canvasLeftOffset = rect.left;
    let canvasTopOffset = rect.top;
    let mouseIsPressed = false;
    let pageWidth = parseInt(pageX.style.width);
    let pageHeight = parseInt(pageX.style.height);

    pX.style.opacity = "0.8";
    pX.style.cursor = "crosshair";

    new ResizeObserver(() => {
        pageWidth = parseInt(pageX.style.width);
        pageHeight = parseInt(pageX.style.height);
        rect = pageX.getBoundingClientRect();
        canvasLeftOffset = rect.left;
        canvasTopOffset = rect.top;
        canvasElement.setAttribute("width", pageWidth);
        canvasElement.setAttribute("height", pageHeight);
    }).observe(pageX);

    pageX.addEventListener("mousedown", e => {
        const rect = canvasElement.getBoundingClientRect();
        lastMouseX = e.clientX - rect.left; //x position within the element.
        lastMouseY = e.clientY - rect.top; //y position within the element.
        mouseIsPressed = true;
    });

    pageX.addEventListener("mouseup", () => {
        mouseIsPressed = false;

        console.log("======================");
        console.log(`Page size: ${pageWidth} by ${pageHeight}`);
        console.log(`${lastMouseX}x${lastMouseY} to ${newMouseX}x${newMouseY}`);
    });

    pageX.addEventListener("mousemove", e => {
        newMouseX = e.clientX - canvasLeftOffset;
        newMouseY = e.clientY - canvasTopOffset;
        if (mouseIsPressed) {
            ctx.clearRect(0, 0, canvasElement.width, canvasElement.height); //clear canvas
            ctx.beginPath();
            const width = newMouseX - lastMouseX;
            const height = newMouseY - lastMouseY;
            ctx.rect(lastMouseX, lastMouseY, width, height);
            ctx.strokeStyle = "red";
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    });
};
