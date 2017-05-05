"use strict";

// POST a login
var handleLogin = function handleLogin(e) {
  e.preventDefault();

  // validate
  if ($("#user").val() == '' || $("#pass").val() == '') {
    pageRenderer.handleError("Username or password is empty");
    return false;
  }

  // POST to the server
  sendAjax('POST', $("#accountForm").attr("action"), $("#accountForm").serialize(), pageRenderer.handleAccount);

  return false;
};

// POST a signup
var handleSignup = function handleSignup(e) {
  e.preventDefault();

  // validate
  if ($("#user").val() == '' || $("#pass").val() == '' || $("#pass2").val() == '') {
    pageRenderer.handleError("All fields are required");
    return false;
  }

  // validate pass
  if ($("#pass").val() == '' || $("#pass").val() !== $("#pass2").val()) {
    pageRenderer.handleError("Passwords do not match");
    return false;
  }

  // POST to the server
  sendAjax('POST', $("#accountForm").attr("action"), $("#accountForm").serialize(), pageRenderer.handleAccount);

  return false;
};

// show the account management GUI
var renderAccount = function renderAccount() {
  var _this = this;

  // toggle between login and signup
  function toggleForm() {
    this.setState({ type: this.state.type === 'login' ? 'signup' : 'login' });
  }

  // bind it
  toggleForm = toggleForm.bind(this);

  // if logged in, show the manager
  if (this.props.loggedIn) {
    return React.createElement(
      "ul",
      { id: "account" },
      React.createElement(
        "li",
        { onClick: function onClick() {
            return pageRenderer.handlePageChange("/" + _this.props.username);
          } },
        "Profile"
      ),
      React.createElement(
        "li",
        { onClick: this.handleLogout },
        "Log Out"
      ),
      React.createElement(
        "li",
        { onClick: this.props.openSettings },
        "Settings"
      )
    );
  }

  // otherwise show login/signup form
  return React.createElement(
    "div",
    { id: "accountLogger" },
    React.createElement(
      "form",
      { id: "accountForm",
        name: "signupForm",
        onSubmit: this.state.type === 'login' ? handleLogin : handleSignup,
        action: "/" + this.state.type,
        method: "POST"
      },
      React.createElement("input", { id: "user", type: "text", name: "username", placeholder: "username" }),
      React.createElement("input", { id: "pass", type: "password", name: "pass", placeholder: "password" }),
      this.state.type === 'signup' ? React.createElement("input", { id: "pass2", type: "password", name: "pass2", placeholder: "retype password" }) : null,
      React.createElement("input", { type: "hidden", name: "_csrf", value: this.props.csrf }),
      React.createElement("input", { type: "submit", value: this.state.type === 'login' ? "Log In" : "Sign Up" })
    ),
    this.state.type === 'login' ? React.createElement(
      "button",
      { onClick: toggleForm },
      "Register"
    ) : React.createElement(
      "button",
      { onClick: toggleForm },
      "Cancel"
    )
  );
};

// the account manager class
var AccountClass = React.createClass({
  displayName: "AccountClass",

  render: renderAccount,
  getInitialState: function getInitialState() {
    return { type: 'login' };
  },
  handleLogout: function handleLogout() {
    return sendAjax('GET', '/logout', null, pageRenderer.handleAccount);
  }
});
"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var PageClass = void 0;
var pageRenderer = void 0;

