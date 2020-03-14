const React = window.React;
const ReactDOM = window.ReactDOM;

const loader = <div class="lds-dual-ring"></div>;

class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pdfs: [],
      loading: true
    };
  }

  componentDidMount() {
    this.loadItems();
  }

  loadItems() {
    this.setState({ loading: true });
    fetch(`/api/y/getAll`)
      .then(res => res.json())
      .then(pdfs => {
        pdfs.sort((x, y) => {
          const a = x.project;
          const b = y.project;
          if (a === b) return 0;
          else if (a === null) return 1;
          else if (b === null) return -1;
          else return a.localeCompare(b);
        });
        this.setState({ pdfs, loading: false });
      });
  }

  render() {
    const { pdfs, loading } = this.state;

    const rows = pdfs.map(({ fileId, totalPages, project }, index) => (
      <tr>
        <td>{project}</td>
        <td>{index + 1}</td>
        <td>
          <a href={"/y_validation/validate?fileId=" + fileId} target="_blank">
            {fileId}
          </a>
        </td>
        <td>{totalPages}</td>
      </tr>
    ));

    const table = (
      <div className="row">
        <div className="col m-2">
          <table className="table table-striped table-bordered table-dark table-sm table-fit">
            <thead className="thead-dark">
              <tr>
                <th>#</th>
                <th>Project</th>
                <th scope="col">PDF ID</th>
                <th scope="col">Total pages</th>
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </table>
        </div>
      </div>
    );

    const data = loading ? loader : table;

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
        {data}
      </div>
    );
  }
}

ReactDOM.render(<Index />, document.getElementById("root"));
