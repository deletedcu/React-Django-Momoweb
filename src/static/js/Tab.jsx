'use strict';

import IconButton from 'material-ui/IconButton';
import Divider from 'material-ui/Divider';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import React, {Component} from 'react';
import FontIcon from 'material-ui/FontIcon';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import {
  TableFooter,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';
import TableBody from './CustomTableBody';
import Table from './CustomTable';

import Promise from 'promise-polyfill';
import 'whatwg-fetch'
import Cookies from 'universal-cookie';

if (!window.Promise) {
  window.Promise = Promise;
}

const cookies = new Cookies();


var classNames = require('classnames');


class SimpleAlert extends Component {
    state = {
        open: true,
    };

    handleOpen = () => {
        this.setState({open: true});
    };

    handleClose = () => {
        this.setState({open: false});
        this.props.onClose();
    };

    render() {
        const actions = [
            <FlatButton label="Close" primary={true} onTouchTap={this.handleClose} />
        ];

        return (
            <div>
                <Dialog
                    title={this.props.title}
                    actions={actions}
                    modal={false}
                    open={this.state.open}
                    onRequestClose={this.handleClose} >
                    {this.props.content}
                </Dialog>
            </div>
        );
    }
}


var SubscribeButton = React.createClass({
  getInitialState: function() {
    return {
      subscribed: this.props.subscription.subscribed
    }
  },
  _handleClick: function() {
    var new_state = !this.state.subscribed
    this.setState({
      subscribed: new_state
    });
    this.props.changeState(this.props.group,
        this.props.subscription.name,
        new_state
    );
  },
  render: function() {
    var btnClass = classNames('subscribe-button', {
        'active': this.state.subscribed
    });

    return (
      <a className={btnClass}
         onClick={this._handleClick}
      >{this.props.subscription.name}</a>
    );
  }
});

class TabContent extends Component {
    showMessage(title, content) {
        this.setState({
            message: {
                content: content,
                title: title
            }
        });
    }

  render() {
    return (
       <ReactCSSTransitionGroup
              transitionName="tab-content"
              transitionEnterTimeout={200}
              transitionLeaveTimeout={200}
              >
          {
          this.props.visible ?
                  <div key="tab-content-wrapper" style={{ width: '100%', padding: '30px 20px 20px 20px', position: 'relative' }} >

                    <IconButton tooltip="Close" touch={true} tooltipPosition="top-left" style={{ position: 'absolute', right: '10px', top: '5px'}} onTouchTap={this.props.hide}>
                      <FontIcon className="material-icons">clear</FontIcon>
                    </IconButton>
                    {this.renderContent()}
        { this.state.message ? <SimpleAlert title={this.state.message.title}
                                    content={this.state.message.content}
                                    onClose={ () => this.setState({message: false })}
                                /> : null }

                </div>
                : null
           }
       </ReactCSSTransitionGroup>
    );
  };
}

class TabFilterContent extends TabContent {
    constructor(props) {
        super(props);
        this.state = {
            category: this.props.filter['category'],
            price: this.props.filter['price']
        };
    }

    changeSubscriptionState (fgroup, fname, fval) {
        this.props.onFilterChanged(fgroup, fname, fval);
    }

    renderContent() {
        var self = this;
        const buttons = this.state.category.map(function(subscription) {
            subscription.name = subscription.name.toUpperCase();
            return (
                <SubscribeButton
                    changeState={self.changeSubscriptionState.bind(self)}
                    subscription={subscription}
                    key={subscription.value}
                    group='category'
                />
            );
        });

        const price_filter = this.state.price.map(function(item){
            return (
                <div className="col-xs-1" key={'item-' + item.name}>
                    <SubscribeButton
                        changeState={self.changeSubscriptionState.bind(self)}
                        subscription={item}
                        key={item.name}
                        group='price'
                        />
                </div>
            )
        });
        return (
            <div>
            <div className='row left-xs' style={{padding: '5px 0px 10px 0px'}}>
                <div className='col-xs-1' style={{textAlign: 'center'}}>
                    <a className='subscribe-button'>PRICE</a>
                </div>
                <div className="col-xs-11">
                    <div className="row center-xs">{price_filter}</div>
                </div>
            </div>

            <Divider inset={false} style={{ margin: '10px 0px 10px 0px'}} />

            <div className='row'>
                {buttons}
            </div>
            </div>
        );
    }
};


class TabAlertContent extends TabContent {
    constructor(props) {
        super(props);
        const alerts = [
                {data: {id: 1, category: 'AAPL', rate: 1.5 }},
                {data: {id: 2, category: 'GOOGL', rate: 3.5 }},
                {data: {id: 3, category: 'LVS', rate: 2.1 }},
                {data: {id: 4, category: 'SHOP', rate: 7.5 } }
        ];
        let self = this;
        //alerts.unshift(self.formatItem(this.rowTpl(), 'E'));
        alerts.forEach(function(item, index, arr) {
            item = self.formatItem(item, 'R');
        });
        this.state = {
            alerts: alerts,
            selected: [],
        };
    }

    rowTpl() {
        return {data: {id: -1, category: '', rate: ''}};
    }

    formatItem(item_orig, state) {
        let item = Object.assign({}, item_orig);
        item['source'] = Object.assign({}, item['data']);
        item['error'] = {};
        item['state'] = state;
        return item;
    }

    deleteItem(index) {
        const alerts = this.state.alerts.slice();
        let self = this;
        if (alerts[index].data['id'] < 1) {
            delete alerts[index];
            self.setState({
                alerts: alerts,
                selected: []
            });
            return true;
        }
        let api_url = '/alert/' + alerts[index].data['id'] + '/';
        fetch( api_url, {
            method: 'DELETE',
            body: JSON.stringify(alerts[index].data),
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': cookies.get('csrftoken')
            },
            credentials: 'same-origin'
        }).then(function(resp) {
            if (resp.status == 200 || resp.status == 204) {
                delete alerts[index];
                self.setState({
                    alerts: alerts,
                    selected: []
                });
            } else {
                var error = new Error(resp.statusText)
                error.response = resp;
                throw error
            }
        }).catch(function(error) {
            self.showMessage('Error', 'Can\'t delete item. Interval server error.');
        });
    }

    resetItem(index) {
        const alerts = this.state.alerts.slice();
        alerts[index].data = Object.assign({}, alerts[index].source);
        if (alerts[index].data.id > 0) {
            alerts[index].state= 'R';
        }
        this.setState({
            alerts: alerts
        });
    }

    editItem(index) {
        const self = this;
        if (this.state.alerts[index].state == 'E') {
            return false;
        }

        this.state.alerts.forEach(function(v, ind, arr) {
            if (v.state == 'E') {
                self.saveItem(ind);
            }
        });
        const alerts = this.state.alerts.slice();
        alerts[index].state= 'E';
        this.setState({
            alerts: alerts
        });
    }

    validate(item, field) {
        let ok = true;
        item.error[field] = null;
        if (!item.data[field]) {
            item.error[field] = 'Field is required';
            ok = false;
        }
        return ok;
    }

    saveItem(index) {
        const alerts = this.state.alerts.slice();
        let err = false;
        let self = this;

        if (!alerts[index]['modified']) {
            alerts[index]['modified'] = false;
            self.setState({
                alerts: alerts,
                selected: []
            });
            return true;
        }

        if (!this.validate(alerts[index], 'rate')) {
            err = true;
        }
        this.validate(alerts[index], 'category');
        if (!this.validate(alerts[index], 'category')) {
            err = true;
        } else {
            alerts.forEach(function(v, ind, arr) {
                console.log(v.data.category, alerts[index].data.category, ind, index);
                if (v.data.category == alerts[index].data.category && ind != index) {
                    alerts[index].error.category = 'Duplicate entry';
                    err = true;
                }
            });
        }

        if (!err) {
            let method = 'POST';
            let api_url = '/alert/';
            let data = {
                category: alerts[index].data.category,
                rate: alerts[index].data.rate
            };
            if (alerts[index].data.id > 0) {
                method = 'PUT';
                data['id'] = alerts[index].data.id;
                api_url += data['id'] + '/';
            }
            fetch( api_url, {
                method: method,
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': cookies.get('csrftoken')
                },
                credentials: 'same-origin'
            }).then(function(resp) {
                return resp.json();
            }).then(function(data) {
                if (!data || !('id' in data)) {
                    var error = new Error(data);
                    throw error
                }
                alerts[index] = self.formatItem({data: data}, 'R');
                console.log('index == 0', index == 0, index);
                if (index == 0) {
                    //alerts.unshift(self.formatItem(self.rowTpl(), 'E'));
                }
                self.setState({
                    alerts: alerts,
                    selected: []
                });
                console.log(' ----- resp ----', data);
            }).catch(function(error) {
                self.showMessage('Error', 'Item not saved. Interval server error.');
            });
        } else {
            this.setState({
                alerts: alerts
            });
        }
    }

    componentDidMount() {
        this.loadItems();
    }

    loadItems() {
      let self = this;
      fetch(
        '/alert/', {
            'method': 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': cookies.get('csrftoken')
            },
            credentials: 'same-origin'
        }).then(function(resp) {
            if (resp.status >= 200 && resp.status < 300) {
                return resp.json();
            } else {
                var error = new Error(resp.statusText)
                error.response = resp;
                throw error;
            }
      }).then(function(data) {
        const alerts = [];
        //alerts.unshift(self.formatItem(self.rowTpl(), 'E'));

        data.forEach(function(item, index, arr) {
            alerts.push(self.formatItem({data: item}, 'R'));
        });
        console.log(' alerts ', alerts);
        self.setState({
            alerts: alerts
        });

      }).catch(function(error) {
        self.showMessage('Error', 'Can\'t load items. Interval server error.');
      });
    }

    setFieldVal(field, index, newVal) {
        const alerts = this.state.alerts.slice();
        try {
            newVal = newVal.trim();
            if (field == 'category') {
                newVal = newVal.toUpperCase();
            }
            alerts[index]['data'][field] = newVal;
            alerts[index]['modified'] = 1;
            this.validate(alerts[index], field);
            this.setState({
                alerts: alerts
            });
        } catch(e) {
            console.error(e);
        }
    }

    addNewAlertRow() {
        const alerts = this.state.alerts.slice();
        alerts.unshift(this.formatItem(this.rowTpl(), 'E'));
        this.setState({
            alerts: alerts,
        });
        setTimeout(() => {
            this.setState({
                selected: [0]
            }),
            1000
        });
    }

    isSelected(index) {
        return this.state.selected.indexOf(index) !== -1;
    }

    handleRowSelection (selectedRows, param) {
        console.log('on row selection', selectedRows, param);
        if (param == 'click_away') {
            this.setState({
              selected: selectedRows,
            });
        }
    }

    processCurrent(new_index) {
        console.log('processCurrent', this.state.selected);
        if (this.state.selected.length > 0) {
            const alerts = this.state.alerts.slice();
            let current_index = this.state.selected[0];
            let alert = this.state.alerts[current_index];
            console.log('current item', current_index, alert);
            if (alert) {
                this.saveItem(current_index);
            }
        }
        return new_index;
    }

    handleCellClick(rowNum, columnKey) {
        console.log('onCellClick', rowNum, columnKey)
        if (!this.isSelected(rowNum)) {
            rowNum = this.processCurrent(rowNum);
            this.setState({
              selected: [rowNum],
            });
        }
    }

    renderContent() {
        var self = this;
        return (
        <div className='col-xs-12'>
        <Table
          height='200px'
          fixedHeader={true}
          fixedFooter={false}
          selectable={true}
          onCellClick={ (rowNum, columnKey) => this.handleCellClick(rowNum, columnKey) }
          onRowSelection={(ind, param) => this.handleRowSelection(ind, param)}
        >
          <TableHeader
            displaySelectAll={false}
            adjustForCheckbox={false}
            enableSelectAll={false}
            selectable={true}
          >
            <TableRow>
              <TableHeaderColumn style={{ fontSize: '20px'}}>Symbol</TableHeaderColumn>
              <TableHeaderColumn style={{ fontSize: '20px'}}>Sensitivity</TableHeaderColumn>
              <TableHeaderColumn style={{textAlign: 'right'}}>
                    <FlatButton label="New alert" primary={true} onTouchTap={() => self.addNewAlertRow() } />
              </TableHeaderColumn>
            </TableRow>
          </TableHeader>
          <TableBody
            displayRowCheckbox={false}
            showRowHover={false}
            stripedRows={false}
          >

            {this.state.alerts.map( (row, index) => (
              <TableRow
                selected={self.isSelected(index)} key={row.data.id}
                selectable={true} className="alert-table-row"
              >
                <TableRowColumn style={{textAlign: 'left'}}>
                { !self.isSelected(index) ? <a href='#' onClick={() => this.editItem(index)}>{row.data.category}</a> :
                    <input className={row.error.category ? 'alert-form-input error-input' : 'alert-form-input'}
                           type="text" value={row.data.category}
                           onChange={ (evt) => self.setFieldVal('category', index, evt.target.value) }
                           onKeyPress={ (evt) => { evt.key === 'Enter' ? this.saveItem(index) : null;} }
                    />
                }
                </TableRowColumn>
                <TableRowColumn style={{textAlign: 'left'}}>
                { !self.isSelected(index) ?
                    row.data.rate :
                    <input className={row.error.rate ? 'alert-form-input error-input' : 'alert-form-input'}
                           type="number" step='0.1' value={row.data.rate}
                           onChange={ (evt) => self.setFieldVal('rate', index, evt.target.value) }
                           onKeyPress={ (evt) => { evt.key === 'Enter' ? this.saveItem(index) : null;} }
                    />
                 }
                </TableRowColumn>
                <TableRowColumn style={{textAlign: 'right'}}>
                    <IconButton touch={true} onTouchTap={ () => this.deleteItem(index) }>
                        <FontIcon className="material-icons">clear</FontIcon>
                    </IconButton>
                </TableRowColumn>
              </TableRow>
              ))}
          </TableBody>
        </Table>
        </div>
        );
    }
};