// render the whole website
var renderPage = function renderPage() {
  var _this = this;

  var query = undefined; // how the yell feed should query
  // the userpage the site is on
  var userPage = history.state.userPage.substr(1);

  // if not on home
  if (userPage !== "") {
    query = "username=" + userPage;
  } else if (!this.state.globalFeed) {
    // else if not in global mode, show follows
    query = "global=false";
  }

  return React.createElement(
    "div",
    null,
    React.createElement(
      "nav",
      null,
      React.createElement("img", { id: "logo", src: "/assets/img/logo.jpg", alt: "yeller logo", onClick: function onClick() {
          return _this.handlePageChange("/");
        } }),
      React.createElement(
        "div",
        { id: "errorMessage" },
        React.createElement("p", null)
      ),
      this.state.loggedIn && userPage !== "" && userPage !== this.state.username ? React.createElement(
        "div",
        { id: "userInfo" },
        React.createElement(FollowClass, { username: this.state.username, userPage: userPage, csrf: this.state.csrf }),
        React.createElement(
          "h2",
          { id: "userPageName" },
          "@",
          userPage
        )
      ) : null,
      this.state.loggedIn ? React.createElement(
        "button",
        { id: "yellButton", onClick: function onClick() {
            _this.openPopup("yell");
          } },
        "Yell!!!"
      ) : null,
      React.createElement(AccountClass, { csrf: this.state.csrf, loggedIn: this.state.loggedIn, username: this.state.username, openSettings: function openSettings() {
          _this.openPopup("settings");
        } })
    ),
    React.createElement(
      "div",
      { id: "content" },
      this.state.loggedIn && userPage === "" ? React.createElement(
        "label",
        { id: "feedSwitch" },
        React.createElement("input", { type: "checkbox", defaultChecked: this.state.globalFeed, onChange: this.handleFeedChange }),
        React.createElement(
          "div",
          { id: "feedSlider" },
          this.state.globalFeed ? "Globals" : "Follows"
        )
      ) : null,
      React.createElement(YellFeedClass, { csrf: this.state.csrf, loggedIn: this.state.loggedIn, query: query })
    ),
    this.state.yell ? React.createElement(
      PopupClass,
      { unMount: function unMount() {
          _this.closePopup("yell");
        } },
      React.createElement(YellFormClass, { csrf: this.state.csrf })
    ) : null,
    this.state.settings ? React.createElement(
      PopupClass,
      { unMount: function unMount() {
          _this.closePopup("settings");
        } },
      React.createElement(SettingsClass, { csrf: this.state.csrf, username: this.state.username })
    ) : null
  );
};

// create the website
var createPage = function createPage(csrf) {
  // the page class
  PageClass = React.createClass({
    displayName: "PageClass",

    render: renderPage,
    getInitialState: function getInitialState() {
      return {
        csrf: "", // POST token
        loggedIn: false, // is the user logged in
        globalFeed: true, // is the global feed active
        settings: false, // are the settings open
        yell: false };
    },
    componentWillMount: function componentWillMount() {
      if (!history.state) {
        var userPage = window.location.pathname;
        history.replaceState({ userPage: userPage }, "Yeller", userPage);
      }
    },
    // the user account has been modified, reflect that
    handleAccount: function handleAccount(res) {
      if (!res.error) {
        this.setState(res);
      } else {
        this.handleError(response.error);
      }
    },
    // the home page feed view has been toggled
    handleFeedChange: function handleFeedChange() {
      this.setState({ globalFeed: !this.state.globalFeed });
    },
    // the user is navigating to another userpage
    handlePageChange: function handlePageChange(userPage) {
      if (userPage !== "/YellBot" && userPage !== history.state.userPage) {
        history.pushState({ userPage: userPage }, "Yeller", userPage);
        this.handleNav();
      }
    },
    // flat out re-render the page
    handleNav: function handleNav() {
      this.setState({});
    },
    // animate the error message for an error
    handleError: function handleError(errorMessage) {
      if ($("#errorMessage").width() === 100) {
        $("#errorMessage p").text(errorMessage);
        $("#errorMessage").animate({ width: 250 }, 250);
        setTimeout(function () {
          $("#errorMessage").animate({ width: 100 }, 1000);
        }, 5000);
      }
    },
    // close the popup
    closePopup: function closePopup(popup) {
      if (this.state[popup]) {
        this.setState(_defineProperty({}, popup, false));
      }
    },
    // open the popup
    openPopup: function openPopup(popup) {
      if (!this.state[popup]) {
        this.setState(_defineProperty({}, popup, true));
      }
    }
  });

  // get the initial status of the user session
  sendAjax('GET', '/status', null, function (result) {
    // then create the website
    pageRenderer = ReactDOM.render(React.createElement(PageClass, null), document.querySelector("#page"));
    window.onpopstate = pageRenderer.handleNav;
    pageRenderer.setState(Object.assign(result, { csrf: csrf })); // double loads the page
  });
};

var getToken = function getToken() {
  sendAjax('GET', '/getToken', null, function (result) {
    createPage(result.csrf);
  });
};

// the launch point
$(document).ready(function () {
  getToken();
});
"use strict";

