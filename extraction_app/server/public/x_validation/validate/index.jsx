const React = window.React;
const ReactDOM = window.ReactDOM;

class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fileId: null,
      tables: []
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
      () => this.handleVisibilityChange(),
      false
    );
  }

  async loadItems(fileId) {
    try {
      const pdfInfoRes = await fetch("/api/x/getValidation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fileId })
      });

      const pdf = await pdfInfoRes.json();

      const { pagesWithWordTable, totalPages } = pdf.pdf[0];
      const tables = pdf.tables;

      this.setState({
        pagesWithWordTable: JSON.parse(pagesWithWordTable),
        totalPages,
        tables
      });
    } catch (error) {
      console.log(error);
    }
  }

  handleVisibilityChange() {
    if (!document.hidden) {
      this.loadItems();
    }
  }

  render() {
    return <div>Hello World!</div>;
  }
}

ReactDOM.render(<Index />, document.getElementById("root"));
