// the follow button
const FollowClass = React.createClass({
  render: function() {
    return (
      <div>
        {this.state.following ?
          <button id="unfollowButton" onClick={this.handleUnfollow}>Unfollow</button>
          :
          <button id="followButton" onClick={this.handleFollow}>Follow</button>
        }
      </div>
    );
  },
  getInitialState: () => {return {following: false};},
  componentDidMount: function() {
    this.update();
  },
  componentWillReceiveProps: function(nextProps) {
    if (this.props !== nextProps) {
      this.update();
    }
  },
  update: function() { // check if this userpage's user is followed
    const query = "username=" + this.props.username + "&username=" + this.props.userPage;
    
    sendAjax('GET', '/getRelation', query, function(relations) {
      this.setState({following: relations[this.props.username][this.props.userPage].following});
    }.bind(this));
  },
  handleFollow: function() { // follow this userpage's user
    const query = "username=" + this.props.userPage + "&_csrf=" + this.props.csrf;
    
    sendAjax('POST', '/follow', query, function(err) {
      if (err) {
        pageRenderer.handleError(err.error);
      } else {
        this.update();
      }
    }.bind(this));
  },
  handleUnfollow: function() { // unfollow this userpage's user
    const query = "username=" + this.props.userPage + "&_csrf=" + this.props.csrf;
    
    sendAjax('POST', '/unfollow', query, function(err) {
      if (err) {
        pageRenderer.handleError(err.error);
      } else {
        this.update();
      }
    }.bind(this));
  },
});

// POST password change to server
const handlePassChange = function(e){
  e.preventDefault();
  
  // validate
  if($("#newPass").val() == '' || $("#newPass").val() !== $("#newPass2").val()) {
    pageRenderer.handleError("Please fill out both passwords equally");
    return false;
  }
  
  // send POST and clear the form afterwards
  const form = $("#changePassForm");
  sendAjax('POST', form.attr("action"), form.serialize(), () => form.find("input[type=password]").val(""));
  
  return false;
};

// POST unfollows to server
const removeFollows = function() {
  // query checkboxes
  const names = $("#followList .follow > input:checked").next("h3");
  
  // if nothing is selected, back out
  if (names.length === 0)
    return;

  // the body
  let body = "";
  // build the body
  for(let i = 0; i < names.length; ++i)
    body += "username=" + names[i].innerText + "&";
  
  body += "_csrf=" + this.props.csrf;
  
  // send POST and reload follow list
  sendAjax('POST', "/unfollow", body, function() {
    this.loadFollowsFromServer();
  }.bind(this));
};

// render the settings GUI
const renderSettings = function() {
  // list of follow items for the unfollow section
  const followNodes = this.state.follows.map((follow) => {
    return(
      <div key={follow} className="follow">
        <input type="checkbox" />
        <h3>{follow}</h3>
      </div>
    );
  });
  
  return(
    <div>
      <h2>Change Your Password</h2>
      <form id="changePassForm"
            name="changePassForm"
            onSubmit={this.handlePassChange}
            action="/settings"
            method="POST"
      >
        <input id="newPass" type="password" name="newPass" placeholder="new password"/>
        <input id="newPass2" type="password" name="newPass2" placeholder="retype new password"/>
        <input type="hidden" name="_csrf" value={this.props.csrf}/>
        <input className="formSubmit" type="submit" value="Change"/>
      </form>
      <h2>Manage Your Follows</h2>
      <div id="followList">
        {this.state.follows.length > 0 ? followNodes : <h3>You are not following anyone.</h3>}
      </div>
      <button id="removeFollows" onClick={this.removeFollows} disabled={this.state.follows.length === 0}>Remove</button>
    </div>
  );
};

// the settings GUI
const SettingsClass = React.createClass({
  loadFollowsFromServer: function() { // populate unfollow manager
    sendAjax('GET', '/getFollows', "username=" + this.props.username, function(data) {
      this.setState({follows: data.follows[this.props.username]});
    }.bind(this));
  },
  render: renderSettings,
  getInitialState: () => {return {follows: []}},
  handlePassChange: handlePassChange,
  removeFollows: removeFollows,
  componentDidMount: function() {
    this.loadFollowsFromServer();
  },
});