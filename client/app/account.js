// POST a login
const handleLogin = (e) => {
  e.preventDefault();
  
  // validate
  if($("#user").val() == '' || $("#pass").val() == '') {
    pageRenderer.handleError("Username or password is empty");
    return false;
  }
  
  // POST to the server
  sendAjax('POST', $("#accountForm").attr("action"), $("#accountForm").serialize(), pageRenderer.handleAccount);
  
  return false;
};

// POST a signup
const handleSignup = (e) => {
  e.preventDefault();
  
  // validate
  if($("#user").val() == '' || $("#pass").val() == '' || $("#pass2").val() == '') {
    pageRenderer.handleError("All fields are required");
    return false;
  }
  
  // validate pass
  if($("#pass").val() == '' || $("#pass").val() !== $("#pass2").val()) {
    pageRenderer.handleError("Passwords do not match");
    return false;
  }
  
  // POST to the server
  sendAjax('POST', $("#accountForm").attr("action"), $("#accountForm").serialize(), pageRenderer.handleAccount);
  
  return false;
};

// show the account management GUI
const renderAccount = function() {
  // toggle between login and signup
  function toggleForm() {
    this.setState({type: this.state.type === 'login' ? 'signup' : 'login'});
  }
  
  // bind it
  toggleForm = toggleForm.bind(this);
  
  // if logged in, show the manager
  if (this.props.loggedIn) {
    return (
      <ul id="account">
        <li className="GUIbutton" onClick={() => pageRenderer.handlePageChange("/" + this.props.username)}>Profile</li>
        <li className="GUIbutton" onClick={this.handleLogout}>Log Out</li>
        <li className="GUIbutton" onClick={this.props.openSettings}>Settings</li>
      </ul>
    );
  }
  
  // otherwise show login/signup form
  return (
    <div id="accountLogger">
      <form id="accountForm"
            name="signupForm"
            onSubmit={this.state.type === 'login' ? handleLogin : handleSignup}
            action={"/" + this.state.type}
            method="POST"
      >
        <input id="user" type="text" name="username" placeholder="username"/>
        <input id="pass" type="password" name="pass" placeholder="password"/>
        {this.state.type === 'signup' ? <input id="pass2" type="password" name="pass2" placeholder="retype password"/> : null}
        <input type="hidden" name="_csrf" value={this.props.csrf}/>
        <input type="submit" value={this.state.type === 'login' ? "Log In" : "Sign Up"}/>
      </form>
      {this.state.type === 'login' ?
        <button onClick={toggleForm}>Register</button>
        :
        <button onClick={toggleForm}>Cancel</button>
      }
    </div>
  );
};

// the account manager class
const AccountClass = React.createClass({
  render: renderAccount,
  getInitialState: () => {
    return {type: 'login'};
  },
  handleLogout: () => sendAjax('GET', '/logout', null, pageRenderer.handleAccount),
});