class TabPopularContent extends TabContent {
    constructor(props) {
        super(props);
        this.state = {
            items: [],
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.visible && nextProps.visible != this.props.visible) {
            this.loadItems();
        }
    }

    loadItems() {
        let self = this;
        fetch('/top/', {
            'method': 'GET',
            headers: { 'Content-Type': 'application/json',},
            credentials: 'same-origin'
        }).then(function(resp) {
            if (resp.status >= 200 && resp.status < 300) {
                return resp.json();
            } else {
                var error = new Error(resp.statusText)
                error.response = resp;
                throw error;
            }
        }).then(function(data) {
            let items = [];
            items.push({data: data['data'].group0 || [], iconStyle: {fontSize: '32px'} });
            items.push({data: data['data'].group1 || [], iconStyle: {fontSize: '27px'} });
            items.push({data: data['data'].group2 || [], iconStyle: {fontSize: '17px'} });

            self.setState({
                items: items
            });
        }).catch(function(error) {
            console.error(error);
            self.showMessage('Error', 'Can\'t load popular items. Interval server error.');
        });
    }

    renderContent() {
        const self = this;
        const items = this.state.items.map( (row, index) => (
                    <div key={index}>
                        <div className='row left-xs' style={{padding: '5px 0px 10px 0px'}}>
                            <div className='col-xs-1' style={{textAlign: 'center', fontWeight: 'bold'}}>
                                <FontIcon style={row.iconStyle} className="material-icons">stars</FontIcon>
                            </div>
                            <div className="col-xs-11">
                                <div className="row">
                                    {row.data.map( (item, item_index) => (
                                        <div key={item} className="col-xs">
                                            <div className="box-row" style={{textAlign: 'center'}}>
                                                <a href='#'
                                                style={{textDecoration: 'none', color: '#BFBFBF'}}
                                                onClick={(evt)=> self.props.onSymbolTouchTap(evt, item)}
                                                onTouchTap={(evt)=> self.props.onSymbolTouchTap(evt, item)}>
                                                    {item}
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        { index < 2 ?
                            <div className='row left-xs' style={{padding: '5px 0px 10px 0px'}}>
                                <div className="col-xs-offset-1 col-xs-11">
                                    <Divider inset={false} style={{ margin: '10px 0px 10px 0px'}} />
                                </div>
                            </div>
                        : null}
                    </div>
                ));
        return (
            <div>{items}</div>
        );
    }
}

class TabQuoteContent extends TabContent {
    constructor(props) {
        super(props);
        const items = [
                {data: {id: 1, symbol: 'AAPL', last: 240.5, high: 250.5, low: 323.5, vol: 353.039 }},
                {data: {id: 2, symbol: 'GOOGL', last: 240.5, high: 250.5, low: 323.5, vol: 353.039 }},
                {data: {id: 3, symbol: 'LVS', last: 240.5, high: 250.5, low: 323.5, vol: 353.039 }},
                {data: {id: 4, symbol: 'SHOP', last: 240.5, high: 250.5, low: 323.5, vol: 353.039 } }
        ];
        let self = this;
        this.state = {
            items: items
        };
    }

    rowTpl() {
        return {data: {id: -1, symbol: ''}, state: 'E'};
    }

    deleteItem(index) {
        const items = this.state.items.slice();
        let self = this;
        let api_url = '/quote/' + items[index].data['id'] + '/';
        fetch( api_url, {
            method: 'DELETE',
            body: JSON.stringify(items[index].data),
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': cookies.get('csrftoken')
            },
            credentials: 'same-origin'
        }).then(function(resp) {
            if (resp.status == 200 || resp.status == 204) {
                delete items[index];
                self.setState({
                    items: items
                });
            } else {
                var error = new Error(resp.statusText)
                error.response = resp;
                throw error
            }
        }).catch(function(error) {
            self.showMessage('Error', 'Can\'t delete item. Interval server error.');
        });
    }

    validate(item, field) {
        let ok = true;
        if(!item.error) {
            item.error = {};
        } else {
            item.error[field] = null;
        }
        if (!item.data[field]) {
            item.error[field] = 'Field is required';
            ok = false;
        }
        return ok;
    }

    parseQuoteData(s) {
        let arr = s.split(',')
        return {
            last: Math.round(arr[5]*1000)/1000,
            high: Math.round(arr[9]*1000)/1000,
            low: Math.round(arr[13]*1000)/1000,
            vol: Math.round(arr[17]*1000)/1000
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.visible && nextProps.visible != this.props.visible) {
            this.loadQuoteData(true);
        }
    }

    loadQuoteData(force) {
        if(!this.props.visible && !force) {
            console.log('===== loadQuoteData disabled, tab not visible =====');
            return false;
        }
        console.log('===== loadQuoteData =====');
        const self = this;
        const items = this.state.items.slice();
        console.log('---------- items ----------', items);
        items.forEach(function(v, ind, arr) {
            let api_url = '/quote_fake/?symbol=' + v.data.symbol;
              fetch(api_url, {
                    method: 'GET',
                    mode: 'response',
                }).then(function(resp) {
                    console.log('RESSSPPP STATUS', resp.status);
                    if (resp.status >= 200 && resp.status < 300) {
                        return resp.text();
                    } else {
                        var error = new Error(resp.statusText)
                        error.response = resp;
                        throw error;
                    }
              }).then(function(content) {
                    console.log('RESSSPPP', content);
                    let parsed = self.parseQuoteData(content);
                    items[ind].data['last'] = parsed.last;
                    items[ind].data['high'] = parsed.high;
                    items[ind].data['low'] = parsed.low;
                    items[ind].data['vol'] = parsed.vol;
                    self.setState({
                        items: items
                    });
              }).catch(function(error) {
                console.error(error);
                self.showMessage('Error', 'Can\'t load items. Interval server error.');
              });
        });
    }

    saveItem(index) {
        const items = this.state.items.slice();
        let err = false;
        let self = this;
        if (!this.validate(items[index], 'symbol')) {
            err = true;
        } else {
            items.forEach(function(v, ind, arr) {
                if (v.data.symbol == items[index].data.symbol && ind != index) {
                    items[index].error.symbol = 'Duplicate entry';
                    err = true;
                }
            });
        }

        if (!err) {
            let method = 'POST';
            let api_url = '/quote/';
            let data = {
                symbol: items[index].data.symbol,
            };
            fetch( api_url, {
                method: method,
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': cookies.get('csrftoken')
                },
                credentials: 'same-origin'
            }).then(function(resp) {
                return resp.json();
            }).then(function(data) {
                if (!data || !('id' in data)) {
                    var error = new Error(data);
                    throw error
                }
                items[index] = {data: data, state: 'R'};
                self.setState({
                    items: items
                });
                self.loadQuoteData(false);
                console.log(' ----- resp ----', data);
            }).catch(function(error) {
                self.showMessage('Error', 'Item not saved. Interval server error.');
            });
        } else {
            this.setState({
                items: items
            });
        }
    }

    componentDidMount() {
        this.loadItems();
        this.refreshQuoteDataId = setInterval(() => this.loadQuoteData(false), 30000);
    }

    componentWillUnmount() {
        if (this.refreshQuoteDataId) {
            console.log('clearInterval for refreshQuoteDataId');
            clearInterval(this.refreshQuoteDataId);
        }
    }

    loadItems() {
      let self = this;
      fetch(
        '/quote/', {
            'method': 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': cookies.get('csrftoken')
            },
            credentials: 'same-origin'
        }).then(function(resp) {
            if (resp.status >= 200 && resp.status < 300) {
                return resp.json();
            } else {
                var error = new Error(resp.statusText)
                error.response = resp;
                throw error;
            }
      }).then(function(data) {
        const items = [];
        data.forEach(function(item, index, arr) {
            items.push({data: item, state: 'R'});
        });
        console.log('!!! items !!!', items);
        self.setState({
            items: items
        });

      }).catch(function(error) {
        self.showMessage('Error', 'Can\'t load items. Interval server error.');
      });
    }

