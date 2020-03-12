const React = window.React;
const ReactDOM = window.ReactDOM;

const loader = <div class="lds-dual-ring"></div>;

class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fileId: null,
      tables: null,
      pagesWithWordTable: null,
      totalPages: null,
      loading: true,
      currentPage: 1
    };
  }

  componentDidMount() {
    const params = new URL(window.location.href).searchParams;
    const fileId = parseInt(params.get("fileId"));
    const currentPage = parseInt(params.get("currentPage"));
    document.title = fileId;

    this.setState(() => ({ fileId, currentPage: currentPage || 1 }));
    this.loadItems(fileId, currentPage);

    document.addEventListener(
      "visibilitychange",
      () => {
        if (!document.hidden) {
          this.loadItems();
        }
      },
      false
    );
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
    this.setState(() => ({ currentPage: newPage }));
  }

  nextPrevTable(forward) {
    console.log(forward ? "next table" : "prev table");
  }

  render() {
    const {
      fileId,
      tables,
      pagesWithWordTable,
      totalPages,
      loading,
      currentPage
    } = this.state;

    // const inlineTable =
    //   html_table !== "" ? (
    //     <div dangerouslySetInnerHTML={{ __html: html_table }} />
    //   ) : null;

    const main = (
      <div className="container-fluid">
        <div className="row">
          <div className="col">
            <strong>File ID: </strong> {fileId}; <strong>Page: </strong>
            {currentPage}/{totalPages}
          </div>
        </div>
        <div className="row">
          <div className="col d-flex justify-content-center">
            <button
              type="button"
              className="btn btn-outline-success m-3 "
              onClick={() => this.nextPrevTable(false)}
            >
              Previous "table" (UP)
            </button>
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
            <button
              type="button"
              className="btn btn-outline-success m-3 "
              onClick={() => this.nextPrevTable(true)}
            >
              Next "table" (DOWN)
            </button>
          </div>
        </div>
        <div className="row">
          <div className="col image-border">
            <img src={`/pdf_images/${fileId}/${currentPage}.jpg`} className="img-fluid" />
          </div>
          <div className="col">{null}</div>
        </div>
      </div>
    );

    return loading ? loader : main;
  }
}

ReactDOM.render(<Index />, document.getElementById("root"));
