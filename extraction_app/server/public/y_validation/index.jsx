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
        console.log(pdfs)
        this.setState({ pdfs, loading: false });
      });
  }

  render() {
    const { pdfs, loading } = this.state;

    const rows = pdfs.map(({ fileId, totalPages }) => (
      <tr>
        <td>{fileId}</td>
        <td>{totalPages}</td>
      </tr>
    ));

    const table = (
      <div className="row">
        <div className="col m-2">
          <table className="table table-striped table-bordered  table-dark">
            <thead className="thead-dark">
              <tr>
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
