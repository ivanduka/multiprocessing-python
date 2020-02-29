const React = window.React;
const ReactDOM = window.ReactDOM;
const ResizeObserver = window.ResizeObserver;

const uuid = () => ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
);

const cleanUpUI = () => {
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
}

class Index extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            uuid: uuid(),
            page: null,
            tableTitle: null,
            fileId: document.title,
            x1: null,
            y1: null,
            x2: null,
            y2: null,
            pageWidth: null,
            pageHeight: null,
            continuationOf: null,
            previousTables: [],
        };
    }


    componentDidMount() {
        cleanUpUI();

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
                    lastMouseX = e.clientX - rect.left;
                    lastMouseY = e.clientY - rect.top;
                    mouseIsPressed = true;
                });

                pageX.addEventListener("mouseup", () => {
                    mouseIsPressed = false;

                    this.setState(() => ({
                        uuid: uuid(),
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
                        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
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
            this.setState(() => ({tableTitle: null}))
            this.clearRectangle();
        });

        document.addEventListener('copy', (event) => {
            const tableTitle = window.getSelection().toString();
            this.setState(() => ({tableTitle}));
            this.clearRectangle();
            event.preventDefault();
        });

        this.changePage();
    }

    clearRectangle() {
        const canvasElement = document.querySelector(`#page${this.state.page} > canvas`);
        if (canvasElement) {
            const ctx = canvasElement.getContext("2d");
            ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        }
        this.setState(() => ({
            uuid: uuid(),
            x1: null,
            x2: null,
            y1: null,
            y2: null,
            pageHeight: null,
            pageWidth: null,
        }));
    }

    loadPrevTables(page) {
        fetch(`http://localhost/api`)
            .then(res => res.json())
            .then(json => this.setState({previousTables: json}));
    }

    changePage(page) {
        this.setState(() => ({page: page || new URLSearchParams(window.location.search).get("page")}))
    }

    render() {
        const {uuid, page, tableTitle, fileId, x1, x2, y1, y2, pageHeight, pageWidth} = this.state;

        return (
            <div>
                <p>UUID: {uuid}</p>
                <p>File ID: {fileId}</p>
                <p>Page: {page}</p>
                <p>Table Title: {tableTitle}</p>
                <p>x1: {x1}</p>
                <p>y1: {y1}</p>
                <p>x2: {x2}</p>
                <p>y2: {y2}</p>
                <p>Page Width x Height: {pageWidth ? `${pageWidth} x ${pageHeight}` : null}</p>
                <button onClick={() => console.log('whatever!')}>Save</button>
                <hr/>
            </div>

        );
    }
}

ReactDOM.render(<Index/>, document.getElementById('root'));
