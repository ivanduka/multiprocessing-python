const React = window.React;
const ReactDOM = window.ReactDOM;

class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {}

  render() {
    return <div>Success!</div>;
  }
}

ReactDOM.render(<Index />, document.getElementById("root"));
