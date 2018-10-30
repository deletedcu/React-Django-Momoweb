import React, {Component} from 'react';
import FontIcon from 'material-ui/FontIcon';
import Paper from 'material-ui/Paper';

import {Tab} from 'material-ui/Tabs';
import {TabFilterContent, TabAlertContent, TabQuoteContent, TabPopularContent} from './Tab'
import Tabs from './Tabs'

class NavBarBottom extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: -1,
      tabs: [
        {name: 'quote', value: 'quote', icon: 'trending_up'},
        {name: 'popular', value: 'popular', icon: 'stars'},
        {name: 'filter', value: 'filter', icon: 'tune'},
        {name: 'alert', value: 'alert', icon: 'add_alert'}
      ]
    };
    this.isTabVisible.bind(this);
    this.showBottmLine.bind(this);
  }

  showBottmLine = () => {
    return this.state.value == -1;
  }

  handleChange = (value) => {
    console.log(value, this.state.value);
    if (this.state.value == value) {
        value= -1;
        console.log('reset value', value);
    }
    this.setState({
      value: value,
    });
  }

  isTabVisible = (index) => {
    return this.state.value == index;
  };

  onTouchTapTab = () => {
    console.log('On touchTap event')
  };

  renderTabContent = (tab) => {
    if (tab == 'filter') {
        return (
                <TabFilterContent
                    key='filter'
                    visible={this.isTabVisible('filter')}
                    hide={() => this.handleChange(this.state.value) }
                    onFilterChanged={this.props.onFilterChanged}
                    filter={this.props.filter}
                />
        );
    } else if (tab == 'alert') {
        return (
                <TabAlertContent
                    key='alert'
                    visible={this.isTabVisible('alert')}
                    hide={() => this.handleChange(this.state.value) }
                />
        );

    } else if (tab == 'popular') {
        return (
                <TabPopularContent
                    key='popular'
                    visible={this.isTabVisible('popular')}
                    hide={() => this.handleChange(this.state.value) }
                    onSymbolTouchTap={this.props.onSymbolTouchTap}
                />
        );
    } else if (tab == 'quote') {
        return (
                <TabQuoteContent
                    key='quote'
                    visible={this.isTabVisible('quote')}
                    hide={() => this.handleChange(this.state.value) }
                />
        );
    }



    return tab;
  }


// #151515

    render() {
        var self = this;
         const tabItems = this.state.tabs.map(function(item) {
            return (
                <Tab
                  key={item.value}
                  style={{color: '#bfbfbf'}}
                  icon={<FontIcon className="material-icons">{item.icon}</FontIcon>}
                  label={item.name}
                  onTouchTap={ self.onTouchTapTab }
                  value={item.value} >
                        {self.renderTabContent(item.name)}
                  </Tab>
            );
         });
         var self = this;

        return (
            <Paper zDepth={3} style={{ position: "fixed", bottom: '0px', width: '100%' }} >
                <Tabs style={{ width: '100%'}} onChange={this.handleChange}
                        tabItemContainerStyle={{  backgroundColor: '#111' }}
                        inkBarStyle={{ height: 5}}
                        initialSelectedIndex={this.state.value}
                        value={this.state.value}
                        >
                    {tabItems}
                </Tabs>
                { this.showBottmLine()  ? <div style={{height: 3, width: '100%'}}/> : null }
            </Paper>
        );
    }
}


export default NavBarBottom;