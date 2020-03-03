const React = window.React;
const ReactDOM = window.ReactDOM;

class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
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
        fetch(`/html_tables/${table.uuid}.html`)
          .then(res => res.text())
          .then(html_table => {
            console.log(html_table);
            this.setState({ table, html_table });
          });
      });
  }

  render() {
    const { uuid, fileId, page, tableTitle } = this.state.table;

    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col">
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
          <div className="col">
            <img src={`/jpg_tables/${uuid}.jpg`} className="img-fluid" />
          </div>
          <div className="col">
            <div dangerouslySetInnerHTML={{ __html: this.state.html_table }} />
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Index />, document.getElementById("root"));
