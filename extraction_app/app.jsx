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
};

const listTables = tables => tables.map(table => {
        const {tableTitle, page, uuid, x1, x2, y1, y2} = table;

        return <div className="small-bottom-margin">
            <p className="no-margin"><strong>{tableTitle}</strong></p>
            <p className="no-margin">Page: <strong>{page}</strong></p>
            <p className="no-margin">UUID: {uuid}</p>
            <p className="no-margin">{x1}x{y1} => {x2}x{y2} (size {Math.round(x2 - x1)}x{Math.round(y1 - y2)})</p>
            {table.continuationOf ? <p className="no-margin">Cont.of: {table.continuationOf}</p> : null}
            <hr/>
        </div>
    }
)

class Index extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            uuid: uuid(),
            page: null,
            tableTitle: null,
            fileId: parseInt(document.title),
            x1: null,
            y1: null,
            x2: null,
            y2: null,
            pageWidth: null,
            pageHeight: null,
            continuationOf: null,
            tables: [],
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
                    this.clearRectangle();
                    const rect = canvasElement.getBoundingClientRect();
                    lastMouseX = e.clientX - rect.left;
                    lastMouseY = e.clientY - rect.top;
                    mouseIsPressed = true;
                });

                pageX.addEventListener("mouseup", () => {
                    mouseIsPressed = false;
                    if (lastMouseX === newMouseX && lastMouseY === newMouseY) {
                        this.clearRectangle();
                    } else {
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
                    }
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
            this.loadPrevTables();
            this.changePage(page);
            this.setState(() => ({tableTitle: null}));
            this.clearRectangle();
        });

        document.addEventListener('copy', (event) => {
            const tableTitle = window.getSelection().toString();
            this.setState(() => ({tableTitle}));
            this.clearRectangle();
        });

        this.changePage();
        this.loadPrevTables();
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

    loadPrevTables() {
        fetch(`http://localhost:3000/api/get`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({fileId: this.state.fileId}),
        })
            .then(res => res.json())
            .then(json => {
                console.log(json.results);
                this.setState({tables: json.results});
            });
    }

    changePage(page) {
        this.setState(() => ({page: page || new URLSearchParams(window.location.search).get("page")}))
    }

    handleSave() {
        const {uuid, page, tableTitle, fileId, x1, x2, y1, y2, pageHeight, pageWidth} = this.state;

        if (uuid && page && tableTitle && fileId && x1) {
            fetch(`http://localhost:3000/api/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({uuid, fileId, page, x1, x2, y1, y2, pageHeight, pageWidth, tableTitle,}),
            })
                .then(res => res.json())
                .then(json => {
                    console.log(json);
                    this.loadPrevTables();
                });
        } else {
            alert("Copy title and select an area")
        }
    }

    render() {
        const {tables, page, tableTitle, fileId, x1, x2, y1, y2, pageHeight, pageWidth} = this.state;
        const coordinates = x1 ? `${parseInt(x1)}:${parseInt(y1)} => ${parseInt(x2)}:${parseInt(y2)}` : "NOT SET";
        const title = tableTitle ? tableTitle : "NOT COPIED";

        return (
            <div>
                <p>File ID: {fileId}, Page: {page}</p>
                <p>Table Title: <strong>{title}</strong></p>
                <p>Coordinates: <strong>{coordinates}</strong></p>
                {x1 ? <p>Page Width x Height: <strong>{pageWidth}x{pageHeight}</strong></p> : null}
                <button onClick={() => this.handleSave()}>Save</button>
                <hr/>
                {listTables(tables)}
            </div>

        );
    }
}

ReactDOM.render(<Index/>, document.getElementById('root'));
