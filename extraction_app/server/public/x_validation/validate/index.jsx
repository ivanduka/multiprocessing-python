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
      tablesContent: null,
      imageLoaded: false,
      settingStatus: false
    };
  }

  componentDidMount() {
    const params = new URL(window.location.href).searchParams;
    const fileId = parseInt(params.get("fileId"));
    const currentPage = parseInt(params.get("currentPage"));
    document.title = "X: " + fileId;

    this.setState(() => ({ fileId, currentPage: currentPage || 1 }));
    this.loadItems(fileId);
  }

  async loadItems(fileId) {
    try {
      if (!fileId) {
        fileId = this.state.fileId;
      }

      this.setState({ loading: true });

      const pdfInfoRes = await fetch("/api/x/getValidation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fileId })
      });

      const pdf = await pdfInfoRes.json();

      const { pagesWithWordTable, totalPages } = pdf.pdf[0];
      const { tables } = pdf;

      for (const table of tables) {
        const res = await fetch(`/x_html_tables/${table.html_name}.html`);
        const html_table_text = await res.text();
        table.html_table_text = html_table_text;
      }

      this.setState(() => ({
        pagesWithWordTable: JSON.parse(pagesWithWordTable),
        totalPages,
        tables,
        loading: false
      }));
    } catch (error) {
      console.log(error);
    }
  }

  imageOnLoad = () => {
    this.setState({ imageLoaded: true });
  };

  getTablesForCurrentPage(page) {}

  nextPrevPage(forward) {
    const { totalPages, currentPage, fileId } = this.state;
    if (
      (forward && currentPage >= totalPages) ||
      (!forward && currentPage <= 1)
    ) {
      return;
    }
    const newPage = forward ? currentPage + 1 : currentPage - 1;
    this.setState(() => ({ currentPage: newPage, imageLoaded: false }));
  }

  nextPrevTable(forward) {
    console.log(forward ? "next table" : "prev table");
  }

  getTablesForCurrentPage() {
    const { tables, currentPage, loading } = this.state;
    if (loading) {
      return [];
    }
    const t = tables
      .filter(table => table.page === currentPage)
      .sort((a, b) => a.tableNumber - b.tableNumber);
    return t;
  }

  setResult = async (result, csvName) => {
    this.setState({ settingStatus: true });

    const res = await fetch("/api/x/setValidation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ result, csvName })
    });

    if (res.status !== 200) {
      console.log(res);
      return alert(status);
    }

    this.setState(({ tables }) => {
      const table = tables.find(t => t.csvName === csvName);
      table.result = result;
      return { tables, settingStatus: false };
    });
  };

  render() {
    const {
      fileId,
      tables,
      imageLoaded,
      totalPages,
      loading,
      currentPage,
      settingStatus
    } = this.state;

    const tablesList = this.getTablesForCurrentPage().map(
      ({ tableName, html_table_text, result, csvName }) => (
        <div
          className={"mb-5 " + result}
          style={settingStatus ? { visibility: "hidden" } : {}}
        >
          <div className="mb-2">
            <div>
              <strong>{tableName || "[NO TABLE NAME]"}</strong>
            </div>
            <button
              className="btn btn-primary m-1"
              onClick={() => this.setResult("pass", csvName)}
            >
              Pass
            </button>
            <button
              className="btn btn-danger m-1"
              onClick={() => this.setResult("fail", csvName)}
            >
              Fail
            </button>
            <button
              className="btn btn-warning m-1"
              onClick={() => this.setResult("", csvName)}
            >
              Unset
            </button>
            Current status: {result || "not set"}
          </div>
          <div dangerouslySetInnerHTML={{ __html: html_table_text }} />
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
            {/* <button
              type="button"
              className="btn btn-outline-success m-3 "
              onClick={() => this.nextPrevTable(false)}
            >
              Previous "table" (UP)
            </button> */}
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
            {/* <button
              type="button"
              className="btn btn-outline-success m-3 "
              onClick={() => this.nextPrevTable(true)}
            >
              Next "table" (DOWN)
            </button> */}
          </div>
        </div>
        <div className="row">
          <div className="col-6">
            <img
              src={`/pdf_images/${fileId}/${currentPage}.jpg`}
              className="img-fluid border border-dark sticky"
              style={imageLoaded ? {} : { visibility: "hidden" }}
              onLoad={this.imageOnLoad}
            />
          </div>
          <div className="col-6 border border-dark">{tablesList}</div>
        </div>
      </div>
    );

    return loading ? loader : main;
  }
}

ReactDOM.render(<Index />, document.getElementById("root"));