// the follow button
var FollowClass = React.createClass({
  displayName: "FollowClass",

  render: function render() {
    return React.createElement(
      "div",
      null,
      this.state.following ? React.createElement(
        "button",
        { id: "unfollowButton", onClick: this.handleUnfollow },
        "Unfollow"
      ) : React.createElement(
        "button",
        { id: "followButton", onClick: this.handleFollow },
        "Follow"
      )
    );
  },
  getInitialState: function getInitialState() {
    return { following: false };
  },
  componentDidMount: function componentDidMount() {
    this.update();
  },
  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    if (this.props !== nextProps) {
      this.update();
    }
  },
  update: function update() {
    // check if this userpage's user is followed
    var query = "username=" + this.props.username + "&username=" + this.props.userPage;

    sendAjax('GET', '/getRelation', query, function (relations) {
      this.setState({ following: relations[this.props.username][this.props.userPage].following });
    }.bind(this));
  },
  handleFollow: function handleFollow() {
    // follow this userpage's user
    var query = "username=" + this.props.userPage + "&_csrf=" + this.props.csrf;

    sendAjax('POST', '/follow', query, function (err) {
      if (err) {
        pageRenderer.handleError(err.error);
      } else {
        this.update();
      }
    }.bind(this));
  },
  handleUnfollow: function handleUnfollow() {
    // unfollow this userpage's user
    var query = "username=" + this.props.userPage + "&_csrf=" + this.props.csrf;

    sendAjax('POST', '/unfollow', query, function (err) {
      if (err) {
        pageRenderer.handleError(err.error);
      } else {
        this.update();
      }
    }.bind(this));
  }
});

// POST password change to server
var handlePassChange = function handlePassChange(e) {
  e.preventDefault();

  // validate
  if ($("#newPass").val() == '' || $("#newPass").val() !== $("#newPass2").val()) {
    pageRenderer.handleError("Please fill out both passwords equally");
    return false;
  }

  // send POST and clear the form afterwards
  var form = $("#changePassForm");
  sendAjax('POST', form.attr("action"), form.serialize(), function () {
    return form.find("input[type=password]").val("");
  });

  return false;
};

// POST unfollows to server
var removeFollows = function removeFollows() {
  // query checkboxes
  var names = $("#followList .follow > input:checked").next("h3");

  // if nothing is selected, back out
  if (names.length === 0) return;

  // the body
  var body = "";
  // build the body
  for (var i = 0; i < names.length; ++i) {
    body += "username=" + names[i].innerText + "&";
  }body += "_csrf=" + this.props.csrf;

  // send POST and reload follow list
  sendAjax('POST', "/unfollow", body, function () {
    this.loadFollowsFromServer();
  }.bind(this));
};

// render the settings GUI
var renderSettings = function renderSettings() {
  // list of follow items for the unfollow section
  var followNodes = this.state.follows.map(function (follow) {
    return React.createElement(
      "div",
      { key: follow, className: "follow" },
      React.createElement("input", { type: "checkbox" }),
      React.createElement(
        "h3",
        null,
        follow
      )
    );
  });

  return React.createElement(
    "div",
    null,
    React.createElement(
      "h2",
      null,
      "Change Your Password"
    ),
    React.createElement(
      "form",
      { id: "changePassForm",
        name: "changePassForm",
        onSubmit: this.handlePassChange,
        action: "/settings",
        method: "POST"
      },
      React.createElement("input", { id: "newPass", type: "password", name: "newPass", placeholder: "new password" }),
      React.createElement("input", { id: "newPass2", type: "password", name: "newPass2", placeholder: "retype new password" }),
      React.createElement("input", { type: "hidden", name: "_csrf", value: this.props.csrf }),
      React.createElement("input", { className: "formSubmit", type: "submit", value: "Change" })
    ),
    React.createElement(
      "h2",
      null,
      "Manage Your Follows"
    ),
    React.createElement(
      "div",
      { id: "followList" },
      this.state.follows.length > 0 ? followNodes : React.createElement(
        "h3",
        null,
        "You are not following anyone."
      )
    ),
    React.createElement(
      "button",
      { id: "removeFollows", onClick: this.removeFollows, disabled: this.state.follows.length === 0 },
      "Remove"
    )
  );
};

// the settings GUI
var SettingsClass = React.createClass({
  displayName: "SettingsClass",

  loadFollowsFromServer: function loadFollowsFromServer() {
    // populate unfollow manager
    sendAjax('GET', '/getFollows', "username=" + this.props.username, function (data) {
      this.setState({ follows: data.follows[this.props.username] });
    }.bind(this));
  },
  render: renderSettings,
  getInitialState: function getInitialState() {
    return { follows: [] };
  },
  handlePassChange: handlePassChange,
  removeFollows: removeFollows,
  componentDidMount: function componentDidMount() {
    this.loadFollowsFromServer();
  }
});
"use strict";

// POST yell to server
var handleYell = function handleYell(e) {
  e.preventDefault();

  // validate
  if ($("#yellMessage").val() == '') {
    pageRenderer.handleError("You can't yell nothing!");
    return false;
  }

  // POST to server without func
  sendAjax('POST', $("#yellForm").attr("action"), $("#yellForm").serialize());

  // empty the textArea
  this.setState({ yell: '' });

  return false;
};

