// send out an AJAX to the server
const sendAjax = (type, action, data, success) => {
  $.ajax({
    cache: false,
    type: type,
    url: action,
    data: data,
    dataType: "json",
    success: success,
    error: function(xhr, status, error) {
      var messageObj = JSON.parse(xhr.responseText);
      pageRenderer.handleError(messageObj.error);
    },
  });
};

// popup react class, really handy
const PopupClass = React.createClass({
  render: function() { // render out the children
    return(
      <div ref="self" className="popupContainer" onClick={this.handleClick}>
        {this.props.children}
      </div>
    );
  },
  propTypes: { // unmoount is required
    unMount: React.PropTypes.func.isRequired,
  },
  handleClick: function(e) { // only allow clicks on the background
    if (e.target === this.refs.self) {
      this.props.unMount();
    }
  },
});

const SwitchClass = React.createClass({
  render: function() {
    return(
      <label className="GUIswitch">
        <input type="checkbox" defaultChecked={this.props.checked} onChange={this.props.handleClick}/>
        <div>{this.props.checked ? this.props.on : this.props.off}</div>
      </label>
    );
  },
  propTypes: {
    checked: React.PropTypes.bool.isRequired,
    handleClick: React.PropTypes.func.isRequired,
    on: React.PropTypes.string,
    off: React.PropTypes.string,
  },
  getDefaultProps: () => {return{
    checked: false,
    on: "On",
    off: "Off",
  }},
});