React = window.React;
ReactDOM = window.ReactDOM;

IDRViewer.on('ready', function (data) {
    console.log("ready " + data.page);
});

class Index extends React.Component {
    constructor(props) {
        super(props);
        this.state = {page: "loading..."};
    }

    componentDidMount() {
        IDRViewer.setLayout("presentation");
        IDRViewer.setZoom("fitpage");
        document.body.classList.remove("light-theme");
        document.body.classList.add("dark-theme");
        const ids = ["viewBtn", "btnZoomIn", "btnZoomOut", "btnSelect", "btnMove", "btnFullScreen", "btnThemeToggle", "zoomBtn"];
        ids.forEach(id => {
            const elem = document.getElementById(id);
            elem.parentNode.removeChild(elem);
        });


        IDRViewer.on('pageload', ({page}) => {
                const fileId = document.title;
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

                    console.log(`File ${fileId}, Page ${page}, PageWidth: ${pageWidth}, PageHeight: ${pageHeight},` +
                        ` x1: ${lastMouseX}, y1: ${pageHeight - lastMouseY}, x2: ${newMouseX}, y2: ${pageHeight - newMouseY}`);
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

        IDRViewer.on('pagechange', data => {
            this.changePage(data.page);
        });

        this.changePage();
    }

    changePage(page) {
        this.setState(() => ({page: page || new URLSearchParams(window.location.search).get("page")}))
    }

    render() {
        const {page} = this.state;

        return (
            <div>
                <p>{page}</p>
            </div>
        );
    }
}

ReactDOM.render(
    <Index/>,
    document.getElementById('root')
);
