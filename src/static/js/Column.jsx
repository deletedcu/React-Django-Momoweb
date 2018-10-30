var React = require('react');
var ReactDOM = require('react-dom');
var classNames = require('classnames');
// import {TransitionMotion, spring, presets} from 'react-motion';
//import FlipMove from 'react-flip-move';


var TickCell = React.createClass({
  render: function() {
    var tickClass = classNames({
      'tick': true,
      'active': this.props.ticker[3] == 1
    });

    var cellClass = classNames({
      'stocktwits': this.props.ticker[4] == 1,
      'cell': true
    });

    return (
      <div className={tickClass}>
        <div className="front">
          <div className="cell">
            <a href="#" onClick={(evt)=> this.props.onSymbolTouchTap(evt, this.props.ticker[0])}
               onTouchTap={(evt)=> this.props.onSymbolTouchTap(evt, this.props.ticker[0])}>
                    { this.props.ticker[0] }
            </a>
          </div>
          <div className="cell">{ this.props.ticker[2] }</div>
          <div className={cellClass}>{ this.props.ticker[1].toFixed(2) }</div>
        </div>
        <div className="back">
          <div className="cell">1</div>
          <div className="cell">2</div>
          <div className="cell">3</div>
        </div>
      </div>
    )
  }
});

var Column = React.createClass({
  componentDidMount: function() {
    var node = ReactDOM.findDOMNode(this);
    node.addEventListener('scroll', this._handleScroll)
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return !this.scrolling
  },
  componentWillUpdate: function() {
    // Handle scrolling
    var node = ReactDOM.findDOMNode(this);
    this.scrollHeight = node.scrollHeight;
    this.scrollTop = node.scrollTop;
  },
  componentDidUpdate: function() {
    // Handle scrolling
    var node = ReactDOM.findDOMNode(this);
    if (node.scrollTop > 2 && !this.scrolling) {
      node.scrollTop = this.scrollTop + (node.scrollHeight - this.scrollHeight);
    }
  },
  _handleScroll: function() {
    console.log('scrolling');
    this.scrolling = true;
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(this._handleScrollTimeout, 250)
  },
  _handleScrollTimeout: function() {
    this.scrolling = false;
    console.log('stop scrolling');
  },
  render: function() {
    const self = this;
    var tickers = this.props.data.map(function(ticker) {
      var key = ticker[0] + '.' + ticker[1] + '.' + ticker[2];
      return (
        <TickCell ticker={ticker} key={key} onSymbolTouchTap={self.props.onSymbolTouchTap} />
      );
    });

    var columnClass = classNames(
      'tick-column',
      this.props.type + '-column'
    );

    return (
      <div className={columnClass}>
        {tickers}
      </div>
    );
  }
});

module.exports = Column;
