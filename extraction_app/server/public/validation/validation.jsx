const React = window.React;
const ReactDOM = window.ReactDOM;

class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      table: {}
    };
  }

  componentDidMount() {
    this.loadItem();
  }

  loadItem() {
    fetch(`/api/getValidation`)
      .then(res => res.json())
      .then(json => {
        console.log(json[0]);
        this.setState({ table: json[0] });
      });
  }

  render() {
    const { uuid, fileId, page, tableTitle } = this.state.table;
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col">
            <table className="table table-bordered table-sm">
              <tr>
                <td>Table ID</td>
                <td>{uuid}</td>
              </tr>
              <tr>
                <td>File ID</td>
                <td>{fileId}</td>
              </tr>
              <tr>
                <td>Page</td>
                <td>{page}</td>
              </tr>
              <tr>
                <td>Title</td>
                <td>{tableTitle}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Index />, document.getElementById("root"));
