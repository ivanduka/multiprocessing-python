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
        })


        IDRViewer.on('pageload', data => {
                // console.log("loaded page " + data.page);
            }
        );

        IDRViewer.on('pagechange', data => {
            this.changePage();
        });

        this.changePage();
    }

    changePage() {
        const page = new URLSearchParams(window.location.search).get("page");
        console.log('Page is', page);
        this.setState(() => ({page: page}))
    }

    render() {
        const {page} = this.state

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
