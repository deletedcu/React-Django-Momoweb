import injectTapEventPlugin from 'react-tap-event-plugin';

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

var React = require('react');
var ReactDOM = require('react-dom');
var Column = require('./Column.jsx');
var StatsBar = require('./StatsBar.jsx');
var classNames = require('classnames');

var myTheme=require('./theme');
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import NavBarBottom from './NavBar';
import Popover from 'material-ui/Popover';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';


function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

var App = React.createClass({
  componentDidMount: function() {
    this.socket = io('https://momoweb.mometic.com/', {secure: true});
    this.socket.on('compressedUpdate', this._handleData);
    this.socket.emit('subscribe', 'basic-industries');
    this.socket.emit('subscribe', 'capital-goods');
    this.socket.emit('subscribe', 'consumer-goods');
    this.socket.emit('subscribe', 'consumer-services');
    this.socket.emit('subscribe', 'energy');
    this.socket.emit('subscribe', 'finance');
    this.socket.emit('subscribe', 'health-care');
    this.socket.emit('subscribe', 'public-utilities');
    this.socket.emit('subscribe', 'technology');
    this.socket.emit('subscribe', 'transportation');
    this.socket.emit('subscribe', 'miscellaneous');
    this._updateStatusBar()
    this.buffer = [];
    this.flushBufferIntervalId = setInterval(this.flushBuffer, 2000);
  },
    componentWillUnmount() {
        if (this.flushBufferIntervalId) {
            console.log('clearInterval for flushBufferIntervalId');
            clearInterval(this.flushBufferIntervalId);
        }
    },
  getSocket: function() {
    return this.socket;
  },
  _updateStatusBar: function(bars) {
    bars = bars ? bars : [
        getRandomArbitrary(-1, 1),
        getRandomArbitrary(-1, 1),
        getRandomArbitrary(-1, 1)
    ];
    this.setState({
      bars: bars
    });
  },
  getInitialState: function() {
    var filter = {
          category: [
            {name: 'Basic industries',value: 'basic-industries',subscribed: true},
            {name: 'Capital goods', value: 'capital-goods',subscribed: true},
            {name: 'Consumer goods',value: 'consumer-goods',subscribed: true},
            {name: 'Consumer services',value: 'consumer-services',subscribed: true},
            {name: 'Energy',value: 'energy',subscribed: true},
            {name: 'Finance',value: 'finance',subscribed: true},
            {name: 'Health Care',value: 'health-care',subscribed: true},
            {name: 'Public utilities',value: 'public-utilities',subscribed: true},
            {name: 'Technology',value: 'technology',subscribed: true},
            {name: 'Transportation',value: 'transportation',subscribed: true}
          ],
          price: [
            {name: '0 - 2', value: {from: 0, to: 2}, subscribed: true},
            {name: '2 - 5', value: {from: 2, to: 5}, subscribed: true},
            {name: '5 - 10', value: {from: 5, to: 10}, subscribed: true},
            {name: '10 - 20', value: {from: 10, to: 20}, subscribed: true},
            {name: '20 - 50', value: {from: 20, to: 50}, subscribed: true},
            {name: '50 - 100', value: {from: 50, to: 100}, subscribed: true},
            {name: '100 - 200', value: {from: 100, to: 200}, subscribed: true},
            {name: '200 - 500', value: {from: 200, to: 500}, subscribed: true},
            {name: ' > 500', value: {from: 500, to: -1}, subscribed: true}
          ]
    };
    var data_filter = localStorage.getItem('filter');
    if (data_filter) {
        try {
            var cached_filter = JSON.parse(data_filter);
            ['category', 'price'].forEach(function(cat) {
                filter[cat].forEach(function(item, i, arr) {
                    if (item.subscribed != cached_filter[cat][i].subscribed) {
                        arr[i].subscribed = cached_filter[cat][i].subscribed;
                    }
                });
            });
        } catch(e) {
            console.error(e);
        }
    }

    return {
      highs: [],
      lows: [],
      bars: [1, 0.6, -1],
      filter: filter,
      popoverOpened: false
    };
  },

  _handleData: function(data) {
    var msg = data[0];
    var highs = msg[1];
    var lows = msg[2];

    if ('DISABLED' in window) {
        return false;
    }

    try {
        this._updateStatusBar([
            msg[0][1], // dow
            msg[0][0], // nasdaq
            msg[0][2], // spy
        ]);
    } catch(e) {
        console.error(e);
    }



    lows = this.applyPriceFilter(lows);
    highs = this.applyPriceFilter(highs);
    if (lows.length + highs.length > 0) {
        if(this.buffer.length > 200) {
            this.buffer = [];
            console.error('Buffer too big, truncating');
        }
        this.buffer.push({'highs': highs, 'lows': lows});
    }
  },

  flushBuffer() {
      if (this.state.freezed) {
        console.log('Flush buffer freezed');
        return false;
      }
      if (!this.buffer.length) {
        return false;
      }
      console.log('flush buffer');
      let highs = this.state.highs.slice();
      let lows = this.state.lows.slice();
      this.buffer.forEach(function(item, i, arr) {
            highs = item.highs.concat(highs).slice(0, 100);
            lows = item.lows.concat(lows).slice(0, 100);
      });
      this.buffer = [];
      this.setState({
          lows: lows,
          highs: highs
      });
  },

  applyPriceFilter: function(data) {
    var self = this;
    data.forEach(function(item, i, arr) {
        var price = item[1];
        var skip = true;
        self.state.filter.price.forEach(function(row, row_i, filter_price) {
            if (row.subscribed && price >= row.value.from && (price < row.value.to || row.value.to < 0)) {
                skip = false;
            }
        });
        if (skip) {
            arr.splice(i, 1);
            console.log('skip item with price', price, item);
        }
    });
    return data;
  },

  onFilterChanged: function(fgroup, fname, fval) {
    console.log('onFilterChanged', fgroup, fname, fval);
    if (!(fgroup in this.state.filter)) {
        console.error('Cant change filter, group not found', fgroup);
        return false;
    }
    var subscription;
    this.state.filter[fgroup].forEach(function(item, i, arr) {
        if (item.name == fname) {
            arr[i].subscribed = fval;
            subscription=arr[i];
            console.log('update item', item);
        }
    });

    localStorage.setItem('filter', JSON.stringify(this.state.filter));

    if (fgroup == 'category') {
        var action = fval ? 'subscribe' : 'unsubscribe';
        this.socket.emit(action, subscription);
    }
  },

    onSymbolTouchTap: function (event, symbol) {
        event.preventDefault();
        this.setState({
          popoverOpened: true,
          anchorEl: event.currentTarget,
          symbol: symbol,
          freezed: true
        });

        setTimeout(() => this.setState({freezed: false}), 4000);
    },

    handleRequestClosePopover: function() {
        this.setState({
            popoverOpened: false,
            freezed: false
        });
    },

    onMenuItemTouchTap: function(evt, menuItem, index) {
        let link = '/stock/' + menuItem.props.value + '/' + this.state.symbol + '/';
        this.handleRequestClosePopover();
        window.open(link,'_blank');
    },

  render: function() {
    return (
      <div className="app-container">
        <div className="main-screen">
          <header>
            <StatsBar data={this.state.bars} type="lows" />
            <div className='logo'>
                <h1>MOMO</h1>
                <h2>PROFIT FROM MOMENTUM</h2>
            </div>
            <StatsBar data={this.state.bars} type="highs" />
            <div className="cf"></div>
          </header>
          <Column data={this.state.lows} type="lows" onSymbolTouchTap={this.onSymbolTouchTap} />
          <Column data={this.state.highs} type="highs" onSymbolTouchTap={this.onSymbolTouchTap} />


        </div>
      <MuiThemeProvider  muiTheme={myTheme}>
        <div>
            <div>
            <NavBarBottom
                onFilterChanged={ this.onFilterChanged }
                filter={this.state.filter}
                onSymbolTouchTap={this.onSymbolTouchTap}
             />
             </div>

            <Popover
                open={this.state.popoverOpened}
                anchorEl={this.state.anchorEl}
                targetOrigin={{horizontal: 'left', vertical: 'top'}}
                anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
                onRequestClose={this.handleRequestClosePopover}
            >

                <Menu onItemTouchTap={ this.onMenuItemTouchTap }>
                    <MenuItem primaryText="cnbc.com" value="cnbc.com"
                        innerDivStyle={{paddingLeft: '50px',background: 'url(/static/imgs/stockmenu/cnbc25.png) no-repeat 10px 50%'}} />
                    <MenuItem primaryText="stocktwits.com" value="stocktwits.com"
                        innerDivStyle={{paddingLeft: '50px',background: 'url(/static/imgs/stockmenu/stocktwits25x25.png) no-repeat 10px 50%'}} />
                    <MenuItem primaryText="marketwatch.com" value="marketwatch.com"
                        innerDivStyle={{paddingLeft: '50px',background: 'url(/static/imgs/stockmenu/marketwatch25.png) no-repeat 10px 50%'}} />
                    <MenuItem primaryText="seekingalpha.com" value="seekingalpha.com"
                        innerDivStyle={{paddingLeft: '50px',background: 'url(/static/imgs/stockmenu/seekingalpha25.png) no-repeat 10px 50%'}} />
                </Menu>
            </Popover>
        </div>
      </MuiThemeProvider>


      </div>
    );
  }
});


module.exports = App;
