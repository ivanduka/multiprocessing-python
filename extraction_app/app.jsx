const React = window.React;
const ReactDOM = window.ReactDOM;
const ResizeObserver = window.ResizeObserver;

IDRViewer.on('ready', function (data) {
    console.log("ready " + data.page);
});

class Index extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            page: 0,
            tableTitle: "",
            fileId: document.title,
            x1: -1,
            y1: -1,
            x2: -1,
            y2: -1,
            pageWidth: -1,
            pageHeight: -1,
        };
    }

    componentDidMount() {
        IDRViewer.setLayout("presentation");
        IDRViewer.setZoom("fitpage");
        document.body.classList.remove("light-theme");
        document.body.classList.add("dark-theme");
        const ids = ["viewBtn", "btnSideToggle", "btnZoomIn", "btnZoomOut", "btnSelect",
            "btnMove", "btnFullScreen", "btnThemeToggle", "zoomBtn"];
        ids.forEach(id => {
            const elem = document.getElementById(id);
            elem.parentNode.removeChild(elem);
        });


        IDRViewer.on('pageload', ({page}) => {
                const pageX = document.querySelector("#page" + page);
                const pX = document.querySelector("#p" + page);

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

                pX.style.opacity = "0.75";
                // pX.style.cursor = "crosshair";

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

                    this.setState(() => ({
                        page,
                        x1: lastMouseX,
                        y1: pageHeight - lastMouseY,
                        x2: newMouseX,
                        y2: pageHeight - newMouseY,
                        pageWidth,
                        pageHeight,
                    }));
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
            }
        );

        IDRViewer.on('pagechange', ({page}) => {
            this.changePage(page);
            const canvasElement = document.querySelector(`#page${page} > canvas`);
            if (canvasElement) {
                const ctx = canvasElement.getContext("2d");
                ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            }
            this.setState(() => ({
                tableTitle: "",
                x1: -1,
                x2: -1,
                y1: -1,
                y2: -1,
                pageHeight: -1,
                pageWidth: -1,
            }))
        });

        document.addEventListener('copy', (event) => {
            const tableTitle = window.getSelection().toString();
            this.setState(() => ({
                tableTitle,
                x1: -1,
                x2: -1,
                y1: -1,
                y2: -1,
                pageHeight: -1,
                pageWidth: -1,
            }));
            event.preventDefault();
        });

        this.changePage();
    }

    changePage(page) {
        this.setState(() => ({page: page || new URLSearchParams(window.location.search).get("page")}))
    }

    render() {
        const {page, tableTitle, fileId, x1, x2, y1, y2, pageHeight, pageWidth} = this.state;

        return (
            <div>
                <p>File ID: {fileId}</p>
                <p>Page: {page}</p>
                <p>Table Title: {tableTitle}</p>
                <p>x1: {x1}</p>
                <p>y1: {y1}</p>
                <p>x2: {x2}</p>
                <p>y2: {y2}</p>
                <p>Page Height: {pageHeight}</p>
                <p>Page Width: {pageWidth}</p>
            </div>
        );
    }
}

ReactDOM.render(<Index/>, document.getElementById('root'));
