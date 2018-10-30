var React = require('react');
var ReactDOM = require('react-dom');
var classNames = require('classnames');
var uuid = require('node-uuid');

var StatsBar = React.createClass({
  componentDidMount: function() {
    var node = ReactDOM.findDOMNode(this);
    this.width = node.offsetWidth;
  },
  componentWillUpdate: function() {
    var node = ReactDOM.findDOMNode(this);
    this.width = node.offsetWidth - 80;
  },
  render: function() {
    var statClass = classNames(
      'statsbar',
      this.props.type
    );

    var data = this.props.data;
    var total = Math.ceil(this.width / 13);
    var divs = [];

    for (var i = data.length - 1; i >= 0; i--) {
      var carres = [];
      var value = data[i] == -1 ? 0 : data[i];

      if(this.props.type == 'lows') {
        if(value <= 0) {
          value = Math.abs(value);
        } else {
          value = 1 - value;
        }
      } else {
        if(value < 0) {
          value = value + 1;
        }
      }

      for (var o = total; o >= 0; o--) {
        var mult = this.props.type == 'lows' ? Math.ceil(total*value) : Math.floor(total*value)
        var active = mult >= o && value !=0;

        var carreClass = classNames('petitCarre', {
          'active': active
        });
        carres.push((
          <span className={carreClass} key={o}></span>
        ));
      }
      if(this.props.type == 'highs') {
        carres = carres.reverse();
      }
      divs.push(
        <div className="carreContainer" key={i}>{carres}</div>
      );
    }

    return (
        <div className={statClass}>
          {divs.reverse()}
        </div>
    )
  }
});

module.exports = StatsBar;
