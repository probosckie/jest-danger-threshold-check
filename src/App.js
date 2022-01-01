import React from 'react';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      some: 1,
      some2: 'abc',
    };
  }
  handleClick = () => {
    this.setState({
      some2: 1,
    });
  };
  render() {
    return (
      <>
        <button onClick={this.handleClick}>Click me{this.state.some2}</button>
        <span>{this.state.some}</span>
      </>
    );
  }
}

export default App;
