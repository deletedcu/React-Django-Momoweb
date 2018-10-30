import getMuiTheme from 'material-ui/styles/getMuiTheme';
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
var _colors = require('material-ui/styles/colors');


const muiTheme = getMuiTheme({
  fontFamily: 'Lato, sans-serif',
  palette: {
    textColor: '#BFBFBF',
    canvasColor: _colors.grey900,
  },
  tableRow: {
    selectedColor: '#1e1e1e',
  },
  tabs: {
    height: 50,
//    backgroundColor: palette.primary1Color,
  },
  inkBar: {
      backgroundColor: '#73B101',
  },
  textField: {
      textColor: _colors.white,
      floatingLabelColor: _colors.white,
      focusColor: '#73B101'
  },
    flatButton: {
      primaryTextColor: '#73B101'
  }
});

module.exports = muiTheme;
