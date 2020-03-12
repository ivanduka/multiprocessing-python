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
      loading: true
    };
  }

  componentDidMount() {
    const fileId = parseInt(
      new URL(window.location.href).searchParams.get("fileId")
    );
    document.title = fileId;
    this.setState(() => ({ fileId }));
    this.loadItems(fileId);

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

  async loadItems(fileId) {
    try {
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

      this.setState({
        pagesWithWordTable: JSON.parse(pagesWithWordTable),
        totalPages,
        tables,
        loading: false
      });
    } catch (error) {
      console.log(error);
    }
  }

  render() {
    const {
      fileId,
      tables,
      pagesWithWordTable,
      totalPages,
      loading
    } = this.state;

    const main = <div>Hello World!</div>;

    return loading ? loader : main;
  }
}

ReactDOM.render(<Index />, document.getElementById("root"));
