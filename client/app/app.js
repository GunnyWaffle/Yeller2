let PageClass;
let pageRenderer;

// render the whole website
const renderPage = function() {  
  let query = undefined; // how the yell feed should query
  // the userpage the site is on
  const userPage = history.state.userPage.substr(1);
  
  // if not on home
  if (userPage !== "") {
    query = "username=" + userPage;
  } else if (!this.state.globalFeed) { // else if not in global mode, show follows
    query = "global=false";
  }
  
  return (
    <div>
      <nav>
        <img id="logo" src="/assets/img/logo.jpg" alt="yeller logo" onClick={() => this.handlePageChange("/")}/>
        <div id="errorMessage">
          <p></p>
        </div>
      </nav>
      <div id="userInfo">
      {this.state.loggedIn && userPage !== "" && userPage !== this.state.username ?
        <FollowClass username={this.state.username} userPage={userPage} csrf={this.state.csrf}/>
        :
        null
        }
        <h2 id="userPageName">{userPage}</h2>
      </div>
      <AccountClass csrf={this.state.csrf} loggedIn={this.state.loggedIn} username={this.state.username} openSettings={this.openSettings}/>
      {this.state.loggedIn ?
        <YellFormClass csrf={this.state.csrf} />
        :
        null
      }
      <div id="content">
        {this.state.loggedIn && userPage === "" ?
          <label id="feedSwitch">
            <input type="checkbox" defaultChecked={this.state.globalFeed} onChange={this.handleFeedChange}/>
            <div id="feedSlider">{this.state.globalFeed ? "Globals" : "Follows"}</div>
          </label>
          :
          null
        }
        <YellFeedClass csrf={this.state.csrf} loggedIn={this.state.loggedIn} query={query} />
      </div>
      {this.state.settingsOpen ?
        <PopupClass unMount={this.closeSettings}>
          <SettingsClass csrf={this.state.csrf} username={this.state.username}/>
        </PopupClass>
        :
        null
      }
    </div>
  );
};

// create the website
const createPage = function(csrf) {
  // the page class
  PageClass = React.createClass({
    render: renderPage,
    getInitialState: () => {return {
      csrf: "", // POST token
      loggedIn: false, // is the user logged in
      globalFeed: true, // is the global feed active
      settingsOpen: false, // are the settings open
    }},
    componentWillMount: function () {
      if (!history.state) {
        const userPage = window.location.pathname;
        history.replaceState({userPage}, "Yeller", userPage);
      }
    },
    // the user account has been modified, reflect that
    handleAccount: function(res) {
      if (!res.error) {
        this.setState(res);
      } else {
        this.handleError(response.error);
      }
    },
    // the home page feed view has been toggled
    handleFeedChange: function() {
      this.setState({globalFeed: !this.state.globalFeed});
    },
    // the user is navigating to another userpage
    handlePageChange: function(userPage) {
      if (userPage !== "/YellBot" && userPage !== history.state.userPage) {
        history.pushState({userPage}, "Yeller", userPage);
        this.handleNav();
      }
    },
    // flat out re-render the page
    handleNav: function() {
      this.setState({});
    },
    // animate the error message for an error
    handleError: function(errorMessage) {
      if ($("#errorMessage").width() === 100) {
        $("#errorMessage p").text(errorMessage);
        $("#errorMessage").animate({width: 250}, 250);
        setTimeout(() => {
          $("#errorMessage").animate({width: 100}, 1000);
        }, 5000);
      }
    },
    // close the settings popup
    closeSettings: function() {
      if (this.state.settingsOpen) {
        this.setState({settingsOpen: false});
      }
    },
    // open the settings popup
    openSettings: function() {
      if (!this.state.settingsOpen) {
        this.setState({settingsOpen: true});
      }
    },
  });
  
  // get the initial status of the user session
  sendAjax('GET', '/status', null, (result) => {
    // then create the website
    pageRenderer = ReactDOM.render(
      <PageClass />, document.querySelector("#page")
    );
    window.onpopstate = pageRenderer.handleNav;
    pageRenderer.setState(Object.assign(result, {csrf})); // double loads the page
  });
};

const getToken = () => {
  sendAjax('GET', '/getToken', null, (result) => {
    createPage(result.csrf);
  });
};

// the launch point
$(document).ready(function() {
  getToken();
});