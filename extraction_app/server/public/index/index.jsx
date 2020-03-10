const React = window.React;
const ReactDOM = window.ReactDOM;

class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: []
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
    fetch(`/api/getIndex`)
      .then(res => res.json())
      .then(({ items }) => {
        this.setState({ items });
      });
  }

  handleVisibilityChange() {
    if (!document.hidden) {
      this.loadItems();
    }
  }

  render() {
    const { items } = this.state;

    const rows = items.map(item => (
      <tr>
        <td>
          <a href={"/" + item.id} target="_blank">
            {item.id}
          </a>
        </td>
        <td>{item.count}</td>
      </tr>
    ));

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
            <a
              href="/validation"
              className="btn btn-outline-info"
              role="button"
              target="_blank"
            >
              Go to validation page
            </a>
          </div>
        </div>
        <div className="row">
          <div className="col m-2">
            <table className="table table-bordered table-striped">
              <thead className="thead-dark">
                <tr>
                  <th>PDF ID</th>
                  <th>Tables Identified</th>
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
