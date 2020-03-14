const React = window.React;
const ReactDOM = window.ReactDOM;

const loader = <div class="lds-dual-ring"></div>;

class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fileId: null,
      tables: [],
      pagesWithWordTable: null,
      totalPages: null,
      loading: true,
      currentPage: 1,
      tablesContent: null
    };
  }

  componentDidMount() {
    const params = new URL(window.location.href).searchParams;
    const fileId = parseInt(params.get("fileId"));
    document.title = fileId;

    this.setState(() => ({ fileId }));
    this.loadItems(fileId);
  }

  async loadItems(fileId, currentPage) {
    try {
      if (!fileId) {
        fileId = this.state.fileId;
      }
      if (!currentPage) {
        currentPage = this.state.currentPage;
      }

      this.setState({ loading: true });

      const pdfInfoRes = await fetch("/api/y/getItem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fileId })
      });

      const json = await pdfInfoRes.json();

      const { tables, pdf } = json;
      const { pagesWithWordTable, totalPages, project } = pdf;

      const tablesPromises = [];
      for (const table of tables) {
        tablesPromises.push(fetch(`/y_html_tables/${table.uuid}.html`));
      }
      for (let i = 0; i < tables.length; i++) {
        const res = await tablesPromises[i];
        const html_table_text = await res.text();
        tables[i].html_table_text = html_table_text;
      }

      tables
        .sort((a, b) => a.number - b.number)
        .sort((a, b) => a.method.localeCompare(b.method))
        .sort((a, b) => a.page - b.page);

      this.setState(() => ({
        pagesWithWordTable: JSON.parse(pagesWithWordTable),
        totalPages,
        project,
        tables,
        loading: false
      }));
    } catch (error) {
      console.log(error);
    }
  }

  getTablesForCurrentPage(page) {}

  nextPrevPage(forward) {
    const { totalPages, currentPage } = this.state;
    if (
      (forward && currentPage >= totalPages) ||
      (!forward && currentPage <= 1)
    ) {
      return;
    }
    const newPage = forward ? currentPage + 1 : currentPage - 1;
    this.setState(() => ({ currentPage: newPage }));
  }

  getTablesForCurrentPage() {
    const { tables, currentPage, loading } = this.state;
    if (loading) {
      return [];
    }
    const t = tables
      .filter(table => table.page === currentPage)
      .sort((a, b) => a.number - b.number)
      .sort((a, b) => a.method.localeCompare(b.method));
    return t;
  }

  render() {
    const { fileId, tables, totalPages, loading, currentPage } = this.state;

    const tablesList = this.getTablesForCurrentPage().map(
      ({ method, number, html_table_text }) => (
        <div className="mb-3">
          <div>
            <strong>{`'${method}' - table ${number + 1}`}</strong>
          </div>
          <div
            dangerouslySetInnerHTML={{ __html: html_table_text }}
            className={`${method} table-container`}
          />
        </div>
      )
    );

    const main = (
      <div className="container-fluid">
        <div className="row">
          <div className="col">
            <strong>File ID: </strong> {fileId};{" "}
            <strong>CSVs Extracted:</strong> {tables.length};{" "}
            <strong>Page: </strong>
            {currentPage}/{totalPages}
          </div>
        </div>
        <div className="row">
          <div className="col d-flex justify-content-center">
            <button
              type="button"
              className="btn btn-outline-success m-3 "
              onClick={() => this.nextPrevPage(false)}
            >
              Previous page (LEFT)
            </button>
            <button
              type="button"
              className="btn btn-outline-success m-3 "
              onClick={() => this.nextPrevPage(true)}
            >
              Next page (RIGHT)
            </button>
          </div>
        </div>
        <div className="row">
          <div className="col-6">
            <img
              src={`/pdf_images/${fileId}/${currentPage}.jpg`}
              className="img-fluid border border-primary sticky"
            />
          </div>
          <div className="col-6 border border-primary mb-3">{tablesList}</div>
        </div>
      </div>
    );

    return loading ? loader : main;
  }
}

ReactDOM.render(<Index />, document.getElementById("root"));
