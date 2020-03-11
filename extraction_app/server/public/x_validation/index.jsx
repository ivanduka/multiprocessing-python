const React = window.React;
const ReactDOM = window.ReactDOM;

class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pdfs: [],
      extraPdfs: []
    };
  }

  componentDidMount() {
    this.loadItems();

    document.addEventListener(
      "visibilitychange",
      () => this.handleVisibilityChange(),
      false
    );
  }

  loadItems() {
    fetch(`/api/x/getAll`)
      .then(res => res.json())
      .then(({ extraneousPDFs, pdfs }) => {
        const extraPdfs = extraneousPDFs.map(x => x.fileId);
        this.setState({ extraPdfs, pdfs });
      });
  }

  handleVisibilityChange() {
    if (!document.hidden) {
      this.loadItems();
    }
  }

  render() {
    const { pdfs, extraPdfs } = this.state;

    const isExtra = id =>
      extraPdfs.includes(id) ? (
        <td className="text-danger">{id}</td>
      ) : (
        <td>
          <a href={"/x_validation/validate?fileId=" + id} target="_blank">
            {id}
          </a>
        </td>
      );

    const ration = (passed, failed) =>
      failed === 0 ? "∞" : Math.round(passed / failed, 2);

    const rows = pdfs.map(
      ({ project, fileId, total_tables, passed, failed, not_processed }) => (
        <tr>
          <td>{project}</td>
          {isExtra(fileId)}
          <td>{total_tables}</td>
          <td className="text-success">{passed}</td>
          <td className="text-danger">{failed}</td>
          <td>{not_processed}</td>
          <td>{ration(passed, failed)}</td>
        </tr>
      )
    );

    return (
      <div className="container">
        <div className="row">
          <div className="col m-2">
            <button
              id="refresh"
              className="btn btn-outline-success mr-2"
              onClick={() => this.loadItems()}
            >
              Refresh Data
            </button>
          </div>
        </div>
        <div className="row">
          <div className="col m-2">
            <table className="table table-striped table-bordered">
              <thead className="thead-dark">
                <tr>
                  <th scope="col">Project</th>
                  <th scope="col">PDF ID</th>
                  <th scope="col">Total CSVs</th>
                  <th scope="col">Passed</th>
                  <th scope="col">Failed</th>
                  <th scope="col">Not yet processed</th>
                  <th scope="col">Passed/Total</th>
                </tr>
              </thead>
              <tbody>{rows}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Index />, document.getElementById("root"));
