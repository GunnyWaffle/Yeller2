// POST yell to server
const handleYell = function(e) {
  e.preventDefault();
  
  // validate
  if($("#yellMessage").val() == '') {
    pageRenderer.handleError("You can't yell nothing!");
    return false;
  }
  
  // POST to server without func
  sendAjax('POST', $("#yellForm").attr("action"), $("#yellForm").serialize());
  
  // empty the textArea
  this.setState({yell: ''});
  
  return false;
};

// allow the user to type, but only up to 140 characters
const updateYell = function(e) {
  this.setState({ yell: e.target.value.substring(0, 140) });
};

// show the yell box
const renderYellBox = function() {
  return (
    <form id="yellForm"
          onSubmit={this.handleSubmit}
          action="/yell"
          method="POST"
          className="yellForm"
    >
      <textarea id="yellTextArea" value={this.state.yell} name="message" placeholder="YELL HERE!!!" onChange={this.updateYell}></textarea>
      <input type="hidden" name="_csrf" value={this.props.csrf}/>
      <input type="submit" value={"YELL!!! - " + (140 - this.state.yell.length) + " characters left"}/>
    </form>
  );
};

// show yells
const renderYellFeed = function() {
  // fake a yell if there are none
  if(this.state.data.length === 0) {
    const date = new Date();
    return (
      <div id="yells">
        <YellClass username={"YellBot"} message="NO YELLS YET, FIX THAT!!!" createdDate={date.toString()} />
      </div>
    );
  }
  
  // populate the yell list
  const yellNodes = this.state.data.map(function(yell) {
    const date = new Date(yell.createdDate);
    
    return (
      <YellClass key={yell._id} username={yell.owner.username} message={yell.message} createdDate={date.toString()} />
    );
  });
  
  // show it
  return (
    <div id="yells">
      {yellNodes}
    </div>
  );
};

// show a yell
const renderYell = function() {
  return (
    <div className="yell">
      <p className="yellName" onClick={() => pageRenderer.handlePageChange("/" + this.props.username)}>@{this.props.username}</p>
      <p className="yellMessage">{this.props.message}</p>
      <p className="yellDate">{this.props.createdDate}</p>
    </div>
  );
};

// the yell class
const YellClass = React.createClass({
  render: renderYell,
  getDefaultProps: () => {
    return ({
      username: '',
      message: '',
      createdDate: '',
    });
  },
  propTypes: {
    username: React.PropTypes.string.isRequired,
    message: React.PropTypes.string.isRequired,
    createdDate: React.PropTypes.string.isRequired,
  },
});

// the yell box class
const YellFormClass = React.createClass({
  handleSubmit: handleYell,
  render: renderYellBox,
  getInitialState: () => { return {yell: ''}; },
  updateYell: updateYell,
});

// the yell feed class  
const YellFeedClass = React.createClass({
  // get yells from the server, given the query based on the page
  loadYellsFromServer: function(query) {
    sendAjax('GET', '/getYells', query, function(data) {
      this.setState({data: data.yells});
    }.bind(this));
  },
  getInitialState: function() {
    return {data: []};
  },
  // pre-emptively populate to avoid flicker
  componentWillReceiveProps: function(nextProps) {
    if (this.props !== nextProps) {
      this.loadYellsFromServer(nextProps.query);
    }
  },
  render: renderYellFeed,
  // update the feed every second (kinda like a chat mode)
  componentDidMount: function() {
    setInterval(function() {
      this.loadYellsFromServer(this.props.query);
    }.bind(this), 1000);
  },
});