// allow the user to type, but only up to 140 characters
var updateYell = function updateYell(e) {
  this.setState({ yell: e.target.value.substring(0, 140) });
};

// show the yell box
var renderYellBox = function renderYellBox() {
  return React.createElement(
    "form",
    { id: "yellForm",
      onSubmit: this.handleSubmit,
      action: "/yell",
      method: "POST",
      className: "yellForm"
    },
    React.createElement("textarea", { value: this.state.yell, name: "message", placeholder: "YELL HERE!!!", onChange: this.updateYell }),
    React.createElement("input", { type: "hidden", name: "_csrf", value: this.props.csrf }),
    React.createElement("input", { type: "submit", value: "YELL!!! - " + (140 - this.state.yell.length) + " characters left" })
  );
};

// show yells
var renderYellFeed = function renderYellFeed() {
  // fake a yell if there are none
  if (this.state.data.length === 0) {
    var date = new Date();
    return React.createElement(
      "div",
      { id: "yells" },
      React.createElement(YellClass, { username: "YellBot", message: "NO YELLS YET, FIX THAT!!!", createdDate: date.toString() })
    );
  }

  // populate the yell list
  var yellNodes = this.state.data.map(function (yell) {
    var date = new Date(yell.createdDate);

    return React.createElement(YellClass, { key: yell._id, username: yell.owner.username, message: yell.message, createdDate: date.toString() });
  });

  // show it
  return React.createElement(
    "div",
    { id: "yells" },
    yellNodes
  );
};

// show a yell
var renderYell = function renderYell() {
  var _this = this;

  return React.createElement(
    "div",
    { className: "yell" },
    React.createElement(
      "p",
      { className: "yellName", onClick: function onClick() {
          return pageRenderer.handlePageChange("/" + _this.props.username);
        } },
      "@",
      this.props.username
    ),
    React.createElement(
      "p",
      { className: "yellMessage" },
      this.props.message
    ),
    React.createElement(
      "p",
      { className: "yellDate" },
      this.props.createdDate
    )
  );
};

// the yell class
var YellClass = React.createClass({
  displayName: "YellClass",

  render: renderYell,
  getDefaultProps: function getDefaultProps() {
    return {
      username: '',
      message: '',
      createdDate: ''
    };
  },
  propTypes: {
    username: React.PropTypes.string.isRequired,
    message: React.PropTypes.string.isRequired,
    createdDate: React.PropTypes.string.isRequired
  }
});

// the yell box class
var YellFormClass = React.createClass({
  displayName: "YellFormClass",

  handleSubmit: handleYell,
  render: renderYellBox,
  getInitialState: function getInitialState() {
    return { yell: '' };
  },
  updateYell: updateYell
});

// the yell feed class  
var YellFeedClass = React.createClass({
  displayName: "YellFeedClass",

  // get yells from the server, given the query based on the page
  loadYellsFromServer: function loadYellsFromServer(query) {
    sendAjax('GET', '/getYells', query, function (data) {
      this.setState({ data: data.yells });
    }.bind(this));
  },
  getInitialState: function getInitialState() {
    return { data: [] };
  },
  // pre-emptively populate to avoid flicker
  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    if (this.props !== nextProps) {
      this.loadYellsFromServer(nextProps.query);
    }
  },
  render: renderYellFeed,
  // update the feed every second (kinda like a chat mode)
  componentDidMount: function componentDidMount() {
    setInterval(function () {
      this.loadYellsFromServer(this.props.query);
    }.bind(this), 1000);
  }
});
"use strict";

// send out an AJAX to the server
var sendAjax = function sendAjax(type, action, data, success) {
  $.ajax({
    cache: false,
    type: type,
    url: action,
    data: data,
    dataType: "json",
    success: success,
    error: function error(xhr, status, _error) {
      var messageObj = JSON.parse(xhr.responseText);
      pageRenderer.handleError(messageObj.error);
    }
  });
};

// popup react class, really handy
var PopupClass = React.createClass({
  displayName: "PopupClass",

  render: function render() {
    // render out the children
    return React.createElement(
      "div",
      { ref: "self", className: "popupContainer", onClick: this.handleClick },
      this.props.children
    );
  },
  propTypes: { // unmoount is required
    unMount: React.PropTypes.func.isRequired
  },
  handleClick: function handleClick(e) {
    // only allow clicks on the background
    if (e.target === this.refs.self) {
      this.props.unMount();
    }
  }
});