    setFieldVal(field, index, newVal) {
        const items = this.state.items.slice();
        try {
            newVal = newVal.trim();
            if (field == 'symbol') {
                newVal = newVal.toUpperCase();
            }
            console.log('item', JSON.stringify(items[index]));
            items[index]['data'][field] = newVal;
            this.validate(items[index], field);
            this.setState({
                items: items
            });
        } catch(e) {
            console.error(e);
        }
    }

    addItem() {
        const items = this.state.items.slice();
        items.unshift(this.rowTpl());
        this.setState({
            items: items
        });
    }


    renderContent() {
        var self = this;

        return (
        <div className='col-xs-12'>
        <Table
          height='200px'
          fixedHeader={true}
          fixedFooter={false}
          onRowSelection={ (sel) => this.editItem(sel[0]) }
        >

          <TableHeader
            displaySelectAll={false}
            adjustForCheckbox={false}
            enableSelectAll={false}
            selectable={false}
          >
            <TableRow>
              <TableHeaderColumn style={{ fontSize: '20px'}}>Symbol</TableHeaderColumn>
              <TableHeaderColumn style={{ fontSize: '20px'}}>Last</TableHeaderColumn>
              <TableHeaderColumn style={{ fontSize: '20px'}}>High</TableHeaderColumn>
              <TableHeaderColumn style={{ fontSize: '20px'}}>Low</TableHeaderColumn>
              <TableHeaderColumn style={{ fontSize: '20px'}}>Volume</TableHeaderColumn>
              <TableHeaderColumn style={{textAlign: 'right'}}>
                    <FlatButton label="Add quote" primary={true} onTouchTap={() => self.addItem() } />
              </TableHeaderColumn>
            </TableRow>
          </TableHeader>

          <TableBody
            displayRowCheckbox={false}
            showRowHover={false}
            stripedRows={false}
          >

            {this.state.items.map( (row, index) => (
              <TableRow key={row.data.id} selectable={false} className="alert-table-row">
                <TableRowColumn style={{textAlign: 'left'}}>
                { row.state == 'E' ?
                    <input className='alert-form-input'
                           type="text" value={row.data.symbol}
                           onChange={ (evt) => self.setFieldVal('symbol', index, evt.target.value) }
                           onKeyPress={ (evt) => { evt.key === 'Enter' ? this.saveItem(index) : null;} }
                    /> :
                    <a href='#' onClick={() => this.editItem(index)}>{row.data.symbol}</a>
                }
                </TableRowColumn>
                <TableRowColumn className='quote-item-cell' style={{textAlign: 'left'}}> {row.data.last ? row.data.last : '-'}</TableRowColumn>
                <TableRowColumn className='quote-item-cell' style={{textAlign: 'left'}}> {row.data.high ? row.data.high : '-'}</TableRowColumn>
                <TableRowColumn className='quote-item-cell' style={{textAlign: 'left'}}> {row.data.low ? row.data.low : '-'}</TableRowColumn>
                <TableRowColumn className='quote-item-cell' style={{textAlign: 'left'}}> {row.data.vol ? row.data.vol : '-'}</TableRowColumn>

                <TableRowColumn style={{textAlign: 'right'}}>
                    { row.state == 'E' ?
                    <IconButton touch={true} onTouchTap={ () => this.saveItem(index) }>
                        <FontIcon className="material-icons">save</FontIcon>
                    </IconButton> : null }

                    { row.state != 'E' ?
                    <IconButton touch={true} onTouchTap={ () => this.deleteItem(index) }>
                        <FontIcon className="material-icons">clear</FontIcon>
                    </IconButton> : null }
                </TableRowColumn>
              </TableRow>
              ))}
          </TableBody>
        </Table>
        </div>
        );
    }
}

export { TabFilterContent, TabAlertContent, TabQuoteContent, TabPopularContent };