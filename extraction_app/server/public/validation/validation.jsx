const React = window.React;
const ReactDOM = window.ReactDOM;

class Index extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            haveWork: true,
            table: {},
            html_table: ""
        };
    }

    componentDidMount() {
        this.loadItem();
    }

    loadItem() {
        fetch(`/api/getValidation`)
            .then(res => res.json())
            .then(([table]) => {
                if (table) {
                    fetch(`/html_tables/${table.uuid}.html`)
                        .then(res => res.text())
                        .then(html_table => {
                            this.setState({table, html_table});
                        });
                } else {
                    this.setState({haveWork: false});
                }
            });
    }

    setItem(result) {
        const {uuid} = this.state.table;
        fetch(`/api/setValidation`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({uuid, result})
        }).then(() => {
            this.loadItem();
        });
    }

    render() {
        const {html_table, haveWork, table} = this.state;
        const {uuid, fileId, page, tableTitle} = table;

        const img = uuid ? (
            <img src={`/jpg_tables/${uuid}.jpg`} className="img-fluid"/>
        ) : null;

        const inlineTable =
            html_table !== "" ? (
                <div dangerouslySetInnerHTML={{__html: html_table}}/>
            ) : null;

        const topButtons = refresh => (
            <div>
                <a href="/" className="btn btn-secondary m-1">
                    Go back to table identification
                </a>
                {refresh ? (
                    <a href="/validation" className="btn btn-info m-2">
                        Refresh the results
                    </a>
                ) : null}
            </div>
        );

        const mainPage = (
            <div className="container-fluid">
                <div className="row">
                    <div className="col">
                        {topButtons()}
                        <p>
                            <strong>Table ID: </strong>
                            {uuid}; <strong>File ID: </strong> {fileId};{" "}
                            <strong>Page: </strong> {page}
                        </p>
                        <p>
                            <strong>Table Title: </strong>
                            {tableTitle}
                        </p>
                    </div>
                </div>
                <div className="row">
                    <div className="col d-flex justify-content-center">
                        <button
                            type="button"
                            className="btn btn-outline-success m-3 "
                            onClick={() => this.setItem("pass")}
                        >
                            Pass
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-danger m-3 "
                            onClick={() => this.setItem("fail")}
                        >
                            Fail
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-info m-3"
                            onClick={() => this.loadItem()}
                        >
                            Skip for now
                        </button>
                    </div>
                </div>
                <div className="row">
                    <div className="col">{img}</div>
                    <div className="col">{inlineTable}</div>
                </div>
            </div>
        );

        const fallBack = (
            <div className="container-fluid">
                {topButtons(true)}
                <p>No items to validate for now. Refresh the page to check for more!</p>
            </div>
        );

        return haveWork ? mainPage : fallBack;
    }
}

ReactDOM.render(<Index/>, document.getElementById("root"));
